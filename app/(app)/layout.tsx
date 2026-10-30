import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Guards every signed-in page: needs a session, a verified mobile and a finished setup.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('mobile_verified_at').eq('id', user.id).single();
  if (!profile?.mobile_verified_at) redirect('/verify');
  const { data: ob } = await supabase.from('onboarding_progress').select('step').maybeSingle();
  if (!ob) redirect('/onboarding/1');
  if (ob.step < 6) redirect(`/onboarding/${Math.min(ob.step, 5)}`);
  return <>{children}</>;
}
