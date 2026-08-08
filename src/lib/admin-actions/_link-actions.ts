// Shared FormData helpers for chrome link actions.
// (Not a generic CRUD layer — Prisma model delegates have
//  intricate types that don't share a useful supertype.)

export type ActionResult = { ok: true } | { ok: false; error: string };

export function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

export function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export function readBoolCheckbox(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === 'on' || v === 'true' || v === '1';
}

export type LinkRow = {
  name: string;
  href: string | null;
  isExternal: boolean;
  isDisabled: boolean;
};

export function readLinkRow(fd: FormData): LinkRow {
  return {
    name:       getStr(fd, 'name'),
    href:       emptyToNull(fd.get('href')),
    isExternal: readBoolCheckbox(fd, 'isExternal'),
    isDisabled: readBoolCheckbox(fd, 'isDisabled'),
  };
}

export function validateLinkRow(row: LinkRow): ActionResult | null {
  if (!row.name) return { ok: false, error: 'Name is required' };
  if (row.name.length > 200) return { ok: false, error: 'Name too long (max 200)' };
  return null;
}
