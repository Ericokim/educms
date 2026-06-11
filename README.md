# EduCMS

EduCMS is an educational Content Management System for institutions to manage posts, categories, tags, comments, media, users, SEO metadata, and analytics through a role-based admin panel.

## Live Demo

- **Live app:** https://educms-sandy.vercel.app — public site at `/`, admin panel at [`/admin`](https://educms-sandy.vercel.app/admin)
- **Repository:** https://github.com/Ericokim/educms

**Demo accounts** (all use password `Password123!`):

| Email | Role |
| --- | --- |
| admin@educms.local | Admin |
| editor@educms.local | Editor |
| author@educms.local | Author |
| subscriber@educms.local | Subscriber |

> The API runs on Render's free tier and sleeps when idle — the first request may take ~30 seconds to wake it. Uploaded files are ephemeral on the free tier.

**Features:** a public content website (homepage, articles, categories, tags, search, comments) backed by a role-based admin panel · JWT auth with four roles (admin/editor/author/subscriber) · posts with rich text, SEO fields, versioning and rollback · draft → preview → publish workflow · comment moderation · media library with validated uploads · user management with instant deactivation · dashboard & analytics with charts · 106 automated tests + an end-to-end browser QA suite.

**Two faces, one app:** the public site lives at `/` (only published content, ever), the admin CMS at `/admin`. Editors preview drafts through the exact public article layout before publishing.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL
- **Auth:** JWT with role-based access control (admin, editor, author, subscriber)

## Repository Structure

```
educms/
  apps/
    web/        # React admin panel (Vite + shadcn/ui)
    api/        # Express REST API
  packages/
    shared/     # Shared types, constants, and Zod schemas (@educms/shared)
```

## Requirements

- Node.js >= 20.19
- npm >= 10
- PostgreSQL >= 15

## Setup

```bash
git clone <repository-url>
cd EduCMS
npm install            # installs all workspaces and builds @educms/shared
```

Create the environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env` and set at minimum `DATABASE_URL` and `JWT_SECRET`. Never commit `.env` files.

## Database

You need a running PostgreSQL server. Either use a local install, or start one with Docker:

```bash
docker compose up -d postgres
```

If using a local install, create the role and database to match `.env`:

```bash
psql -d template1 -c "CREATE ROLE educms LOGIN PASSWORD 'educms'"
createdb -O educms educms
```

Then apply the schema and development seed data:

```bash
npm run migrate -w apps/api
npm run seed -w apps/api
```

Seed users: `admin@educms.local`, `editor@…`, `author@…`, `author2@…`, `subscriber@…` — password `Password123!`.

## Running the App

```bash
npm run dev            # API (:4000) + admin panel (:5173) together
```

Or individually in two terminals:

```bash
npm run dev:api        # API on http://localhost:4000
npm run dev:web        # Admin panel on http://localhost:5173
```

Verify the API is up:

```bash
curl http://localhost:4000/api/health
```

## Scripts

Root:

| Script | Description |
| --- | --- |
| `npm run dev:web` | Start the frontend dev server |
| `npm run dev:api` | Start the API dev server |
| `npm run build` | Build shared package, API, and frontend |
| `npm run lint` | Lint all workspaces |
| `npm run test` | Run tests in all workspaces |
| `npm run qa:browser` | Playwright browser QA (needs both dev servers running) |

Per workspace (`-w apps/web`, `-w apps/api`, `-w packages/shared`): `lint`, `build`, and `test` are available individually.

## Testing

```bash
npm run test -w apps/api    # 84 integration tests (needs migrated + seeded local DB)
npm run test -w apps/web    # 22 component tests
npm run qa:browser          # 17-step browser walkthrough incl. the full publishing lifecycle
```

CI (`.github/workflows/ci.yml`) runs lint, build, migrations, and both test suites against a Postgres service container on every push.

## API Documentation and Testing

Interactive API documentation (powered by Scalar) ships with the API itself:

| | URL |
| --- | --- |
| Live API docs | https://educms-api.onrender.com/api/docs |
| Live OpenAPI JSON | https://educms-api.onrender.com/api/openapi.json |
| Local API docs | http://localhost:4000/api/docs |
| Local OpenAPI JSON | http://localhost:4000/api/openapi.json |

**Testing authenticated requests:** open the docs, run `POST /auth/login` with a demo account, copy `data.token` from the response, paste it as the Bearer token in the Authentication panel, then run protected endpoints like `GET /auth/me` or `GET /users`. Public endpoints (`GET /public/posts`, `GET /public/search?q=python`, …) work without a token. Set `SCALAR_ENABLED=false` to disable the docs.

## API Response Format

All API responses use a consistent envelope:

```json
{ "success": true, "message": "Success message", "data": {} }
```

```json
{ "success": false, "message": "Error message", "errors": [] }
```

## Architecture

Layered API: routes (auth, role, rate-limit, and validation middleware) → controllers (HTTP only) → services (business logic, ownership checks, activity logging) → repositories (parameterized SQL). The frontend uses feature folders, each with typed API service functions and TanStack Query hooks; forms validate with the same Zod schemas the API uses, shared through `@educms/shared`. Auth reloads the user from the database on every request, so deactivation and role changes take effect immediately. Every content change snapshots into a version history that supports rollback. Uploads are checked against a MIME whitelist *and* magic-byte signatures, stored under random UUID filenames.

The public site is served by a dedicated `/api/public` namespace that can only ever return published content — drafts and archived posts are filtered at the SQL level, comments are approved-only, and responses carry no admin fields. Reader comments require an account and always enter the moderation queue as pending.

## Deployment

The live demo runs on this stack:

- **Frontend → Vercel** — configured by [`vercel.json`](vercel.json) (root-level monorepo build with SPA rewrites). Deploy with `vercel --prod`; set `VITE_API_URL=https://<api-host>/api`.
- **API + PostgreSQL → Render** — configured by [`render.yaml`](render.yaml) (blueprint: Node web service with build-time migrations and a managed Postgres). Required env: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (exact frontend origin, for CORS). Use a persistent disk for `UPLOAD_DIR` on paid tiers.
- Any equivalent hosts work (Netlify; Railway/Fly + Neon/Supabase) — same build commands, same env vars.
