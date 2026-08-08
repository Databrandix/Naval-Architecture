import * as LucideIcons from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';

// Phase 20 — Dynamic Lucide icon renderer.
//
// Server-renderable on purpose: NO 'use client' directive. The public
// renderers under (public)/ are all server components (Phase 18 ISR),
// and this needs to render inside them without forcing a client
// boundary. Inline-imports the full Lucide namespace once per server
// instance; the actual JS payload sent to the browser is just the
// resolved SVG markup, since server components don't ship JS to the
// client.
//
// Lucide@0.546.x exports each icon twice (`Foo` and `FooIcon` alias),
// so the resolver tries the bare name first, then the `Icon` suffix
// form, and finally a HelpCircle fallback. PascalCase names are the
// only convention the resolver recognises — admin helper text in
// IconInputField documents this for editors.

const lib = LucideIcons as unknown as Record<string, LucideIcon | undefined>;

export function DynamicLucideIcon({
  name,
  ...rest
}: { name: string } & LucideProps) {
  const Icon = lib[name] ?? lib[`${name}Icon`] ?? LucideIcons.HelpCircle;
  return <Icon {...rest} />;
}

// Used by IconInputField for live validation feedback.
export function hasIcon(name: string): boolean {
  if (!name) return false;
  return lib[name] != null || lib[`${name}Icon`] != null;
}
