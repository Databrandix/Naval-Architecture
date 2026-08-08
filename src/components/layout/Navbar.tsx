'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Menu, X, Search, Facebook, Linkedin,
  User, ChevronDown, ChevronRight, LayoutGrid,
  GraduationCap, CheckCircle,
} from 'lucide-react';

// Lucide's Youtube icon is an outline-style mark; at the top bar's
// tiny size (12–14px) with fill applied it collapses into an
// unrecognisable blob. Use the official brand "play-in-rounded-
// rectangle" path instead so the icon reads at a glance.
const YoutubeBrandIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
import Container from '../ui/Container';
import SearchOverlay from './SearchOverlay';
import { DynamicLucideIcon } from '../ui/DynamicLucideIcon';
import type { SearchItem } from '@/lib/search';

// Phase 20 — QuickAccessItem.iconName now resolves against the full
// Lucide library via the shared DynamicLucideIcon. Unknown names
// fall back to HelpCircle inside the renderer.

// ─────────────────────────────────────────────────────────────────
//  DB-driven shapes — match the cache() selects in lib/identity.ts
// ─────────────────────────────────────────────────────────────────

type TopLinkRow = {
  id: string;
  name: string;
  href: string | null;
  isExternal: boolean;
  isDisabled: boolean;
};

type QuickAccessRow = {
  id: string;
  name: string;
  href: string | null;
  iconName: string;
  isExternal: boolean;
  isDisabled: boolean;
};

type MainNavItemRow = {
  id: string;
  name: string;
  href: string;
  isExternal: boolean;
  isDisabled: boolean;
};

type MainNavGroupRow = {
  id: string;
  name: string;
  href: string | null;
  hasDropdown: boolean;
  title: string | null;
  items: MainNavItemRow[];
};

// Top-bar socials. Subset of UniversityIdentity's full social field
// set — the top bar only renders 3 icons (FB / LinkedIn / YouTube);
// the footer renders the full 8. Both sources of truth are the same
// UniversityIdentity singleton, editable via /admin/university-identity.
type TopBarSocials = {
  facebookUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl:  string | null;
};

type NavbarProps = {
  logoUrl: string;
  applyUrl: string;
  topLinks: readonly TopLinkRow[];
  quickAccessItems: readonly QuickAccessRow[];
  mainNav: readonly MainNavGroupRow[];
  searchItems: readonly SearchItem[];
  topBarSocials: TopBarSocials;
};

export default function Navbar({
  logoUrl,
  applyUrl,
  topLinks,
  quickAccessItems,
  mainNav,
  searchItems,
  topBarSocials,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);

  const toggleMobileSection = (name: string) => {
    setOpenMobileSection((prev) => (prev === name ? null : name));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll while the mobile drawer OR the search overlay is open
  // (both cover the viewport on mobile; without this the page scrolls behind them).
  useEffect(() => {
    if (!mobileMenuOpen && !searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileMenuOpen, searchOpen]);

  // Mobile drawer "Quick Links" derives from the main_nav Admission
  // group children (Phase 3 Decision 3 — no separate table). If
  // Admission group is absent for any reason, fall back to empty.
  const mobileQuickLinks: MainNavItemRow[] =
    mainNav.find((g) => g.name === 'Admission')?.items ?? [];

  return (
    <nav className="fixed w-full z-[60] flex flex-col transition-all duration-300">
      {/* 1. TOP BAR */}
      <div className={`hidden md:flex items-center overflow-hidden transition-all duration-500 ${isScrolled ? 'h-0 opacity-0' : 'h-10 opacity-100'}`}>
        {/* Left Side - Magenta Background */}
        <div className="flex-grow bg-accent h-full flex items-center pr-4">
          <Container className="w-full !max-w-[1600px] flex items-center">
            <div className="flex items-center gap-1 text-[11px] text-white/90 font-medium">
              {topLinks.map((link, idx) => (
                <div key={link.id} className="flex items-center">
                  <a
                    href={link.isDisabled || !link.href ? '#' : link.href}
                    {...(link.isExternal && link.href && { target: '_blank', rel: 'noopener noreferrer' })}
                    className={`px-2 relative group uppercase tracking-wider transition-colors ${
                      link.isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'
                    }`}
                    aria-disabled={link.isDisabled || undefined}
                  >
                    {link.name}
                  </a>
                  {idx < topLinks.length - 1 && <span className="opacity-30">|</span>}
                </div>
              ))}
            </div>
          </Container>
        </div>

        {/* Right Side - Socials with Dark Blue Background. URLs come
            from UniversityIdentity (editable via /admin/university-identity)
            — same source the footer's social icons use. A null URL
            hides that entry instead of rendering an inert link. */}
        <div className="bg-primary h-full flex items-center px-10">
          <div className="flex items-center gap-6 text-white text-[11px] font-medium">
            {topBarSocials.facebookUrl && (
              <a href={topBarSocials.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-accent transition-colors">
                <Facebook size={12} fill="currentColor" />
                <span className="uppercase tracking-widest">Facebook</span>
              </a>
            )}
            {topBarSocials.linkedinUrl && (
              <a href={topBarSocials.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-accent transition-colors">
                <Linkedin size={12} fill="currentColor" />
                <span className="uppercase tracking-widest">LinkedIn</span>
              </a>
            )}
            {topBarSocials.youtubeUrl && (
              <a href={topBarSocials.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-accent transition-colors">
                <YoutubeBrandIcon size={14} />
                <span className="uppercase tracking-widest">Youtube</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE BAR - Logo & Action Buttons.
          `relative z-[60]` keeps the bar (and its hamburger/X) above the
          mobile drawer (`z-[55]`) inside this nav's stacking context.
          Without an explicit z-index, the scrolled state's `backdrop-blur-md`
          creates a stacking context that traps the button's `z-[70]` below
          the drawer, hiding the X. */}
      <div className={`relative z-[60] transition-all duration-500 border-b ${isScrolled ? 'bg-white/95 backdrop-blur-md border-gray-50 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.02)]' : 'bg-white border-gray-100 py-4'}`}>
        <Container className="flex justify-between items-center !max-w-[1600px]">
          {/* Logo */}
          <a href="/" aria-label="Sonargaon University — Home" className="flex items-center shrink-0">
            <Image
              src={logoUrl}
              alt="Sonargaon University"
              width={400}
              height={120}
              priority
              className={`${isScrolled ? 'h-7 md:h-8' : 'h-8 md:h-9 xl:h-10'} w-auto max-w-[52vw] object-contain transition-all duration-500`}
            />
          </a>

          {/* Compact Scroll Navigation — only render when scrolled */}
          {isScrolled && (
            <div className="hidden lg:flex items-center justify-center gap-0.5 xl:gap-1">
              {mainNav.map((group) => (
                <NavGroup key={group.id} group={group} compact />
              ))}
            </div>
          )}

          {/* Right side: Secondary buttons + Apply Now + Mobile toggle */}
          <div className="flex items-center gap-1 lg:gap-3 -mr-3 lg:mr-0">
            <div className={`flex items-center gap-3 ${isScrolled ? 'lg:hidden' : ''}`}>
              <a
                href={resolveQuickAccessHref(quickAccessItems, 'ERP')}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xl:flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-bold whitespace-nowrap transition-all shadow-sm border border-gray-100"
              >
                <User size={16} className="text-accent" />
                ERP
              </a>
              <a
                href={resolveQuickAccessHref(quickAccessItems, 'Convoc. Reg.')}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xl:flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-bold whitespace-nowrap transition-all shadow-sm border border-gray-100"
              >
                <GraduationCap size={16} className="text-accent" />
                Convoc. Reg.
              </a>
              <a
                href={resolveQuickAccessHref(quickAccessItems, 'Verification')}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-bold whitespace-nowrap transition-all shadow-sm border border-gray-100"
              >
                <CheckCircle size={16} className="text-accent" />
                Verification
              </a>
            </div>

            {/* Apply Now */}
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-2 px-3 lg:px-3 xl:px-5 py-2 xl:py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-xs lg:text-xs xl:text-sm font-bold whitespace-nowrap transition-all shadow-md hover:shadow-lg hover:brightness-110 shrink-0"
            >
              Apply Now
            </a>

            {/* Quick Access grid — only shown when scrolled */}
            {isScrolled && (
              <div className="hidden lg:block group relative">
                <button
                  aria-label="Quick access"
                  className="p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-primary transition-colors border border-blue-100"
                >
                  <LayoutGrid size={20} />
                </button>
                <div className="invisible absolute right-0 top-full z-50 mt-2 w-[320px] translate-y-2 rounded-xl border border-gray-100 bg-white p-3 opacity-0 shadow-premium transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="grid grid-cols-3 gap-1">
                    {quickAccessItems.map((item) => {
                      const isLive = !!item.href && !item.isDisabled;
                      return (
                        <a
                          key={item.id}
                          href={isLive ? item.href! : '#'}
                          {...(item.isExternal && isLive && { target: '_blank', rel: 'noopener noreferrer' })}
                          className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg text-center transition-colors hover:bg-accent/5 ${
                            !isLive ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          aria-disabled={!isLive || undefined}
                        >
                          <DynamicLucideIcon name={item.iconName} size={22} className="text-primary" />
                          <span className="text-[12px] font-medium text-gray-700 leading-tight">{item.name}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Search Toggle */}
            {!mobileMenuOpen && (
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="lg:hidden p-2 text-primary relative z-[70]"
              >
                <Search size={24} />
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 text-primary relative z-[70]"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </Container>
      </div>

      {/* 3. BOTTOM BAR - Nav Links */}
      {!isScrolled && (
        <div className="bg-white/95 backdrop-blur-md hidden lg:block border-b border-gray-50 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <Container className="!max-w-[1600px]">
            <div className="flex items-center h-14">
              <div className="mx-auto flex items-center justify-center gap-0.5 xl:gap-1">
                {mainNav.map((group) => (
                  <NavGroup key={group.id} group={group} />
                ))}
              </div>
            </div>
          </Container>
        </div>
      )}

      {/* Mobile Menu */}
      {/* Backdrop */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 bg-black/40 z-[90] transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 right-0 w-[min(85vw,340px)] overflow-y-auto overscroll-contain bg-white z-[95] shadow-2xl transform transition-transform duration-300 pb-6 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div className="px-4 pt-6 pb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-primary">Menu</h3>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 -mr-1 text-primary"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-4">
          {mainNav.map((group) => {
            const isOpen = openMobileSection === group.name;
            return (
              <div key={group.id} className="border-b border-gray-100 last:border-b-0">
                {group.hasDropdown ? (
                  <button
                    type="button"
                    onClick={() => toggleMobileSection(group.name)}
                    aria-expanded={isOpen}
                    className="w-full py-3 text-[14px] font-semibold text-primary flex justify-between items-center"
                  >
                    {group.name}
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <a
                    href={group.href ?? '#'}
                    className="block py-3 text-[14px] font-semibold text-primary"
                  >
                    {group.name}
                  </a>
                )}
                {group.items.length > 0 && isOpen && (
                  <div className="pb-2 pl-3 flex flex-col gap-1">
                    {group.items.map((child) => (
                      <a
                        key={child.id}
                        href={child.isDisabled ? '#' : child.href}
                        {...(child.isExternal && !child.isDisabled && { target: '_blank', rel: 'noopener noreferrer' })}
                        className={`py-1.5 text-[13px] font-medium transition-colors ${
                          child.isDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-accent'
                        }`}
                        aria-disabled={child.isDisabled || undefined}
                      >
                        {child.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Apply Now */}
        <div className="px-4 pt-3">
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold text-center shadow-md transition-all"
          >
            Apply Now
          </a>
        </div>

        {/* Quick Links — derived from main_nav Admission group */}
        {mobileQuickLinks.length > 0 && (
          <div className="mt-4 px-4 pt-4 border-t border-gray-100">
            <h4 className="text-[13px] font-bold text-primary mb-2.5">Quick Links</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {mobileQuickLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.isDisabled ? '#' : link.href}
                  {...(link.isExternal && !link.isDisabled && { target: '_blank', rel: 'noopener noreferrer' })}
                  className={`text-[12.5px] transition-colors py-1 ${
                    link.isDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-accent'
                  }`}
                  aria-disabled={link.isDisabled || undefined}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Services — from quick_access_item */}
        <div className="mt-4 px-4 pt-4 pb-4 border-t border-gray-100">
          <h4 className="text-[13px] font-bold text-primary mb-3">Services</h4>
          <div className="grid grid-cols-3 gap-2">
            {quickAccessItems.map((item) => {
              const isLive = !!item.href && !item.isDisabled;
              return (
                <a
                  key={item.id}
                  href={isLive ? item.href! : '#'}
                  {...(item.isExternal && isLive && { target: '_blank', rel: 'noopener noreferrer' })}
                  onClick={() => isLive && setMobileMenuOpen(false)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg bg-gray-50 hover:bg-accent/5 active:bg-accent/10 transition-colors text-center ${
                    !isLive ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-disabled={!isLive || undefined}
                >
                  <DynamicLucideIcon name={item.iconName} size={20} className="text-primary" />
                  <span className="text-[10.5px] font-semibold text-gray-700 leading-tight">
                    {item.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} items={searchItems} />
    </nav>
  );
}

// Helper for the two named middle-bar quick-action buttons (ERP +
// Convoc. Reg.). Falls back to '#' if the named entry is absent.
function resolveQuickAccessHref(items: readonly QuickAccessRow[], name: string): string {
  const hit = items.find((q) => q.name === name);
  return hit?.href ?? '#';
}

function NavGroup({
  group,
  compact = false,
}: {
  group: MainNavGroupRow;
  compact?: boolean;
}) {
  const linkClass = compact
    ? 'h-11 px-1 xl:px-3 flex items-center gap-0.5 xl:gap-1 text-[11px] xl:text-[14px] font-bold whitespace-nowrap text-gray-800 hover:text-accent transition-colors'
    : 'px-1.5 xl:px-5 h-14 flex items-center gap-0.5 xl:gap-1.5 text-[12px] xl:text-[15px] font-medium whitespace-nowrap text-gray-800 hover:text-accent transition-all relative';

  return (
    <div className="group relative">
      <a
        href={group.href ?? '#'}
        className={linkClass}
      >
        {group.name}
        {group.hasDropdown && <ChevronDown size={compact ? 12 : 13} className="hidden xl:block opacity-80" />}
        {!compact && (
          <span className="absolute bottom-0 left-0 w-0 h-1 bg-accent transition-all group-hover:w-full" />
        )}
      </a>
      {group.items.length > 0 && (
        <div className="invisible absolute left-0 top-full z-50 min-w-[280px] translate-y-2 rounded-lg border border-gray-100 bg-white py-3 opacity-0 shadow-premium transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
          {(group.title || group.name) && (
            <div className="px-5 pt-1 pb-3 border-b border-gray-200">
              <div className="text-[15px] font-bold text-gray-900">{group.title ?? group.name}</div>
            </div>
          )}
          <div className="py-2">
            {group.items.map((child) => (
              <a
                key={child.id}
                href={child.isDisabled ? '#' : child.href}
                {...(child.isExternal && !child.isDisabled && { target: '_blank', rel: 'noopener noreferrer' })}
                className={`group/item block px-5 py-2.5 text-sm font-medium transition-colors ${
                  child.isDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-accent/5 hover:text-accent'
                }`}
                aria-disabled={child.isDisabled || undefined}
              >
                <span className="inline-flex items-center gap-2">
                  {child.name}
                  {!child.isDisabled && (
                    <ChevronRight
                      size={14}
                      className="opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200"
                    />
                  )}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
