# Mobile Navbar — Logo Swap & Quick Access Button

**Date:** 2026-05-06
**Status:** Approved (user verbal approval received)

## Goal

Improve mobile navbar usability by:
1. Replacing the wide horizontal SU logo with a compact square shield icon on mobile (the wide logo gets cramped on narrow screens).
2. Surfacing the existing Quick Access grid (currently desktop-only when scrolled) on mobile via a dedicated button.

## Changes

### 1. Logo swap (mobile vs desktop)

- **Mobile (`< lg`):** `/assets/su-shield-icon.png` — square SU crest, `h-10` tall (slightly larger when not scrolled)
- **Desktop (`lg+`):** unchanged `/assets/su-colour-logo.png` (wide horizontal wordmark)
- Implementation: two `<img>` tags inside the same `<a>`, toggled with `block lg:hidden` / `hidden lg:block`
- Source file: `Z:\Source\Sonargaon University\Asset\Logo\4x\Fev icon white4@4x.png` (despite the name, this file contains the colored shield crest — works on white backgrounds)

### 2. Mobile Quick Access button

- **Placement:** right-side cluster, immediately before the existing hamburger toggle, visible only on `<lg` screens (`lg:hidden`)
- **Style:** same `LayoutGrid` icon as the desktop scrolled-state button — `bg-blue-50`, rounded, primary-colored icon
- **Behavior on tap:** opens a fullscreen-width dropdown panel (right-aligned under the navbar) showing the existing `quickAccess` grid — all 9 items: Library, Admission, Photo, Notice, ERP, IQAC, Skill Jobs, Convoc. Reg., Verification
- **Grid:** 3 columns × 3 rows. Each cell: large icon stacked above a short label, generous tap target (~p-4)
- **Mutual exclusion:** opening Quick Access closes the hamburger menu; opening hamburger closes Quick Access — never both at once

### 3. State

New `useState` flag in Navbar: `mobileQuickAccessOpen: boolean`.
- Toggling it must call `setMobileMenuOpen(false)`.
- Toggling `mobileMenuOpen` must call `setMobileQuickAccessOpen(false)`.

## Files Touched

- `public/assets/su-shield-icon.png` — new file, copied from Z drive source
- `src/components/layout/Navbar.tsx`:
  - Add second `<img>` for mobile logo with responsive show/hide
  - Add `LayoutGrid` button + dropdown panel scoped to mobile
  - Add `mobileQuickAccessOpen` state and mutual-close handlers

## Out of Scope

- Desktop navbar behavior — unchanged
- Mobile menu overlay content — unchanged (same nav links, Apply Now, ERP Login)
- `quickAccess` data — unchanged (existing 9 items reused)
- Logo rendering on tablets/desktops — unchanged
