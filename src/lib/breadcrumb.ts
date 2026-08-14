/**
 * The trail shown under a page's title.
 *
 * Built from the address, but not blindly. A URL segment is not always a page:
 * `/programs/bsc-name` reads as though `/programs` exists, and it does not, so
 * turning every segment into an anchor sent anyone who clicked the middle of
 * the trail to a 404. A section listed here without a page is still shown, so
 * the structure reads the same; it simply is not a link.
 *
 * And a slug is not a title. `student-society/faq` became "Faq", and
 * `waiver-scholarship` became "Waiver Scholarship", neither of which is what
 * the menu calls them. The labels below are the menu's own words, so the trail
 * and the navigation agree.
 *
 * The last crumb takes the page's title rather than its slug, which is what
 * makes a person, a programme or a news item read properly at the end of the
 * trail without a label for every one of them.
 */

export interface Crumb {
  label: string;
  /** Absent when the section has no page of its own; rendered as plain text. */
  href?: string;
}

const SECTIONS: Record<string, { label: string; hasPage: boolean }> = {
  /* Sections with a landing page of their own. */
  about: { label: 'About', hasPage: true },
  admission: { label: 'Admission', hasPage: true },
  'student-society': { label: 'Student Society', hasPage: true },
  'faculty-member': { label: 'Faculty Member', hasPage: true },
  news: { label: 'News', hasPage: true },
  events: { label: 'Events', hasPage: true },

  /* A programme is reached from the menu and from the home page; there is no
     index page listing them. */
  programs: { label: 'Programs', hasPage: false },
};

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function buildTrail(pathname: string, pageTitle: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);

  return segments.map((segment, index) => {
    const isLast = index === segments.length - 1;
    if (isLast) return { label: pageTitle || slugToTitle(segment) };

    const section = SECTIONS[segment];
    const label = section?.label ?? slugToTitle(segment);

    /* Unknown segments keep the old behaviour and stay links: a section added
       later should not silently lose its trail entry, and a wrong link is
       easier to notice than a missing one. */
    if (section && !section.hasPage) return { label };

    return { label, href: '/' + segments.slice(0, index + 1).join('/') };
  });
}
