-- Additive — old code never references the new column, safe to apply
-- before the matching code deploys.
ALTER TABLE "campus_location" ADD COLUMN "mapsUrl" TEXT;

-- Seed the three chair-provided pins. WHERE clauses match the current
-- prod row names exactly; if a chair has already renamed via /admin
-- the UPDATE no-ops on that row and they can paste the URL by hand.
UPDATE "campus_location"
   SET "mapsUrl" = 'https://maps.app.goo.gl/ohMNbdCgJvyXdTpa6'
 WHERE "name" = 'Permanent Campus';

-- Same row, two changes — rename Green Road → Panthapath AND set its pin.
UPDATE "campus_location"
   SET "name" = 'Panthapath Campus',
       "mapsUrl" = 'https://maps.app.goo.gl/L63SDT3h777sMEH1A'
 WHERE "name" = 'Green Road Campus';

UPDATE "campus_location"
   SET "mapsUrl" = 'https://maps.app.goo.gl/1acukaudzYupXq4BA'
 WHERE "name" = 'Mohakhali Campus';
