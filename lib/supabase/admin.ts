import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { required } from '../env.ts';

/** Service role client. Bypasses row level security. Server code only, and only for what users must not do themselves. */
export function createAdminClient() {
  return createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
