-- Content-only migration: move the "Mecha Club" MainNavItem out of
-- the About dropdown and into the Student Society dropdown (chair
-- request — Mecha Club fits more naturally with the other student
-- groups than under About).

UPDATE "main_nav_item"
   SET
     "groupId"      = (SELECT id FROM "main_nav_group" WHERE name = 'Student Society' LIMIT 1),
     "displayOrder" = COALESCE(
       (
         SELECT MAX("displayOrder") + 1
           FROM "main_nav_item"
          WHERE "groupId" = (SELECT id FROM "main_nav_group" WHERE name = 'Student Society' LIMIT 1)
       ),
       0
     )
 WHERE "name" = 'Mecha Club'
   AND "groupId" = (SELECT id FROM "main_nav_group" WHERE name = 'About' LIMIT 1);
