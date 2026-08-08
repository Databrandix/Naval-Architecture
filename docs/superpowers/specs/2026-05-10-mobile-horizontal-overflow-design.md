# Mobile Horizontal Overflow Fix — Design

**Date:** 2026-05-10
**Topic:** Site-wide right-side gap on mobile viewport
**Status:** Approved, ready for implementation

## Problem

On mobile, every page shows a thin gap on the right edge of the viewport. The page content is shifted slightly, footer included. The gap appears on initial load (refresh) and persists.

In `/about/mecha-club`, the "Building a Professional Network" card additionally clips the "Alumni Portal" button text — clear evidence that the buttons row overflows the card on narrow phones.

## Root cause

Two compounding issues:

1. **`overflow-x: hidden` is only on `body`, not `html`.** Browsers can still let the html element grow wider than the viewport when a descendant overflows, which produces a visible right-edge gap even though body content is clipped.
2. **Mecha Club button row uses `flex` (row) on mobile** with two `whitespace-nowrap` buttons that don't fit at 360–390 px viewport widths. The overflow propagates up despite body's clip and is the most obvious source.

## Approved approach (Approach C)

Apply both a defensive global guard and the targeted Mecha Club fix.

### Change 1 — Global guard

In `src/app/globals.css`, add `overflow-x: clip` to `html` inside the existing `@layer base`:

```css
@layer base {
  html {
    overflow-x: clip;
  }
  body {
    @apply font-sans antialiased text-secondary-dark bg-white overflow-x-hidden;
    /* ... existing rules unchanged */
  }
}
```

`clip` is preferred over `hidden` because it neither reserves a scrollbar gutter nor breaks `position: sticky` on descendants.

### Change 2 — Mecha Club buttons

In `src/app/about/mecha-club/page.tsx`, update the button group className:

```diff
- <div className="flex lg:flex-col gap-3 shrink-0">
+ <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
```

Behaviour by breakpoint:

- **<640 px** — stacked vertically (no overflow)
- **640–1023 px** — side-by-side (fits at this width)
- **≥1024 px** — stacked vertically again, since the parent grid already places this column on the right

### Out of scope

- Faculty / admission / news pages: no known specific overflow source. The defensive html guard will cover any incidental overflow on those pages without further code changes. We will verify in dev after Change 1 lands.
- Re-architecting the dark-card full-bleed pattern (`-mx-4 sm:mx-0`) introduced in the previous mobile-responsive pass — those changes stand; the current bug is not caused by them.

## Verification

1. Dev server smoke test on mecha-club at 375 px viewport: no gap, both buttons fully visible and stacked.
2. Spot-check 3+ other pages (mission-vision, message-from-head, deans-message, faculty-member): no right-edge gap.
3. `npx tsc --noEmit` clean.

If any page still shows a gap after Change 1+2, we will repeat root-cause investigation on that page (out of scope here).
