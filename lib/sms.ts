import 'server-only';

/**
 * Sends one SMS. NOTE: the request body below is a best guess. Check StartMessaging's
 * documentation for the exact URL, auth header and field names before going live.
 * In development with no key set, the message is printed to the server console instead.
 */
export async function sendSms(mobile: string, text: string): Promise<void> {
  const url = process.env.STARTMESSAGING_API_URL;
  const key = process.env.STARTMESSAGING_API_KEY;
  if (!url || !key) {
    if (process.env.NODE_ENV !== 'production') { console.log(`[dev sms] to ${mobile}: ${text}`); return; }
    throw new Error('SMS provider is not configured.');
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ to: `91${mobile}`, message: text }),
  });
  if (!res.ok) throw new Error(`SMS provider answered ${res.status}`);
}
