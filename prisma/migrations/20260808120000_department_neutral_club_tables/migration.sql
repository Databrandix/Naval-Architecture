-- The club tables carried a department in their name, and the schema had
-- already been renamed once (mecha -> eee) without a migration to match.
-- A database built from these migrations therefore ended up with
-- `about_mecha_club` while the Prisma schema looked for `about_eee_club`,
-- and every read of the club failed on a table that did not exist.
--
-- Renaming to a neutral name fixes that and stops it recurring: the club
-- belongs to whichever department this site is, and its display name lives
-- in the row, not in the table name.

ALTER TABLE "about_mecha_club" RENAME TO "about_department_club";
ALTER TABLE "mecha_club_application" RENAME TO "department_club_application";
