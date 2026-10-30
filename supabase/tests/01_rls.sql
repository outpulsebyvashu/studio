-- Row level security and rule tests. Run with scripts/test-db.sh.
\set ON_ERROR_STOP on
\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''
\set C '''cccccccc-0000-0000-0000-000000000003'''

create function public.test_assert(ok boolean, msg text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'FAIL: %', msg using errcode = 'XX999'; end if;
  raise notice 'ok - %', msg;
end $$;
grant execute on function public.test_assert(boolean, text) to authenticated, anon;

insert into auth.users (id, email, raw_user_meta_data) values
  (:A, 'a@example.com', '{"full_name":"Alice"}'),
  (:B, 'b@example.com', '{"full_name":"Bala"}'),
  (:C, 'c@example.com', '{"full_name":"Chitra"}');
update public.profiles set mobile = '9876543210', mobile_verified_at = now() where id = :A;
update public.profiles set mobile = '9876543211', mobile_verified_at = now() where id = :B;
do $$ begin
  begin update public.profiles set mobile = '9876543210', mobile_verified_at = now() where id = 'cccccccc-0000-0000-0000-000000000003';
    perform public.test_assert(false, 'duplicate verified mobile must fail');
  exception when unique_violation then perform public.test_assert(true, 'one verified mobile number per account'); end;
end $$;
select public.test_assert((select count(*) = 3 from public.profiles), 'trigger creates a profile per user');
select public.test_assert((select full_name = 'Alice' from public.profiles where id = :A), 'profile gets the full name');

-- ===== user A =====
select set_config('request.jwt.claim.sub', :A, false);
set role authenticated;
do $$ declare ws uuid; begin
  ws := public.create_workspace('Alice and Co', 'alice-co', 'ca', 'Mysuru');
  perform public.test_assert(ws is not null, 'A creates a practice');
  perform public.test_assert((select count(*) = 1 from public.workspaces), 'A sees exactly one workspace');
  perform public.test_assert((select count(*) = 1 from public.memberships where role = 'owner'), 'A is owner');
  perform public.test_assert((select step = 2 from public.onboarding_progress), 'onboarding starts at step 2');
  perform public.test_assert((select count(*) = 1 from public.audit_log where action = 'workspace.created'), 'creation is audited');
end $$;
do $$ begin
  begin perform public.create_workspace('Second', 'alice-two', 'ca');
    perform public.test_assert(false, 'second practice must fail');
  exception when sqlstate 'P0001' then perform public.test_assert(true, 'A cannot own a second practice'); end;
end $$;
do $$ begin
  begin insert into public.workspaces (name, slug, profession, created_by) values ('Direct', 'direct-ins', 'ca', auth.uid());
    perform public.test_assert(false, 'direct insert must fail');
  exception when insufficient_privilege then perform public.test_assert(true, 'direct workspace insert is blocked'); end;
end $$;
do $$ declare n int; begin
  update public.workspaces set name = 'Alice and Company';
  get diagnostics n = row_count;
  perform public.test_assert(n = 1, 'owner can rename own practice');
  begin update public.workspaces set plan = 'studio';
    perform public.test_assert(false, 'plan change must fail');
  exception when insufficient_privilege then perform public.test_assert(true, 'owner cannot change own plan'); end;
  begin update public.workspaces set slug = 'taken-over';
    perform public.test_assert(false, 'slug change must fail');
  exception when insufficient_privilege then perform public.test_assert(true, 'owner cannot change slug directly'); end;
  begin update public.profiles set mobile_verified_at = null;
    perform public.test_assert(false, 'verification change must fail');
  exception when insufficient_privilege then perform public.test_assert(true, 'user cannot edit own verification status'); end;
  begin perform 1 from public.otp_codes;
    perform public.test_assert(false, 'otp read must fail');
  exception when insufficient_privilege then perform public.test_assert(true, 'otp codes are not readable by users'); end;
  begin perform 1 from public.platform_admins;
    perform public.test_assert(false, 'admin list read must fail');
  exception when insufficient_privilege then perform public.test_assert(true, 'admin list is not readable by users'); end;
  begin insert into public.memberships (workspace_id, user_id, role) select id, auth.uid(), 'staff' from public.workspaces;
    perform public.test_assert(false, 'membership insert must fail');
  exception when insufficient_privilege then perform public.test_assert(true, 'users cannot add memberships'); end;
  perform public.test_assert(public.is_platform_admin() = false, 'A is not a platform admin');
  insert into public.consents (user_id, document, version) values (auth.uid(), 'terms', '2026-10');
  perform public.test_assert((select count(*) = 1 from public.consents), 'consent is recorded');
  begin insert into public.consents (user_id, document, version) values ('bbbbbbbb-0000-0000-0000-000000000002', 'terms', '2026-10');
    perform public.test_assert(false, 'consent for others must fail');
  exception when sqlstate '42501' then perform public.test_assert(true, 'cannot record consent for someone else'); end;
end $$;
reset role;

-- ===== user B (another tenant) =====
select set_config('request.jwt.claim.sub', :B, false);
set role authenticated;
do $$ declare ws uuid; n int; begin
  perform public.test_assert((select count(*) = 0 from public.workspaces), 'B sees none of A''s workspaces');
  perform public.test_assert((select count(*) = 0 from public.memberships), 'B sees none of A''s memberships');
  perform public.test_assert((select count(*) = 0 from public.onboarding_progress), 'B sees none of A''s onboarding');
  perform public.test_assert((select count(*) = 0 from public.audit_log), 'B sees none of A''s audit log');
  perform public.test_assert((select count(*) = 0 from public.consents), 'B sees none of A''s consents');
  perform public.test_assert((select count(*) = 1 from public.profiles), 'B sees only own profile');
  update public.workspaces set name = 'Hijacked';
  get diagnostics n = row_count;
  perform public.test_assert(n = 0, 'B cannot rename A''s practice');
  update public.onboarding_progress set step = 6;
  get diagnostics n = row_count;
  perform public.test_assert(n = 0, 'B cannot change A''s onboarding');
  begin perform public.create_workspace('Reserved', 'admin', 'ca');
    perform public.test_assert(false, 'reserved slug must fail');
  exception when check_violation then perform public.test_assert(true, 'reserved slugs are rejected'); end;
  begin perform public.create_workspace('Bad Slug', 'Bad_Slug!', 'ca');
    perform public.test_assert(false, 'bad slug must fail');
  exception when check_violation then perform public.test_assert(true, 'malformed slugs are rejected'); end;
  begin perform public.create_workspace('Dup', 'alice-co', 'ca');
    perform public.test_assert(false, 'duplicate slug must fail');
  exception when unique_violation then perform public.test_assert(true, 'duplicate slugs are rejected'); end;
  begin perform public.create_workspace('Wrong', 'bala-co', 'astronaut');
    perform public.test_assert(false, 'bad profession must fail');
  exception when check_violation then perform public.test_assert(true, 'unknown professions are rejected'); end;
  ws := public.create_workspace('Bala Advisory', 'bala-advisory', 'advisor');
  perform public.test_assert(ws is not null, 'B creates a separate practice');
  perform public.test_assert((select count(*) = 1 from public.workspaces), 'B now sees only their own workspace');
end $$;
reset role;

-- ===== user C (mobile not verified) =====
select set_config('request.jwt.claim.sub', :C, false);
set role authenticated;
do $$ begin
  begin perform public.create_workspace('Chitra', 'chitra-co', 'coach');
    perform public.test_assert(false, 'unverified must fail');
  exception when sqlstate 'P0001' then perform public.test_assert(true, 'unverified mobile cannot create a practice'); end;
end $$;
reset role;

-- ===== staff member can read but not edit =====
insert into public.memberships (workspace_id, user_id, role)
  select id, :C, 'staff' from public.workspaces where slug = 'alice-co';
select set_config('request.jwt.claim.sub', :C, false);
set role authenticated;
do $$ declare n int; begin
  perform public.test_assert((select count(*) = 1 from public.workspaces), 'staff can read the practice');
  update public.workspaces set name = 'Staff edit';
  get diagnostics n = row_count;
  perform public.test_assert(n = 0, 'staff cannot edit the practice');
  perform public.test_assert((select count(*) = 0 from public.audit_log), 'staff cannot read the audit log');
end $$;
reset role;

-- ===== anonymous =====
set role anon;
do $$ begin
  begin perform 1 from public.workspaces;
    perform public.test_assert(false, 'anon read must fail');
  exception when insufficient_privilege then perform public.test_assert(true, 'anonymous visitors cannot read workspaces'); end;
end $$;
reset role;
select 'ALL DATABASE TESTS PASSED' as result;
