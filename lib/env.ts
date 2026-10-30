const PLACEHOLDER = /YOUR_|YOUR-|CHANGE_ME/;
export function required(name: string): string {
  const v = process.env[name];
  if (!v || PLACEHOLDER.test(v)) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill in real values.`);
  }
  return v;
}
export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
