/**
 * Shapes for the free-form sections of a teacher's profile.
 *
 * A section on a faculty page is a paragraph, a list of points, or a set of
 * headed lists — publications grouped by kind, qualifications by degree. The
 * types live here because they describe the Json columns on Faculty; the data
 * itself comes from the database.
 *
 * They used to sit in faculty-data.ts alongside a hard-coded roster of another
 * department's staff, which the site stopped reading when the faculty moved
 * into the database. Keeping the types and dropping the roster leaves nothing
 * in the repository claiming to be this department's people.
 */

/** A point in a list — plain text, or text with a link (a DOI, a profile). */
export type SectionItem = string | { text: string; url?: string };

export type SectionContent =
  | string
  | SectionItem[]
  | { heading: string; items: SectionItem[] }[];
