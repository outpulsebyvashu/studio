'use client';
import { useState } from 'react';
import { slugify } from '@/lib/slug';

/** Practice name + address fields. The address follows the name until the user edits it. */
export function NameAndSlug({ defaultName = '', defaultSlug = '' }: { defaultName?: string; defaultSlug?: string }) {
  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(defaultSlug || slugify(defaultName));
  const [touched, setTouched] = useState(Boolean(defaultSlug));
  return (
    <>
      <div className="f">
        <label htmlFor="f-name">Practice name</label>
        <input id="f-name" name="name" required maxLength={80} value={name} placeholder="[Practice name]"
          onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value)); }} />
      </div>
      <div className="f">
        <label htmlFor="f-slug">Your free address</label>
        <input id="f-slug" name="slug" required maxLength={40} value={slug} autoCapitalize="none" autoCorrect="off" spellCheck={false}
          onChange={(e) => { setTouched(true); setSlug(e.target.value.toLowerCase()); }} aria-describedby="f-slug-h" />
        <small id="f-slug-h">{slug || 'yourname'}.outpulse.studio</small>
      </div>
    </>
  );
}
