import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { required } from '../env.ts';

/** Supabase client bound to the signed-in user's cookies. Row level security applies. */
export async function createClient() {
  const store = await cookies();
  return createServerClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a server component */ }
      },
    },
  });
}
