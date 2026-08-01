# Deploying the web app to Vercel

This monorepo’s Nest API + PostgreSQL are **not** hosted on Vercel. Deploy **`apps/web`** in demo mode (same idea as GitHub Pages): the UI runs without a live API.

## One-time setup (dashboard)

1. Open [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import **`Mahdi-Habibi/pathwise`**.
3. Configure the project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web` (click Edit → enable, select `apps/web`)
   - Leave Install/Build as defined in `apps/web/vercel.json` (or paste the same commands)
4. **Environment Variables** (Production + Preview):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_DEMO_MODE` | `true` |
   | `NEXT_PUBLIC_APP_URL` | `https://YOUR_PROJECT.vercel.app` (update after first deploy if needed) |
   | `DATABASE_URL` | `postgresql://build:build@127.0.0.1:5432/build` |

   `DATABASE_URL` is only so root `postinstall` (`prisma generate`) succeeds during install. It is not used by the static demo frontend.

5. Click **Deploy**. Wait for the build to finish and open the `.vercel.app` URL.
6. (Optional) After you know the production URL, set `NEXT_PUBLIC_APP_URL` to that URL and redeploy.

## Git integration (auto-redeploy)

With the GitHub repo connected, every push to the production branch (usually `main`) triggers a new Vercel deployment.

## Hourly redeploy heartbeat

Workflow: `.github/workflows/vercel-hourly-redeploy.yml`

- Runs on a schedule (`0 * * * *` UTC) and via **Actions → Vercel hourly redeploy heartbeat → Run workflow**
- Appends one UTC ISO timestamp line to `logs/vercel-redeploy-heartbeat.txt`
- Commits with `[skip ci]` so full CI does not run every hour
- That push makes Vercel redeploy
- The log file is **not** imported by the Next.js app

**Note:** Scheduled workflows only run on the default branch after this file exists on that branch. GitHub can delay cron jobs by several minutes.
