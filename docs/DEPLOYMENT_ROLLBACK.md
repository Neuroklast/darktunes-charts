# Deployment Rollback Strategy

> **Scope:** Vercel-deployed Next.js 15 application with Prisma ORM, Supabase PostgreSQL, and Stripe integration.

---

## Table of Contents

1. [Vercel Deployment Rollback](#1-vercel-deployment-rollback)
2. [Database Migration Rollback](#2-database-migration-rollback)
3. [Feature Flag Strategy](#3-feature-flag-strategy)
4. [Monitoring & Alerting](#4-monitoring--alerting)
5. [Communication Plan](#5-communication-plan)
6. [Rollback Decision Matrix](#6-rollback-decision-matrix)

---

## 1. Vercel Deployment Rollback

Vercel provides instant rollback to any previous production deployment. Because each deployment is immutable, rollbacks are safe and do not require rebuilding.

### 1.1 Instant Rollback via Vercel Dashboard

1. Open the [Vercel Dashboard](https://vercel.com) and navigate to the **darktunes-charts** project.
2. Go to **Deployments** and locate the last known good deployment.
3. Click the **three-dot menu** (⋯) on the target deployment → **Promote to Production**.
4. Vercel assigns the production domain to the selected deployment within seconds.

### 1.2 Rollback via Vercel CLI

```bash
# List recent deployments
vercel ls

# Promote a specific deployment URL to production
vercel promote <deployment-url>
```

### 1.3 Preview Deployments as a Safety Net

Every pull request generates a unique preview deployment (`vercel-deploy.sh --preview`). Before merging to `main`, verify the preview URL:

```bash
./vercel-deploy.sh --preview
```

This avoids the need for rollback in most cases by catching issues before production.

### 1.4 Cron Job Considerations

The following Vercel cron jobs (configured in `vercel.json`) will execute against whichever deployment is currently promoted to production:

| Cron Job | Schedule | Impact During Rollback |
|---|---|---|
| `/api/cron/random-band` | Daily at 00:00 UTC | Low — selects a random band for spotlight |
| `/api/cron/schulze-compute` | Hourly | Medium — computes chart rankings |
| `/api/cron/tier-refresh` | Weekly (Sunday 03:00 UTC) | Low — refreshes band tiers |

**Action:** After a rollback, verify that cron endpoints still return `200 OK`. If a rolled-back deployment lacks a cron route that was added in the failed deployment, the cron invocation will return `404` — this is safe (Vercel retries but does not crash).

### 1.5 Environment Variables

Vercel environment variables are project-scoped, not deployment-scoped. A rollback does **not** revert environment variable changes. If the failed deployment required new environment variables:

1. Check whether the rolled-back code depends on the new variables.
2. Remove or adjust any newly added variables that the rolled-back deployment does not recognize.
3. Re-deploy if variable changes are needed (Vercel does not restart existing deployments on variable changes).

---

## 2. Database Migration Rollback

The Vercel build command runs Prisma migrations automatically:

```json
"buildCommand": "npx prisma generate && npx prisma migrate deploy && next build"
```

Database migrations are **not** automatically reversed during a Vercel rollback. This is the most critical part of any rollback procedure.

### 2.1 Prevention: Backward-Compatible Migrations

The safest rollback strategy is to make all migrations backward-compatible:

| Operation | Safe Pattern | Unsafe Pattern |
|---|---|---|
| Add column | `ALTER TABLE ADD COLUMN ... DEFAULT ...` | Adding a NOT NULL column without default |
| Remove column | Deploy code that stops reading the column first, then remove in a follow-up migration | Dropping a column that old code still reads |
| Rename column | Add new column → migrate data → deploy code using new column → drop old column | `ALTER TABLE RENAME COLUMN` in a single step |
| Add enum value | `ALTER TYPE ... ADD VALUE` | Removing an enum value |

**Rule:** Every migration must be deployable without breaking the previous version of the application code.

### 2.2 Manual Migration Rollback via Supabase

If a migration must be reversed:

1. **Connect to Supabase SQL Editor:**
   Open the Supabase Dashboard → **SQL Editor**.

2. **Identify the failed migration:**
   ```sql
   SELECT migration_name, finished_at
   FROM _prisma_migrations
   ORDER BY finished_at DESC
   LIMIT 5;
   ```

3. **Write a compensating SQL script:**
   Manually reverse the changes made by the failed migration. For example:
   ```sql
   -- Reverse: "add_spotlight_priority_column"
   ALTER TABLE spotlights DROP COLUMN IF EXISTS priority;
   ```

4. **Remove the migration record** so Prisma does not consider it applied:
   ```sql
   DELETE FROM _prisma_migrations
   WHERE migration_name = '20260329_add_spotlight_priority';
   ```

5. **Verify** the application works against the reverted schema by checking the rolled-back Vercel deployment.

> ⚠️ **Warning:** Never run `prisma migrate reset` against production. This drops and recreates the entire database.

### 2.3 Point-in-Time Recovery (PITR)

Supabase Pro plans include Point-in-Time Recovery:

1. Open Supabase Dashboard → **Database** → **Backups**.
2. Select a recovery point **before** the failed migration was applied.
3. Restore to a new database instance.
4. Update `DATABASE_URL` and `DIRECT_URL` in Vercel environment variables to point to the restored instance.
5. Re-deploy or promote the last known good Vercel deployment.

> ℹ️ PITR is a last resort. It affects **all** data written after the recovery point, not just schema changes.

### 2.4 Seed Data Recovery

If test or seed data is affected, use the existing seed script:

```bash
npx tsx prisma/seed-test.ts
```

This script is designed for non-production environments only.

---

## 3. Feature Flag Strategy

DarkTunes Charts does not currently use a dedicated feature flag service. The following strategy enables gradual rollouts and safe rollbacks without a third-party dependency.

### 3.1 Environment-Variable Feature Flags

Use Vercel environment variables as simple feature flags:

```env
# In Vercel project settings → Environment Variables
FEATURE_NEW_VOTING_UI=false
FEATURE_AI_SCOUT_V2=false
FEATURE_STRIPE_CHECKOUT_V2=false
```

**Server-side usage (API routes / Server Components):**

```typescript
// src/lib/featureFlags.ts
export function isFeatureEnabled(flag: string): boolean {
  return process.env[`FEATURE_${flag}`] === 'true';
}
```

```typescript
// In an API route or Server Component
import { isFeatureEnabled } from '@/lib/featureFlags';

if (isFeatureEnabled('AI_SCOUT_V2')) {
  // New behavior
} else {
  // Existing behavior
}
```

**Client-side usage (requires `NEXT_PUBLIC_` prefix):**

```env
NEXT_PUBLIC_FEATURE_NEW_VOTING_UI=false
```

### 3.2 Role-Based Gradual Rollout

Leverage the existing `UserRole` system (`FAN`, `DJ`, `BAND`, `EDITOR`, `ADMIN`, `AR`, `LABEL`) for staged rollouts:

| Rollout Phase | Target Audience | Duration |
|---|---|---|
| 1 — Internal | `ADMIN`, `EDITOR` | 1–2 days |
| 2 — Power Users | `DJ`, `AR`, `LABEL` | 3–5 days |
| 3 — General | `BAND`, `FAN` | Full rollout |

This approach uses the existing RBAC middleware (`src/lib/auth/rbac.ts`) and requires no new infrastructure.

### 3.3 Rollback via Feature Flags

To roll back a feature without a full deployment rollback:

1. Set the feature flag to `false` in Vercel Dashboard → Environment Variables.
2. Trigger a re-deployment (Vercel does not pick up variable changes on existing deployments):
   ```bash
   vercel --prod
   ```
3. Verify the feature is disabled.

---

## 4. Monitoring & Alerting

### 4.1 Vercel Built-in Monitoring

| Signal | Where to Check | Rollback Trigger |
|---|---|---|
| Serverless function errors | Vercel Dashboard → **Logs** (Runtime Logs) | Error rate > 5% over 5 minutes |
| Build failures | Vercel Dashboard → **Deployments** | Build fails — deployment is not promoted |
| Edge function latency | Vercel Dashboard → **Analytics** | p95 latency > 3 seconds |
| Cron job failures | Vercel Dashboard → **Cron Jobs** | Consecutive failures > 2 |

### 4.2 Supabase Database Monitoring

| Signal | Where to Check | Rollback Trigger |
|---|---|---|
| Connection pool exhaustion | Supabase Dashboard → **Database** → **Health** | Active connections > 80% of pool |
| Query performance | Supabase Dashboard → **Query Performance** | Slow queries > 5 seconds |
| Storage usage spike | Supabase Dashboard → **Database** → **Size** | Unexpected growth > 20% in 24h |

### 4.3 Application-Level Health Checks

Recommended health check endpoint to add:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown',
  };
  return Response.json(checks);
}
```

Use this endpoint with an external uptime monitor (e.g., UptimeRobot, Better Uptime) to detect outages automatically.

### 4.4 Stripe Webhook Monitoring

Since DarkTunes Charts integrates Stripe for payments:

| Signal | Where to Check | Rollback Trigger |
|---|---|---|
| Webhook delivery failures | Stripe Dashboard → **Webhooks** | Failure rate > 1% |
| Payment processing errors | Stripe Dashboard → **Events** | Unexpected error events |

**Action:** If a deployment breaks Stripe webhook processing (`STRIPE_WEBHOOK_SECRET` validation), roll back immediately — payment failures directly affect revenue.

### 4.5 Automated Alert Configuration

Set up Vercel Integrations or external tools to send alerts:

- **Vercel Log Drains** → Forward logs to Datadog, Logflare, or Axiom for centralized alerting.
- **Supabase Alerts** → Configure Supabase Dashboard → **Reports** for email notifications on anomalies.
- **GitHub Actions** → Use scheduled workflows to ping the `/api/health` endpoint and open an issue on failure.

---

## 5. Communication Plan

### 5.1 Severity Levels

| Level | Definition | Example |
|---|---|---|
| **P0 — Critical** | Core functionality broken for all users | Voting system down, authentication failure, payment processing broken |
| **P1 — Major** | Significant feature degraded | Chart computation incorrect, cron jobs failing |
| **P2 — Minor** | Non-critical feature affected | UI rendering issue, non-essential API slow |

### 5.2 Rollback Communication Steps

#### P0 — Critical Incident

1. **Immediately** initiate rollback (do not wait for approval).
2. Post in the team communication channel (Slack/Discord): `🚨 P0: [description]. Rolling back to deployment [URL]. ETA: < 5 minutes.`
3. After rollback: confirm resolution in the channel.
4. Within 24 hours: write a post-mortem (see template below).

#### P1 — Major Incident

1. Assess whether rollback is necessary (< 15 minutes to decide).
2. Notify the team: `⚠️ P1: [description]. Investigating. Rollback under consideration.`
3. Execute rollback if the fix will take longer than 30 minutes.
4. Post-mortem within 48 hours.

#### P2 — Minor Incident

1. Evaluate if a hotfix can be deployed within 1 hour.
2. If not, schedule the fix for the next release cycle. No rollback required.
3. Document in the issue tracker.

### 5.3 Post-Mortem Template

```markdown
## Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Severity:** P0 / P1 / P2
**Duration:** Start time → End time (total minutes)
**Author:** [Name]

### Summary
[One-paragraph description of what happened]

### Timeline
- HH:MM — Deployment triggered
- HH:MM — Issue detected (how?)
- HH:MM — Rollback initiated
- HH:MM — Service restored

### Root Cause
[Technical explanation]

### Impact
- Users affected: [number or percentage]
- Data impact: [none / describe]
- Revenue impact: [none / describe]

### Action Items
- [ ] [Preventive measure 1]
- [ ] [Preventive measure 2]
- [ ] [Monitoring improvement]
```

---

## 6. Rollback Decision Matrix

Use this matrix to quickly decide the appropriate rollback strategy:

| Scenario | Strategy | Database Action | Estimated Time |
|---|---|---|---|
| UI bug, no data impact | Vercel instant rollback | None | < 2 minutes |
| API route error, no migration | Vercel instant rollback | None | < 2 minutes |
| Failed migration, backward-compatible | Vercel instant rollback | None (old code works with new schema) | < 2 minutes |
| Failed migration, breaking change | Vercel rollback + manual SQL revert | Compensating SQL script | 15–30 minutes |
| Corrupted data | Vercel rollback + Supabase PITR | Restore from backup | 30–60 minutes |
| Stripe integration broken | Vercel instant rollback | None | < 2 minutes |
| Environment variable misconfiguration | Fix variables + re-deploy | None | 5–10 minutes |

---

## Quick Reference

```
Rollback Checklist (copy for incident use):

□ Identify the last known good deployment in Vercel Dashboard
□ Check if the failed deployment included database migrations
□ If no migrations: Promote previous deployment via Vercel Dashboard
□ If migrations present: Assess backward compatibility
  □ Compatible: Promote previous deployment (schema changes are harmless)
  □ Incompatible: Run compensating SQL, then promote previous deployment
□ Verify cron jobs return 200 OK
□ Verify Stripe webhooks are processing
□ Check environment variables match the rolled-back deployment
□ Notify the team with severity level and status
□ Monitor for 30 minutes after rollback
□ Schedule post-mortem if P0 or P1
```
