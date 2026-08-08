# Transport Service Page — Design Spec

**Date:** 2026-05-04
**Status:** Approved (pending user review of this doc)

## Goal

Create a Transport Service page documenting Sonargaon University's free bus service (10 routes), and wire the existing homepage "Transport Service" card to it with a real campus photo.

## Route & Linking

- New page at `/transport-service` (top-level; doesn't fit cleanly under existing about/admission/student-society parents)
- Homepage `ServicesSection` card "Transport Service" → links to `/transport-service` and uses the new local image
- No navbar entry — homepage card is the entry point (matches existing pattern for campus services)

## Page Structure (top → bottom)

1. **Hero** — `PageShell` with title "Transport Service", overline "Campus Services", breadcrumb. Hero image: same DSC01671.JPG.
2. **Intro paragraph** — short welcome describing that SU provides comprehensive bus service covering major routes.
3. **Free Service highlight** — accent-colored banner band: "Free university bus services covering major city areas and outskirts — Mograpara, Gauchhia, Kadamtali, Abdullahpur, Savar."
4. **Bus Routes & Timings (card grid)** — one card per route. Card content:
   - Route name (e.g., "Technical → SU") as card heading with primary color
   - Bus number (chip/pill style)
   - Contact number (clickable `tel:` link)
   - Departure to SU (one or more times, shown as time chips)
   - Return from SU (one time, shown as chip; "—" if empty)
   - Grid: 1 col mobile, 2 col tablet, 3 col desktop
5. **Important Instructions** — bordered info section with three items:
   - **Pick-up Points** — confirm with driver/supervisor
   - **Special Service** — dedicated Mohakhali bus 6 days/week at 08:00 AM, contact 01958-642587
   - **Free Service** — restate the free coverage areas

Sections from reference screenshot intentionally **omitted**:
- "Get Your Transport Pass" — no pass system in the user content
- "Transport Fees" table — service is free

## Data Model (`src/lib/transport-data.ts`)

```ts
export interface BusRoute {
  id: string;
  routeName: string;            // "Technical → SU"
  busNumber: string;            // "Dhaka Metro-J 11-2657"
  contact: string;              // "01958-642577"
  departureTimes: string[];     // ["07:00 AM", "10:30 AM"]
  returnTimes: string[];        // ["04:45 PM"] or []
}

export const busRoutes: BusRoute[] = [ /* 10 entries */ ];
```

Routes from user content (parsed as):
1. Technical → SU — Dhaka Metro-J 11-2657 — 01958-642577 — 07:00 AM, 10:30 AM | 04:45 PM
2. Mograpara → SU — Dhaka Metro-B 11-7251 — 01958-642578 — 06:20 AM | 12:40 PM
3. Mograpara → SU — Dhaka Metro-B 15-3688 — 01958-642579 — 09:40 AM | 04:45 PM
4. Gauchhia → SU — Dhaka Metro-B 8451 — 01958-642580 — 06:20 AM | 04:45 PM
5. Savar → SU — Dhaka Metro-J 11-3124 — 01958-642581 — 07:00 AM | 04:45 PM
6. Abdullahpur → SU — Dhaka Metro 14-1615 — 01958-642582 — 06:40 AM | 12:40 PM
7. Abdullahpur → SU — Dhaka Metro-B 11-8421 — 01958-642593 — 09:45 AM | 04:45 PM
8. Kuril → SU — Dhaka Metro-B 11-7357 — 01958-642587 — 06:55 AM, 10:00 AM | 04:45 PM
9. Chashara → SU — Dhaka Metro-B 15-1651 — 01958-642594 — 06:45 AM | —
10. Kadamtali → SU — Dhaka Metro-B 15-7176 — 01958-642592 — 07:00 AM | 01:20 PM

## Files Touched

- `src/app/transport-service/page.tsx` — new server component (with metadata)
- `src/lib/transport-data.ts` — new typed data file
- `public/assets/transport/dsc01671.jpg` — copied from `C:\su asset\DSC01671.JPG`
- `src/lib/data.ts` — edit `campusServices` Transport entry: swap image URL, add `href: '/transport-service'`
- `src/components/sections/ServicesSection.tsx` — render the card as `<a>` when `href` is present

## Theme Conventions

- `PageShell` for hero + breadcrumb
- `Container` for content width
- Primary navy + button-yellow accent
- Card style consistent with FAQ/Alumni cards (rounded-xl, white bg, border, hover shadow)
- Time chips use small rounded badges with primary text on light bg
- `motion` fade-in for cards (matches other list pages)
