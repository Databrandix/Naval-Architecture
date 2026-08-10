/**
 * Rewrites another department's name to this one.
 *
 * Several pages on this site carry Sonargaon University policy rather than
 * departmental content — admission rules, credit transfer, waivers. Those are
 * identical across faculties, so the importers copy them from a sibling
 * department's database instead of retyping text that students act on.
 *
 * Copied text occasionally names its source department. This rewrites those
 * mentions and records each one, so a run that changes wording says so out
 * loud — a silent rewrite is how "Mechanical Engineering Research Bulletin",
 * a real journal, once became a journal that does not exist.
 */

/** Longest form first, so the short code cannot eat the middle of a full name. */
const RENAMES: [RegExp, string][] = [
  [
    /Department of Mechanical Engineering/g,
    'Department of Naval Architecture and Marine Engineering',
  ],
  [/Mechanical Engineering/g, 'Naval Architecture and Marine Engineering'],
  [/\bME\b/g, 'NAME'],
];

export class DepartmentRenamer {
  private readonly seen: string[] = [];

  /** Rewrites a single string, recording any substitution it makes. */
  text = (value: string): string => {
    let out = value;
    for (const [pattern, replacement] of RENAMES) {
      // `.test()` on a /g regex is stateful and skips matches on later calls;
      // build a fresh non-global regex for the check.
      if (new RegExp(pattern.source).test(out)) {
        this.seen.push(`${pattern.source} → ${replacement}`);
        out = out.replace(pattern, replacement);
      }
    }
    return out;
  };

  /** Rewrites every string nested anywhere inside a Json column's value. */
  deep = (value: unknown): unknown => {
    if (typeof value === 'string') return this.text(value);
    if (Array.isArray(value)) return value.map(this.deep);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, this.deep(v)]),
      );
    }
    return value;
  };

  /** Prints what was rewritten — or confirms that nothing needed to be. */
  report = (): void => {
    if (this.seen.length === 0) {
      console.log('  no department names appeared in the source text');
      return;
    }
    console.log(`  renamed: ${this.seen.length}`);
    for (const s of new Set(this.seen)) console.log(`    ${s}`);
  };
}

/** Reads the source connection string, refusing to fall back to a literal. */
export function sourceDatabaseUrl(): string {
  const url = process.env.ME_DATABASE_URL;
  if (!url) {
    // Deliberately not defaulted — a connection string is a credential, and
    // one written into the repository is a leaked credential.
    throw new Error(
      'Set ME_DATABASE_URL to the Mechanical Engineering connection string before running this.',
    );
  }
  return url;
}
