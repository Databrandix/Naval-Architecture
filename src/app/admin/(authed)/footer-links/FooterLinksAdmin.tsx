'use client';

import type {
  FooterUsefulLink,
  FooterGetInTouchLink,
  FooterQuickLink,
  FooterLegalLink,
  FooterCampusLink,
} from '@prisma/client';
import LinkListSection from '@/components/admin/LinkListSection';
import {
  createFooterUsefulLinkAction, updateFooterUsefulLinkAction, deleteFooterUsefulLinkAction, reorderFooterUsefulLinksAction,
  createFooterGetInTouchLinkAction, updateFooterGetInTouchLinkAction, deleteFooterGetInTouchLinkAction, reorderFooterGetInTouchLinksAction,
  createFooterQuickLinkAction, updateFooterQuickLinkAction, deleteFooterQuickLinkAction, reorderFooterQuickLinksAction,
  createFooterLegalLinkAction, updateFooterLegalLinkAction, deleteFooterLegalLinkAction, reorderFooterLegalLinksAction,
  createFooterCampusLinkAction, updateFooterCampusLinkAction, deleteFooterCampusLinkAction, reorderFooterCampusLinksAction,
} from '@/lib/admin-actions/chrome-footer';

export default function FooterLinksAdmin({
  usefulLinks,
  getInTouchLinks,
  quickLinks,
  legalLinks,
  campusLinks,
}: {
  usefulLinks: FooterUsefulLink[];
  getInTouchLinks: FooterGetInTouchLink[];
  quickLinks: FooterQuickLink[];
  legalLinks: FooterLegalLink[];
  campusLinks: FooterCampusLink[];
}) {
  return (
    <div className="space-y-6">
      <LinkListSection
        title="Useful Links"
        description='The "Useful Link" footer column.'
        items={usefulLinks}
        createAction={createFooterUsefulLinkAction}
        updateAction={updateFooterUsefulLinkAction}
        deleteAction={deleteFooterUsefulLinkAction}
        reorderAction={reorderFooterUsefulLinksAction}
      />

      <LinkListSection
        title="Get in Touch"
        description='The "Get in Touch" footer column.'
        items={getInTouchLinks}
        createAction={createFooterGetInTouchLinkAction}
        updateAction={updateFooterGetInTouchLinkAction}
        deleteAction={deleteFooterGetInTouchLinkAction}
        reorderAction={reorderFooterGetInTouchLinksAction}
      />

      <LinkListSection
        title="Quick Links"
        description='The "Quick Link" footer column.'
        items={quickLinks}
        createAction={createFooterQuickLinkAction}
        updateAction={updateFooterQuickLinkAction}
        deleteAction={deleteFooterQuickLinkAction}
        reorderAction={reorderFooterQuickLinksAction}
      />

      <LinkListSection
        title="Campuses"
        description='The "Campuses" footer column — each link opens a Google Maps pin.'
        items={campusLinks}
        createAction={createFooterCampusLinkAction}
        updateAction={updateFooterCampusLinkAction}
        deleteAction={deleteFooterCampusLinkAction}
        reorderAction={reorderFooterCampusLinksAction}
      />

      <LinkListSection
        title="Legal Links"
        description="Bottom-bar row (Privacy Statement, Terms of Use, Sitemap)."
        items={legalLinks}
        createAction={createFooterLegalLinkAction}
        updateAction={updateFooterLegalLinkAction}
        deleteAction={deleteFooterLegalLinkAction}
        reorderAction={reorderFooterLegalLinksAction}
      />
    </div>
  );
}
