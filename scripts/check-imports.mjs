// Cheap safety net while packages cannot be installed: every relative or @/ import must point at a real file.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
const root = resolve(new URL('..', import.meta.url).pathname);
const skip = new Set(['node_modules', '.next', '.git', 'tests', 'supabase']);
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { if (skip.has(f)) continue; const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) && files.push(p); } })(root);
const exts = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
let bad = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    let base = null;
    if (spec.startsWith('@/')) base = join(root, spec.slice(2));
    else if (spec.startsWith('.')) base = resolve(dirname(f), spec);
    if (!base) continue;
    if (!exts.some((e) => existsSync(base + e) && statSync(base + e).isFile())) { console.log(`BROKEN import "${spec}" in ${f.replace(root + '/', '')}`); bad++; }
  }
}
console.log(bad ? `${bad} broken import(s)` : `imports ok (${files.length} files)`);
process.exit(bad ? 1 : 0);
