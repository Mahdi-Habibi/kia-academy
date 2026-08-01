# Deploying the web app to Vercel

This monorepo’s Nest API + PostgreSQL are **not** hosted on Vercel. Deploy **`apps/web`** in demo mode (same idea as GitHub Pages): the UI runs without a live API.

## Project (already created)

- Vercel project: **kia-academy** (team `mahdis-projects-08734297`)
- GitHub connected: https://github.com/Mahdi-Habibi/kia-academy
- Env vars set: `NEXT_PUBLIC_DEMO_MODE`, `DATABASE_URL` (dummy for prisma generate), `NEXT_PUBLIC_APP_URL`
- Install/build commands use `@kia-academy/*` filters (see `apps/web/vercel.json`)

## Required: set Root Directory (one-time)

CLI cannot set this. In the Vercel dashboard:

1. Open [Build & Deployment settings](https://vercel.com/mahdis-projects-08734297/kia-academy/settings/build-and-deployment)
2. **Root Directory** → Edit → set to **`apps/web`** → Save
3. Keep **Include source files outside of the Root Directory** enabled (default for new projects)
4. Deployments → Redeploy the latest production deployment (or push any commit to `main`)

Without `apps/web` as Root Directory, Next.js detection fails at the monorepo root.

## Environment Variables (already applied; keep for reference)

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_DEMO_MODE` | `true` |
| `NEXT_PUBLIC_APP_URL` | `https://kia-academy.vercel.app` (update if domain differs) |
| `DATABASE_URL` | `postgresql://build:build@127.0.0.1:5432/build` (dummy; only for `prisma generate` during install) |

## Hourly redeploy heartbeat

Workflow: `.github/workflows/vercel-hourly-redeploy.yml`

- Runs on a schedule (`0 * * * *` UTC) and via **Actions → Vercel hourly redeploy heartbeat → Run workflow**
- Appends one UTC ISO timestamp line to `logs/vercel-redeploy-heartbeat.txt`
- Commits with `[skip ci]` so full CI does not run every hour
- That push makes Vercel redeploy once Git + Root Directory are configured
- The log file is **not** imported by the Next.js app

**Note:** Scheduled workflows only run on the default branch. GitHub can delay cron jobs by several minutes.
