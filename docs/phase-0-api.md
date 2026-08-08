# Phase 0 Admin API — Endpoint Reference

All routes live under `src/app/api/`. Two route groups:

- `/api/auth/*` — mounted from Better Auth (catch-all handler in `src/app/api/auth/[...all]/route.ts`)
- `/api/admin/*` — our custom routes (everything else)

Every `/api/admin/*` route is protected: 401 without a valid session cookie, 403 if the route requires `super_admin` and the caller is `admin`.

All examples assume the dev server is on `http://localhost:3000`. Replace with your deployed Vercel URL in production.

---

## Auth (Better Auth catch-all)

### POST /api/auth/sign-in/email

Sign in with email + password. Sets the `better-auth.session_token` cookie on success.

```bash
curl -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"<password>"}' \
  http://localhost:3000/api/auth/sign-in/email
```

Response (200):
```json
{
  "redirect": false,
  "token": "vNWGnVZ5sOfsvExjh5fKBvIiKN1lUVyt",
  "user": {
    "id": "cmp54p0wt0008whmodnq7ht1u",
    "email": "you@example.com",
    "name": "Super Admin",
    "role": "super_admin",
    "isActive": true,
    "lastLoginAt": null,
    "createdAt": "2026-05-14T06:49:45.437Z",
    "updatedAt": "2026-05-14T06:49:45.437Z"
  }
}
```

Failure modes:
- 401 `INVALID_EMAIL_OR_PASSWORD` — credentials don't match
- 403 with `Account is inactive` — `signIn.before` hook blocked because `user.isActive === false`

### POST /api/auth/sign-out

Revokes the current session. Requires the `Origin` header to match `BETTER_AUTH_URL` (Better Auth's CSRF protection — browsers send this automatically).

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{}' \
  http://localhost:3000/api/auth/sign-out
```

Response (200): `{ "success": true }`

### GET /api/auth/get-session

Returns the current session (or 200 with `null` when not signed in — Better Auth's convention).

```bash
curl -b cookies.txt http://localhost:3000/api/auth/get-session
```

### POST /api/auth/change-password

Logged-in user changes their own password.

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"currentPassword":"<old>","newPassword":"<new>"}' \
  http://localhost:3000/api/auth/change-password
```

---

## /api/admin/me

### GET /api/admin/me

Returns the current user with `role` and `isActive` pulled fresh from Prisma (the session payload alone can be slightly stale after role changes).

```bash
curl -b cookies.txt http://localhost:3000/api/admin/me
```

Response (200):
```json
{ "user": { "id": "...", "email": "...", "name": "...", "role": "super_admin",
            "isActive": true, "lastLoginAt": "2026-05-14T07:45:07.243Z",
            "createdAt": "2026-05-14T06:49:45.437Z" } }
```

Failure: 401 if not authenticated.

---

## Department Identity (singleton)

### GET /api/admin/department

```bash
curl -b cookies.txt http://localhost:3000/api/admin/department
```

Response (200):
```json
{ "department": { "id": "singleton", "name": "Department of Mechanical Engineering",
                  "shortCode": "ME", "facultyName": "Faculty of Science & Engineering",
                  "primaryColor": "#2B3175", "accentColor": "#CC1579",
                  "buttonColor": "#F8BD23", "logoUrl": "/assets/su-colour-logo.webp",
                  "logoPublicId": null, "breadcrumbLabel": "ME",
                  "heroImage1Url": "...", "heroImage1PublicId": null,
                  "heroImage2Url": "...", "heroImage2PublicId": null,
                  "heroImage3Url": "...", "heroImage3PublicId": null,
                  "updatedAt": "..." } }
```

### PUT /api/admin/department

Upserts the singleton. Any authenticated admin or super_admin can update.

```bash
curl -b cookies.txt -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Department of Mechanical Engineering",
    "shortCode":"ME",
    "facultyName":"Faculty of Science & Engineering",
    "primaryColor":"#2B3175","accentColor":"#CC1579","buttonColor":"#F8BD23",
    "logoUrl":"https://res.cloudinary.com/.../logo.png",
    "logoPublicId":"sonargaon-me/department/logo/abc123",
    "breadcrumbLabel":"ME",
    "heroImage1Url":"...","heroImage1PublicId":"...",
    "heroImage2Url":"...","heroImage2PublicId":"...",
    "heroImage3Url":"...","heroImage3PublicId":"..."
  }' \
  http://localhost:3000/api/admin/department
```

Failure modes:
- 401 if not authenticated
- 400 with `issues` array if body fails Zod validation

---

## University Identity (singleton)

### GET /api/admin/university — same pattern as Department GET
### PUT /api/admin/university — same pattern as Department PUT

Body fields per `prisma/schema.prisma#UniversityIdentity`: `name`, `address`, `phones[]`, `emails[]`, 8 social URLs, 6 institutional URLs, `copyrightText`, `mapEmbedUrl`, `logoUrl`, `logoPublicId`.

```bash
curl -b cookies.txt -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Sonargaon University",
    "address":"147/I, Green Road, Panthapath, Tejgaon, Dhaka",
    "phones":["+8801775000888","+880241010352"],
    "emails":["info@su.edu.bd"],
    "facebookUrl":"https://www.facebook.com/SonargaonUniversity",
    "instagramUrl":null, "youtubeUrl":null, "linkedinUrl":null, "xUrl":null,
    "tiktokUrl":null, "whatsappUrl":null, "threadsUrl":null,
    "erpUrl":"http://sue.su.edu.bd:5081/sonargaon_erp/",
    "applyUrl":"...", "libraryUrl":"http://lib.su.edu.bd",
    "iqacUrl":"...", "careerUrl":"...", "noticeUrl":"...",
    "copyrightText":"Copyright © 2026 ...",
    "mapEmbedUrl":"https://maps.google.com/...",
    "logoUrl":"https://res.cloudinary.com/.../footer-logo.webp",
    "logoPublicId":"sonargaon-me/university/logo/xyz"
  }' \
  http://localhost:3000/api/admin/university
```

---

## Programs (list)

### GET /api/admin/programs

```bash
curl -b cookies.txt http://localhost:3000/api/admin/programs
```

Response (200):
```json
{ "programs": [
  { "id": "...", "programName": "Undergraduate — B.Sc in Mechanical Engineering",
    "degreeCode": "BSc-ME", "duration": "4 Years · 8 Semesters",
    "description": "...", "displayOrder": 1,
    "imageUrl": "/assets/program-undergraduate.webp", "imagePublicId": null,
    "specializations": ["Thermal Engineering","Design & Manufacturing", "..."],
    "cta": "View More", "createdAt": "...", "updatedAt": "..." }
] }
```

### GET /api/admin/programs/:id — single program, 404 if missing

### POST /api/admin/programs — create

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "programName":"Master in ME",
    "degreeCode":"MSc-ME",
    "duration":"2 Years · 4 Semesters",
    "description":"Research-led graduate degree.",
    "specializations":["Thermal","Robotics"],
    "cta":"Apply Now"
  }' \
  http://localhost:3000/api/admin/programs
```

- `displayOrder` is auto-appended (max + 1) if omitted
- 409 if `degreeCode` is already used

### PUT /api/admin/programs/:id — partial update
### DELETE /api/admin/programs/:id

### POST /api/admin/programs/reorder

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"ids":["<id-A>","<id-B>","<id-C>"]}' \
  http://localhost:3000/api/admin/programs/reorder
```

Array order becomes new `displayOrder` (0-based). Refuses with 400 if the id-set doesn't exactly match existing rows (to prevent silent drops).

---

## Research Areas (list)

Same pattern as Programs:

- `GET    /api/admin/research-areas`
- `GET    /api/admin/research-areas/:id`
- `POST   /api/admin/research-areas`
- `PUT    /api/admin/research-areas/:id`
- `DELETE /api/admin/research-areas/:id`
- `POST   /api/admin/research-areas/reorder`

Icon dual-mode: provide **exactly one** of `iconName` (Lucide name like `"Flame"`) OR `iconPublicId` + `iconUrl` (Cloudinary upload). Schema-level Zod refinement enforces this on create; on update, if neither side is provided, the existing icon is preserved.

```bash
# Create with Lucide icon
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"iconName":"Cpu","areaName":"Embedded Systems"}' \
  http://localhost:3000/api/admin/research-areas

# Create with uploaded image
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "iconPublicId":"sonargaon-me/research-areas/abc123",
    "iconUrl":"https://res.cloudinary.com/.../abc123.svg",
    "areaName":"Custom Domain"
  }' \
  http://localhost:3000/api/admin/research-areas
```

---

## Admin User Management  (super_admin only — 403 for `admin`)

### GET /api/admin/users

```bash
curl -b cookies.txt http://localhost:3000/api/admin/users
```

Response (200): `{ "users": [ { id, email, name, role, isActive, lastLoginAt, createdAt }, ... ] }`

### POST /api/admin/users — create new admin

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"new-admin@example.com","name":"Jane Doe",
       "password":"<strong-password>","role":"admin"}' \
  http://localhost:3000/api/admin/users
```

- `password` is hashed with bcryptjs and stored in the linked `account` row
- 409 if email exists

### GET /api/admin/users/:id — single user

### PUT /api/admin/users/:id — partial edit

```bash
curl -b cookies.txt -X PUT \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane D.","isActive":false}' \
  http://localhost:3000/api/admin/users/<id>
```

Allowed fields: `name`, `role`, `isActive`. Deactivation auto-revokes all of the target's sessions.

**Safety rule** — if the change would remove the last active super_admin from that set (demote OR deactivate), the request fails:

```json
HTTP/1.1 400 Bad Request
{ "error": "Action blocked — the system must have at least one active super_admin at all times." }
```

### POST /api/admin/users/:id/change-role

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' \
  http://localhost:3000/api/admin/users/<id>/change-role
```

Same safety rule — last active super_admin can't be demoted.

### POST /api/admin/users/:id/reset-password

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"<new-strong-password>"}' \
  http://localhost:3000/api/admin/users/<id>/reset-password
```

Hashes the new password into the target's credential `account` row AND revokes all of the target's sessions (so they must sign in again with the new password).

### DELETE /api/admin/users/:id

```bash
curl -b cookies.txt -X DELETE http://localhost:3000/api/admin/users/<id>
```

Sessions and accounts cascade-delete via the schema relations. Same safety rule — can't delete the last active super_admin.

---

## Dashboard

### GET /api/admin/dashboard

```bash
curl -b cookies.txt http://localhost:3000/api/admin/dashboard
```

Response (200):
```json
{
  "programsCount": 1,
  "researchAreasCount": 7,
  "adminUsersCount": 1,
  "previousLoginAt": "2026-05-14T07:45:06.982Z",
  "currentUser": {
    "id": "...", "name": "Super Admin", "email": "...", "role": "super_admin"
  }
}
```

- `adminUsersCount` is `null` for callers whose role is `admin` (only super_admin sees it)
- `previousLoginAt` is the `createdAt` of the session immediately before the current one (i.e. the previous sign-in event); `null` on the very first login

---

## Uploads (Cloudinary)

### POST /api/admin/uploads/sign

Returns signed parameters for the admin UI to upload directly to Cloudinary. `CLOUDINARY_API_SECRET` never leaves the server.

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"kind":"department-logo"}' \
  http://localhost:3000/api/admin/uploads/sign
```

Valid `kind` values: `department-logo`, `department-hero`, `university-logo`, `program-image`, `research-icon` (controls the destination subfolder).

Response (200):
```json
{
  "timestamp": 1778744734,
  "folder": "sonargaon-me/department/logo",
  "signature": "2a6e933b1f54e1206a139d08680720a118788215",
  "apiKey": "993611863853157",
  "cloudName": "dsexj8z6u",
  "uploadUrl": "https://api.cloudinary.com/v1_1/dsexj8z6u/auto/upload"
}
```

Browser then `POST`s the file + these fields (as `multipart/form-data`) to `uploadUrl`. Cloudinary's response includes `secure_url` + `public_id` which the browser sends back to the relevant content route (e.g. `PUT /api/admin/department` with `logoUrl` + `logoPublicId`).

### POST /api/admin/uploads/delete

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"publicId":"sonargaon-me/department/logo/abc123"}' \
  http://localhost:3000/api/admin/uploads/delete
```

Removes the asset from Cloudinary. Typically called before/after an image replace so the previous asset isn't orphaned.

---

## Common error shapes

| Scenario | HTTP | Body |
|---|---|---|
| Not authenticated | 401 | `{"error":"Not authenticated"}` |
| Wrong role | 403 | `{"error":"super_admin role required"}` |
| Inactive account on sign-in | 403 | `{"message":"Account is inactive. Contact a super-admin."}` |
| Bad JSON body | 400 | `{"error":"Request body must be valid JSON"}` |
| Zod validation failure | 400 | `{"error":"Validation failed","issues":[{"path":"primaryColor","message":"Must be a #RRGGBB hex color"}]}` |
| Resource not found | 404 | `{"error":"Program not found"}` |
| Unique constraint conflict | 409 | `{"error":"degreeCode \"BSc-ME\" already in use"}` |
| Safety rule blocked | 400 | `{"error":"Action blocked — the system must have at least one active super_admin at all times."}` |
| CSRF / origin mismatch (Better Auth) | 403 | `{"message":"Invalid origin","code":"INVALID_ORIGIN"}` |
| Server misconfigured (e.g. missing Cloudinary env) | 500 | `{"error":"Server misconfigured: CLOUDINARY_API_SECRET is not set. Cloudinary uploads disabled."}` |

---

## Smoke-test traces (from `npm run dev` on port 3001)

Verified live against the dev server:

| # | Test | Result |
|---|---|---|
| 1 | `GET /api/admin/me` (no cookie) | 401 ✓ |
| 2 | `POST /api/auth/sign-in/email` (bootstrap creds) | 200, sets `better-auth.session_token` cookie, returns user with `role:"super_admin"` ✓ |
| 3 | `GET /api/admin/me` (with cookie) | 200, `lastLoginAt` populated by `session.create.after` hook ✓ |
| 4 | `GET /api/admin/dashboard` (super_admin) | 200, `adminUsersCount: 1`, `previousLoginAt: null` on first login ✓ |
| 5 | `GET /api/admin/programs` | 200, 1 row ✓ |
| 6 | `GET /api/admin/users` (super_admin) | 200, 1 row ✓ |
| 7 | `POST /api/admin/users/<self>/change-role {role:"admin"}` | 400 + "Action blocked — must have at least one active super_admin" ✓ (safety rule firing) |
| 8 | `POST /api/admin/uploads/sign {kind:"department-logo"}` | 200, valid Cloudinary signature for folder `sonargaon-me/department/logo` ✓ |
| 9 | `GET /api/admin/department` | 200, singleton row ✓ |
| 10 | `POST /api/auth/sign-out` (no Origin header) | 403 `MISSING_OR_NULL_ORIGIN` ✓ (CSRF protection — browsers always send Origin) |
| 11 | Re-login + `GET /api/admin/dashboard` | 200, `previousLoginAt` now points at the earlier session's `createdAt` ✓ (history derivation works) |
