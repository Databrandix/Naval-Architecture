// Phase 17 — shared renderer for the structured legal-page sections.
// Reads the Json columns of LegalPagesContent (privacySections /
// termsSections), tolerates malformed shapes, and outputs the same
// markup pattern as the existing AboutOverview / ContactPageContent
// renderers — full Container width, brand-styled headings + prose.

type Section = {
  heading?: string | null;
  paragraphs: string[];
};

function coerceSections(raw: unknown): Section[] {
  if (!Array.isArray(raw)) return [];
  const out: Section[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const r = item as Record<string, unknown>;
    const heading =
      typeof r.heading === 'string' && r.heading.trim().length > 0
        ? r.heading.trim()
        : null;
    const paragraphs = Array.isArray(r.paragraphs)
      ? r.paragraphs.filter(
          (p): p is string => typeof p === 'string' && p.trim().length > 0,
        )
      : [];
    if (!heading && paragraphs.length === 0) continue;
    out.push({ heading, paragraphs });
  }
  return out;
}

export default function LegalSections({ sections }: { sections: unknown }) {
  const list = coerceSections(sections);
  if (list.length === 0) return null;

  return (
    <div className="legal-body">
      {list.map((section, i) => (
        <section key={i}>
          {section.heading && <h2>{section.heading}</h2>}
          {section.paragraphs.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
