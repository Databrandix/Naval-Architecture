# Sonargaon University — EEE Department

A modern site for the Electrical and Electronics Engineering department at Sonargaon University. Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Motion** for animations.

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout (Navbar + Footer wrapper)
│   │   ├── page.tsx          # Homepage (composes all sections)
│   │   └── globals.css       # Global styles + Tailwind theme
│   ├── components/
│   │   ├── layout/           # Navbar, Footer
│   │   ├── sections/         # Homepage section components
│   │   └── ui/               # Reusable UI primitives (Button, Container, SectionTitle)
│   └── lib/
│       └── data.ts           # Static content (programs, news, events, etc.)
├── public/
│   └── assets/               # Images and static files
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

## Adding a New Page

Create a folder under `src/app/`:

```
src/app/programs/page.tsx     →  /programs
src/app/contact/page.tsx      →  /contact
```

Each page automatically inherits the `Navbar` and `Footer` from `src/app/layout.tsx`.

## Development

**Prerequisites:** Node.js 18.18+

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:3000)
npm run dev

# Production build
npm run build
npm start

# Type check
npm run typecheck
```
