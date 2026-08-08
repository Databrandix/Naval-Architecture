-- Content-only migration — no schema change.
--
-- Repoint every "Apply Now" surface (Navbar primary CTA + the
-- between-content JourneyCTASection primary button) at the
-- chair-supplied admission_info URL. Both fields are already
-- admin-editable (/admin/university-identity, /admin/journey-cta);
-- this migration just sets the prod values without requiring a
-- chair click and keeps seed.ts in sync as the source of truth.

UPDATE "university_identity"
   SET "applyUrl" = 'http://sue.su.edu.bd:5081/sonargaon_erp/siteadmin/admission_info'
 WHERE "id" = 'singleton';

UPDATE "journey_cta_content"
   SET "primaryCtaHref" = 'http://sue.su.edu.bd:5081/sonargaon_erp/siteadmin/admission_info'
 WHERE "id" = 'singleton';
