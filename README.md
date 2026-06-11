# EduCMS

EduCMS is an educational Content Management System for institutions to manage posts, categories, tags, comments, media, users, SEO metadata, and analytics through a role-based admin panel.

**Features:** JWT auth with four roles (admin/editor/author/subscriber) · posts with rich text, SEO fields, versioning and rollback · publish/archive workflow · categories & tags · comment moderation · media library with validated uploads · user management with instant deactivation · dashboard & analytics with charts · 95 automated tests + browser QA suite.

> Build history: [projectplan.md](projectplan.md) — all 16 phases complete.

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
    shared/     # Shared types and constants (@educms/shared)
  docs/         # Project documentation (added in later phases)
```

## Requirements

- Node.js >= 20.19
- npm >= 10
- PostgreSQL >= 15 (required from Phase 2 onward)

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

Seed users: `admin@educms.local`, `editor@…`, `author@…`, `author2@…`, `subscriber@…` — password `Password123!`. See [docs/database.md](docs/database.md) for the full schema.

## Running the App

In two terminals:

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
npm run test -w apps/api    # 73 integration tests (needs migrated + seeded local DB)
npm run test -w apps/web    # 22 component tests
npm run qa:browser          # 10-step browser walkthrough with screenshots
```

CI (`.github/workflows/ci.yml`) runs lint, build, migrations, and both test suites against a Postgres service container on every push.

## API Response Format

All API responses use a consistent envelope:

```json
{ "success": true, "message": "Success message", "data": {} }
```

```json
{ "success": false, "message": "Error message", "errors": [] }
```

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Monorepo layout, API layering, frontend structure, data flow |
| [docs/api.md](docs/api.md) | Every endpoint with roles, payloads, and rate limits |
| [docs/database.md](docs/database.md) | Schema, constraints, indexes, migrations, seed data |
| [docs/deployment.md](docs/deployment.md) | Deploying frontend, API, and database + troubleshooting |
| [docs/testing.md](docs/testing.md) | Test strategy, coverage, bugs found during QA |
| [docs/user-manual.md](docs/user-manual.md) | End-user guide per role |
| [docs/final-report.md](docs/final-report.md) | Project report |
