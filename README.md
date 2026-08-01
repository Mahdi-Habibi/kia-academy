# Kia Academy (آکادمی کیا) — Adaptive Learning Platform

> **Business model:** Persian-first learning academy for Iran. Guests start at a minimal landing with **Material Studio** and **Education** CTAs. Learners sign up via **Iranian phone OTP** → profile → **free goal assessment** → **free readiness test** → results → personalized roadmap → paid course/roadmap bundle checkout → lesson player. Staff use email/password login. Default currency is **IRR**.

Full-stack monorepo: **Next.js 15** (frontend) + **NestJS 11** (backend) + **Prisma** (PostgreSQL).

**Live frontend (GitHub Pages):** https://mahdi-habibi.github.io/pathwise/

> GitHub project Pages always use `https://<user>.github.io/<repository-name>/`.
> This GitHub repository is still named **`pathwise`**, so the live URL path is `/pathwise/`
> (not `/kia-academy/`). To serve at https://mahdi-habibi.github.io/kia-academy/ instead,
> rename the repository under **Settings → General → Repository name** to `kia-academy`,
> then re-run **Deploy GitHub Pages**. The workflow sets `basePath` from the repo name
> automatically. For local `pnpm build:pages`, pass `PAGES_REPO_NAME=kia-academy`.

## GitHub Pages

The web app is statically exported with `basePath` matching the GitHub repository name
(currently `/pathwise` → https://mahdi-habibi.github.io/pathwise/).
By default the Pages build enables **demo mode** (`NEXT_PUBLIC_DEMO_MODE=true`): courses, lessons,
assessment, checkout, bootcamp, and admin use in-browser mock data so visitors can explore the full UI
without a hosted Nest API. Progress is stored in the browser only.

**Local clone is unchanged:** leave demo mode off, run Postgres + Nest + Next with `pnpm dev` (same-origin
`/api` proxy). Demo mode is only turned on for the Pages export.

### One-time GitHub setup (required — otherwise the site shows README.md)

Your repo was publishing from **branch `main` / root**, which only shows the README.
Point Pages at the built app instead:

**Option A — Deploy from branch (works with the `gh-pages` branch we publish):**

1. Open **Settings → Pages**
2. Under **Build and deployment → Source**, choose **Deploy from a branch**
3. Branch: **`gh-pages`** · Folder: **`/ (root)`**
4. Save, wait ~1 minute, then open https://mahdi-habibi.github.io/pathwise/

**Option B — GitHub Actions:**

1. **Settings → Pages → Source**: **GitHub Actions**
2. Re-run the **Deploy GitHub Pages** workflow (Actions → workflow_dispatch) or push to `main`

Optional — use a real hosted API instead of demo mode:

- Repo **Settings → Variables → Actions**: `NEXT_PUBLIC_API_URL` = your API origin (no trailing slash)
- On the API host set `CORS_ORIGIN=https://mahdi-habibi.github.io`

### Local static build (Pages preview)

```bash
pnpm build:pages
# Output: apps/web/out  (asset URLs expect /pathwise/ — or set PAGES_REPO_NAME=kia-academy after renaming the repo)
```

### Local full stack (recommended for development)

```bash
corepack enable && corepack prepare pnpm@11.13.0 --activate
pnpm install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Keep NEXT_PUBLIC_DEMO_MODE unset/false in .env.local
pnpm docker:db   # or use a local Postgres matching DATABASE_URL
pnpm db:migrate && pnpm db:seed
pnpm dev
# Web http://localhost:3000  ·  API http://localhost:3001/api/health
```

## Use on another device

The repository contains everything needed to recreate the project: application source, workspace
configuration, the exact pnpm lockfile, Prisma schema and migrations, seed data, Docker files,
tests, and safe environment templates. Dependencies, build output, local databases, Playwright
browsers, and secret `.env` files are intentionally not committed.

After cloning from GitHub:

```bash
git clone <your-github-repository-url>
cd kia-academy
corepack enable
corepack prepare pnpm@11.13.0 --activate
pnpm install --frozen-lockfile

# Windows
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local

# macOS/Linux
# cp apps/api/.env.example apps/api/.env
# cp apps/web/.env.example apps/web/.env.local

pnpm docker:db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

For browser tests on a new device, install the browser once:

```bash
pnpm --filter @kia-academy/web exec playwright install chromium
pnpm test:e2e
```

Git synchronizes code and reproducible setup files, not live PostgreSQL data or secrets. Use
`pnpm db:seed` for the same development baseline on each device. If both devices must share
ongoing user/course data, point both installations at the same hosted PostgreSQL database and keep
its credentials in each device's ignored `apps/api/.env`.

## Deploy from GitHub

This monorepo is set up for GitHub-native CI and container deployment:

| Piece | What it does |
| ----- | ------------ |
| `.github/workflows/ci.yml` | On every push/PR to `main`: install, migrate against Postgres, lint, typecheck, test, and build |
| `.github/workflows/docker-publish.yml` | On push to `main` (and version tags): build and push `kia-academy-api` / `kia-academy-web` images to **GitHub Container Registry** (`ghcr.io`) |
| `docker-compose.ghcr.yml` | Run the published images on any host with Docker (no local build required) |
| Dependabot | Weekly npm / Actions / Docker update PRs |

### 1. Enable package writes (one-time)

After the first successful `Docker publish` run, open **GitHub → Packages** for this repo and confirm `kia-academy-api` and `kia-academy-web` appear. If packages are private, grant read access to deploy machines (or make them public under package settings).

### 2. Deploy with GHCR images

On the server:

```bash
git clone https://github.com/Mahdi-Habibi/kia-academy.git
cd kia-academy
cp .env.docker.example .env.docker
# Edit .env.docker: set strong JWT_* secrets, CORS_ORIGIN, APP_URL, NEXT_PUBLIC_APP_URL,
# and production POSTGRES_PASSWORD / DATABASE_URL credentials.

# Lowercase GitHub username or org that owns the packages:
export GHCR_OWNER=mahdi-habibi
# Optional pin: export KIA_ACADEMY_TAG=latest   # or a semver / sha-* tag from Actions

# Authenticate to pull private packages (skip if packages are public):
echo "$GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

pnpm docker:ghcr:pull   # or: docker compose -f docker-compose.ghcr.yml --env-file .env.docker pull
pnpm docker:ghcr:up
```

- **Web:** http://localhost:3000 (or your public host / reverse proxy)
- **API health:** http://localhost:3001/api/health

Put a reverse proxy (Caddy, nginx, Traefik) in front of port 3000 and terminate TLS there. Keep the browser on the **same origin** as `/api` so auth cookies stay first-party.

### 3. Local full-stack build (no registry)

```bash
pnpm docker:setup
pnpm docker:up
```

### Production checklist

- [ ] Replace all `change-me-*` JWT secrets (32+ random characters each)
- [ ] Use a strong `POSTGRES_PASSWORD` and matching `DATABASE_URL`
- [ ] Set `CORS_ORIGIN`, `APP_URL`, and `NEXT_PUBLIC_APP_URL` to your public HTTPS URL
- [ ] Set `SEED_DATABASE=false` after the first boot (demo data only for staging)
- [ ] Configure Stripe / SMTP env vars when enabling payments and email
- [ ] Never commit `.env`, `.env.docker`, or real secrets — only `*.example` templates

## Quick start

### Option A — Local Postgres (recommended when Docker Engine won’t start)

If PostgreSQL is already installed on Windows (e.g. on `D:\Program Files\PostgreSQL\18`):

```bash
cd kia-academy
pnpm install
pnpm --filter @kia-academy/shared build
# apps/api/.env should use:
# DATABASE_URL=postgresql://kia_academy:kia_academy@localhost:5432/kia_academy?schema=public
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### Option B — Local dev with Docker Postgres

Uses Docker for PostgreSQL only; run web + API with hot reload via pnpm.

```bash
cd kia-academy
pnpm install
pnpm approve-builds bcrypt @prisma/client prisma esbuild sharp   # if prompted
pnpm docker:db                # start PostgreSQL container
cp .env.example apps/api/.env # DATABASE_URL uses localhost:5432
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @kia-academy/shared build
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### Option C — Full Docker stack

Runs PostgreSQL, API, and web entirely in containers (production-like).

```bash
cd kia-academy
pnpm docker:setup             # creates .env.docker from .env.docker.example
pnpm docker:up                # build images + start all services
```

- **Web:** http://localhost:3000
- **API:** http://localhost:3001/api
- **Health:** http://localhost:3001/api/health

> **Schema reset:** `pnpm docker:db:reset` then `pnpm db:migrate && pnpm db:seed` (local dev), or `pnpm docker:down && pnpm docker:up` with `SEED_DATABASE=true` (full stack).

**Demo account:** `alex@kia.academy` / `KiaAcademy123!`  
**Admin account:** `admin@kia.academy` / `KiaAcademy123!`  
**Site settings:** `/admin/settings` — see [`docs/ADMIN_SETTINGS_CATALOG.md`](docs/ADMIN_SETTINGS_CATALOG.md) for the full controllable inventory.

## Docker

| File                       | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `Dockerfile`               | Multi-stage build targets: `api`, `web`             |
| `docker-compose.yml`       | `postgres` (default) + `api`/`web` (`full` profile) |
| `docker/api-entrypoint.sh` | Wait for DB, migrate, optional seed, start API      |
| `.env.docker.example`      | Environment template for full Docker stack          |
| `.dockerignore`            | Build context exclusions                            |

### Docker commands

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `pnpm docker:db`       | Start PostgreSQL only (port 5432)       |
| `pnpm docker:db:down`  | Stop PostgreSQL                         |
| `pnpm docker:db:reset` | Wipe DB volume and restart PostgreSQL   |
| `pnpm docker:setup`    | Create `.env.docker` from example       |
| `pnpm docker:build`    | Build API + web images                  |
| `pnpm docker:up`       | Start full stack (postgres + api + web) |
| `pnpm docker:down`     | Stop full stack                         |
| `pnpm docker:logs`     | Tail logs for all services              |
| `pnpm docker:ghcr:pull`| Pull API/web images from GitHub Packages|
| `pnpm docker:ghcr:up`  | Start stack from GHCR images            |
| `pnpm docker:ghcr:down`| Stop GHCR-based stack                   |

### Networking

| Context                | `DATABASE_URL` host       | Web API calls                                            | Cookie note                                                      |
| ---------------------- | ------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| GitHub Pages           | n/a (API hosted elsewhere)| `NEXT_PUBLIC_API_URL` absolute origin                    | Set API `CORS_ORIGIN` to Pages origin; cookies use `SameSite=None` when CORS points at `github.io` |
| Local dev (`pnpm dev`) | `localhost`               | same-origin `/api` via Next rewrite (`API_PROXY_TARGET`) | Refresh cookie shared via same-origin `/api` proxy |
| Docker full stack      | `postgres` (service name) | same-origin `/api`; web container proxies to `api:3001`  | Keep web and API behind the same public host/domain              |

The API container connects to Postgres via the Docker network (`postgres:5432`). In local/Docker the browser calls the web origin; Next rewrites `/api/*` to Nest so auth cookies stay first-party. On GitHub Pages there is no rewrite — set `NEXT_PUBLIC_API_URL` to the API origin and configure CORS accordingly.

**Auth cookies:** the API sets an HttpOnly `refreshToken` cookie with `path=/`. Protected routes use client-side `RequireAuth` (static export cannot use Next.js middleware). For a separate API host + GitHub Pages frontend, ensure CORS allows credentials and the API cookie uses `SameSite=None` (enabled automatically when `CORS_ORIGIN` contains `github.io`).

### Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine + Compose v2 (Linux)
- Node.js 22.13+ and pnpm 11 (for local dev workflow; required by `packageManager`)
- **Windows:** CPU virtualization (Intel VT-x / AMD-V) must be **enabled in BIOS/UEFI**. Docker Desktop will not start without it.

### Troubleshooting: “virtualisation support wasn’t detected”

This is a firmware setting, not a Docker app bug. Check first:

```powershell
pnpm docker:check
# or: powershell -ExecutionPolicy Bypass -File scripts/check-docker-prereqs.ps1
```

If the script reports **Virtualization Enabled In Firmware = No**:

1. Restart the PC and enter BIOS (**Del** or **F2** — AMI BIOS on many desktops).
2. Open **Advanced** → **CPU Configuration** (or **Processor**).
3. Enable **Intel Virtualization Technology** (also labeled VT-x / Virtualization).
4. **Save & Exit** (often **F10**), boot Windows.
5. In an **elevated** PowerShell, enable WSL prerequisites, then reboot once:

```powershell
dism /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
dism /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
wsl --update
wsl --set-default-version 2
```

6. Start **Docker Desktop**, wait until it is running, then:

```bash
pnpm docker:db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Kia Academy v2

| Feature     | Description                                                                          |
| ----------- | ------------------------------------------------------------------------------------ |
| PostgreSQL  | Docker Compose Postgres replaces SQLite for production-ready dev                     |
| Stripe      | Real Checkout Sessions when `STRIPE_SECRET_KEY` is set; dev mode completes instantly |
| Email       | Welcome, payment receipt, and readiness result emails via SMTP (or logged in dev)    |
| Admin panel | `/admin` — settings, courses, lessons, challenges, users, platform stats (ADMIN role) |

| E2E tests   | Playwright learner journey tests via `pnpm test:e2e`                                 |

### v2 environment variables

See `.env.example` for Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`), SMTP, and `APP_URL` (Stripe return URLs).

### v2 routes

| Route               | Description                     |
| ------------------- | ------------------------------- |
| `/admin`            | Admin stats dashboard                              |
| `/admin/settings`   | Site settings (general, pricing, tracks, rules, courses) |
| `/admin/courses`    | Course CRUD + full lesson CRUD                     |
| `/admin/challenges` | Bootcamp challenge CRUD                            |
| `/admin/users`      | User list and role toggle                          |
| `/checkout/success` | Stripe success return URL       |
| `/checkout/cancel`  | Stripe cancel return URL        |

### v2 API (admin)

| Method                | Path                               | Auth  |
| --------------------- | ---------------------------------- | ----- |
| GET                   | `/api/settings`                              | Public |
| GET/PUT               | `/api/admin/settings`                        | ADMIN  |
| GET                   | `/api/admin/stats`                           | ADMIN  |
| GET/POST/PATCH/DELETE | `/api/admin/courses`                         | ADMIN  |
| POST/PATCH/DELETE     | `/api/admin/courses/:slug/lessons`           | ADMIN  |
| POST/DELETE           | `/api/admin/courses/:slug/lessons/:lessonSlug/video` | ADMIN |
| GET                   | `/api/uploads/...`                           | Public (lesson media) |
| GET/POST/PATCH/DELETE | `/api/admin/challenges`                      | ADMIN  |
| GET                   | `/api/admin/users`                           | ADMIN  |
| PATCH                 | `/api/admin/users/:id/role`                  | ADMIN  |

## Security

| Layer            | Implementation                                                    |
| ---------------- | ----------------------------------------------------------------- |
| Authentication   | JWT access tokens + httpOnly refresh cookies                      |
| Passwords        | bcrypt hashing (min 8 chars, letter + number)                     |
| API protection   | JwtAuthGuard on all learner endpoints                             |
| Rate limiting    | @nestjs/throttler (100 req/min)                                   |
| HTTP headers     | Helmet (API), security headers (Next.js middleware + next.config) |
| Input validation | class-validator DTOs, ValidationPipe whitelist                    |
| Env validation   | Joi schema at API bootstrap                                       |
| CORS             | Restricted to `CORS_ORIGIN`                                       |
| Payments         | Server-side entitlement grants after payment confirm              |

## Routes

### Frontend

| Route                                   | Description                       |
| --------------------------------------- | --------------------------------- |
| `/`                                     | Landing + how it works            |
| `/assessment`                           | Free 6-stage wizard               |
| `/roadmap`                              | Personalized roadmap + purchase   |
| `/login`, `/register`                   | Authentication                    |
| `/checkout`                             | Readiness ($19) or bundle payment |
| `/checkout/success`, `/checkout/cancel` | Stripe return pages               |
| `/admin`                                | Admin panel (ADMIN role)          |
| `/dashboard`                            | Learner hub (auth required)       |
| `/courses`                              | Course catalog                    |
| `/learn/[course]/[lesson]`              | Lesson player                     |
| `/readiness`                            | Paid readiness gate               |
| `/readiness/test`                       | 5 interactive modules             |
| `/bootcamp`                             | Arena + leaderboard               |
| `/privacy`, `/terms`                    | Legal                             |

### API

| Method | Path                                                         | Auth            |
| ------ | ------------------------------------------------------------ | --------------- |
| POST   | `/api/auth/register`, `/login`, `/refresh`, `/logout`        | Public / cookie |
| GET    | `/api/auth/me`                                               | JWT             |
| GET    | `/api/health`                                                | Public          |
| POST   | `/api/payments/checkout`, `/confirm/:id`                     | JWT             |
| GET    | `/api/courses`, lessons, enroll, complete                    | JWT             |
| POST   | `/api/assessments`, `/roadmaps`, `/readiness`, `/challenges` | JWT             |

Free assessment works offline via localStorage; API sync requires login.

## Scripts

| Command                  | Description                        |
| ------------------------ | ---------------------------------- |
| `pnpm dev`               | Run web + API                      |
| `pnpm build`             | Build all packages                 |
| `pnpm test`              | Run all tests                      |
| `pnpm test:e2e`          | Run Playwright E2E (web)           |
| `pnpm db:migrate`        | Apply Prisma migrations (dev)      |
| `pnpm db:migrate:deploy` | Apply migrations (production / CI) |
| `pnpm db:seed`           | Seed user, courses, entitlements   |
| `pnpm docker:db`         | Start PostgreSQL container         |
| `pnpm docker:up`         | Start full Docker stack            |
| `pnpm docker:down`       | Stop full Docker stack             |
| `pnpm docker:ghcr:up`    | Deploy from GitHub Container Registry |
| `pnpm docker:ghcr:pull`  | Pull latest GHCR images            |

## Tech stack

Next.js 15 · React 19 · NestJS 11 · Prisma · PostgreSQL · Docker · TypeScript · pnpm · JWT · bcrypt · Stripe · Helmet · Throttler · Vitest · Jest · Playwright · lucide-react
