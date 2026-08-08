'use client';

import type { TopLink, QuickAccessItem, MainNavGroup, MainNavItem } from '@prisma/client';
import LinkListSection from '@/components/admin/LinkListSection';
import MainNavSection from './MainNavSection';
import {
  createTopLinkAction, updateTopLinkAction, deleteTopLinkAction, reorderTopLinksAction,
  createQuickAccessAction, updateQuickAccessAction, deleteQuickAccessAction, reorderQuickAccessAction,
} from '@/lib/admin-actions/chrome-nav';

export type MainNavGroupWithItems = MainNavGroup & { items: MainNavItem[] };

export default function NavAdmin({
  topLinks,
  quickAccessItems,
  mainNavGroups,
}: {
  topLinks: TopLink[];
  quickAccessItems: QuickAccessItem[];
  mainNavGroups: MainNavGroupWithItems[];
}) {
  return (
    <div className="space-y-6">
      <LinkListSection
        title="Top Bar Links"
        description="The thin row above the main navbar (hidden on mobile + when scrolled)."
        items={topLinks}
        createAction={createTopLinkAction}
        updateAction={updateTopLinkAction}
        deleteAction={deleteTopLinkAction}
        reorderAction={reorderTopLinksAction}
      />

      <LinkListSection
        title="Quick Access"
        description="The 3-column grid in the scrolled-navbar dropdown + the mobile drawer Services section."
        items={quickAccessItems}
        createAction={createQuickAccessAction}
        updateAction={updateQuickAccessAction}
        deleteAction={deleteQuickAccessAction}
        reorderAction={reorderQuickAccessAction}
        extraField={{
          name: 'iconName',
          label: 'Lucide icon name',
          placeholder: 'BookOpen, GraduationCap, Globe…',
          valueOf: (item) => item.iconName,
          kind: 'icon',
        }}
      />

      <MainNavSection groups={mainNavGroups} />
    </div>
  );
}
