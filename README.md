# EduCMS

EduCMS is an educational Content Management System for institutions to manage posts, categories, tags, comments, media, users, SEO metadata, and analytics through a role-based admin panel.

> Status: in development. See [projectplan.md](projectplan.md) for the build phases and current progress.

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

Per workspace (`-w apps/web`, `-w apps/api`, `-w packages/shared`): `lint`, `build`, and `test` (API) are available individually.

## API Response Format

All API responses use a consistent envelope:

```json
{ "success": true, "message": "Success message", "data": {} }
```

```json
{ "success": false, "message": "Error message", "errors": [] }
```

## Documentation

Detailed docs (architecture, API reference, database schema, deployment guide, user manual) will be added under `docs/` as the corresponding phases are completed.
