-- outpulse studio: Stage 1 schema. Accounts, workspaces, consent, OTP, audit.
-- Every workspace-owned table must enable RLS and use is_member()/is_owner().

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  mobile text,
  mobile_verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- a verified mobile number belongs to one account only
create unique index profiles_verified_mobile_unique on public.profiles (mobile) where mobile_verified_at is not null;

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create function public.slug_reserved(s text) returns boolean
language sql immutable as $$
  select s = any (array['www','app','api','admin','portal','mail','email','smtp','ftp','help','support','status',
    'blog','docs','dashboard','login','signup','static','assets','cdn','studio','outpulse','billing','pay','payments',
    'secure','security','legal','terms','privacy','about','pricing','features','contact','demo','test','staging','dev']);
$$;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique
    check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' and not public.slug_reserved(slug)),
  profession text not null check (profession in
    ('ca','consultant','developer','advisor','doctor','lawyer','coach','other')),
  city text,
  plan text not null default 'free' check (plan in ('free','solo','practice','studio')),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.memberships (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner','staff')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create unique index one_owned_workspace_per_user on public.memberships (user_id) where role = 'owner';

create table public.onboarding_progress (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  step int not null default 1 check (step between 1 and 6),
  data jsonb not null default '{}'::jsonb
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, document, version)
);

create table public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mobile text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index otp_codes_user_created on public.otp_codes (user_id, created_at desc);

create table public.audit_log (
  id bigint generated always as identity primary key,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- helpers (security definer so policies do not recurse)
create function public.is_member(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships m where m.workspace_id = ws and m.user_id = auth.uid());
$$;
create function public.is_owner(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships m
    where m.workspace_id = ws and m.user_id = auth.uid() and m.role = 'owner');
$$;
create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins a where a.user_id = auth.uid());
$$;

-- new auth user -> profile row
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- the only way to create a workspace
create function public.create_workspace(p_name text, p_slug text, p_profession text, p_city text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ws uuid;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if not exists (select 1 from public.profiles p where p.id = uid and p.mobile_verified_at is not null) then
    raise exception 'verify your mobile number first' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.memberships m where m.user_id = uid and m.role = 'owner') then
    raise exception 'you already own a practice' using errcode = 'P0001';
  end if;
  insert into public.workspaces (name, slug, profession, city, created_by)
  values (trim(p_name), lower(trim(p_slug)), p_profession, nullif(trim(p_city), ''), uid)
  returning id into ws;
  insert into public.memberships (workspace_id, user_id, role) values (ws, uid, 'owner');
  insert into public.onboarding_progress (workspace_id, step) values (ws, 2);
  insert into public.audit_log (workspace_id, actor_id, action, detail)
  values (ws, uid, 'workspace.created', jsonb_build_object('slug', lower(trim(p_slug))));
  return ws;
end;
$$;

-- privileges: authenticated users get only what they need
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.workspaces, public.memberships, public.audit_log to authenticated;
grant update (name, city, profession) on public.workspaces to authenticated;
grant select, update on public.onboarding_progress to authenticated;
grant select, insert on public.consents to authenticated;
grant execute on function public.create_workspace(text, text, text, text) to authenticated;
grant execute on function public.is_member(uuid), public.is_owner(uuid), public.is_platform_admin() to authenticated;
grant execute on function public.slug_reserved(text) to anon, authenticated;

-- row level security
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.consents enable row level security;
alter table public.otp_codes enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_self_read on public.profiles for select using (id = auth.uid());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy ws_member_read on public.workspaces for select using (public.is_member(id));
create policy ws_owner_update on public.workspaces for update using (public.is_owner(id)) with check (public.is_owner(id));

create policy mem_member_read on public.memberships for select using (public.is_member(workspace_id));

create policy onb_member_read on public.onboarding_progress for select using (public.is_member(workspace_id));
create policy onb_owner_update on public.onboarding_progress for update
  using (public.is_owner(workspace_id)) with check (public.is_owner(workspace_id));

create policy consent_self_read on public.consents for select using (user_id = auth.uid());
create policy consent_self_insert on public.consents for insert with check (user_id = auth.uid());

create policy audit_owner_read on public.audit_log for select using (public.is_owner(workspace_id));
-- otp_codes and platform_admins: no policies and no grants. Server (service role) only.

-- Supabase already grants these by default; kept so local test databases behave the same.
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;
