// Pure search types + scorer. Lives in its own module so client
// components (Navbar, SearchOverlay) can import without pulling
// in the server-only Prisma client via @/lib/search-index.
//
// Server boundary is in src/lib/search-index.ts (getSearchIndex).
// The client receives the full SearchItem[] as a prop and runs
// search() locally for sub-millisecond filtering on keystroke.

export interface SearchItem {
  title: string;
  description?: string;
  href: string;
  type:
    | 'Page'
    | 'Faculty'
    | 'News'
    | 'FAQ'
    | 'Lab'
    | 'Club'
    | 'Alumni'
    | 'Research'
    | 'Transport'
    | 'Event'
    | 'Notice'
    | 'Program'
    | 'ResearchArea'
    | 'Gallery'
    // Phase 7
    | 'Visitor'
    | 'Syllabus'
    // Phase 8a
    | 'AdmissionNotice'
    | 'Prospectus'
    // Phase 8b
    | 'Fees'
    // Phase 8c
    | 'TransferCredits'
    | 'WaiverCategory'
    | 'Scholarship';
}

// Pure scorer — runs client-side. Items come in as a prop from the
// server-rendered layout (Decision F2). Score: prefix match (4) >
// title-includes (3) > description-includes (+1).
export function search(query: string, items: readonly SearchItem[], limit = 20): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = items
    .map((item) => {
      const title = item.title.toLowerCase();
      const desc = (item.description || '').toLowerCase();
      let score = 0;
      if (title.includes(q)) score += title.startsWith(q) ? 4 : 3;
      if (desc.includes(q)) score += 1;
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
  return scored;
}
