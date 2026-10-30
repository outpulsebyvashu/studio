import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Email links (password reset) come back here with ?code=... and we turn it into a session.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const rawNext = req.nextUrl.searchParams.get('next') ?? '/dashboard';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'; // no open redirects
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, req.url));
  }
  return NextResponse.redirect(new URL('/login', req.url));
}
