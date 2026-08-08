-- Content-only — repoint the Admission dropdown's "Apply Online"
-- MainNavItem at the same admission_info URL the Navbar primary CTA
-- now uses. Seeded value was a snapshot of UniversityIdentity.applyUrl
-- taken at seed time; the two don't auto-sync afterwards (see seed.ts
-- comment above the Admission group), so a separate UPDATE is needed.
UPDATE "main_nav_item"
   SET "href" = 'http://sue.su.edu.bd:5081/sonargaon_erp/siteadmin/admission_info'
 WHERE "name" = 'Apply Online'
   AND "href" LIKE '%sonargaon_erp%';
