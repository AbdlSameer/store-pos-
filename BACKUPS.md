# Database Backup & Recovery Guide

## Production Database

| Item | Value |
|------|-------|
| **Provider** | Neon (neon.tech) |
| **Project name** | Check [console.neon.tech](https://console.neon.tech) → your project → **Settings** |
| **Connection string** | Set as `DATABASE_URL` in Render environment variables (never in code) |
| **PITR retention** | Check **console.neon.tech → Settings → Storage** — free tier is typically **7 days** |

---

## Layer 1 — Neon Point-in-Time Recovery (Automatic)

Neon continuously snapshots the write-ahead log so you can restore any branch to
**any second within the retention window** without any application code.

### How to restore a branch to a past timestamp

1. Go to **[console.neon.tech](https://console.neon.tech)** and open your project.
2. In the left sidebar click **Branches**.
3. Click **Create branch**.
4. Under "Branch from", choose your `main` branch.
5. Toggle **"Create branch from a specific date and time"**.
6. Enter the exact UTC timestamp you want to restore to (e.g. `2024-01-15 14:30:00`).
7. Click **Create Branch**. Neon creates a read/write branch at that exact point.
8. Copy the new branch's connection string.
9. **Verify the data looks correct** before switching production traffic.
10. To promote it: update the `DATABASE_URL` in Render to point at the restored branch, then re-deploy.

> [!CAUTION]
> Never point production at an unverified restored branch without reviewing the data first.

---

## Layer 2 — Nightly `pg_dump` to Backblaze B2 (GitHub Actions)

A nightly GitHub Actions workflow (`.github/workflows/backup.yml`) dumps the full
database and uploads it to Backblaze B2 as a secondary off-Neon backup.

### Required GitHub Secrets (set in repo → Settings → Secrets and Variables → Actions)

| Secret name | Where to get it |
|---|---|
| `DATABASE_URL` | Render → your server service → Environment |
| `B2_APPLICATION_KEY_ID` | Backblaze B2 → Account → App Keys |
| `B2_APPLICATION_KEY` | Backblaze B2 → Account → App Keys |
| `B2_BUCKET_NAME` | Backblaze B2 → Buckets (create a private bucket named e.g. `toystore-backups`) |

### Retention policy
Backblaze B2 does not auto-delete files. To avoid storage costs growing forever, set a
**Lifecycle Rule** in the B2 bucket console: *"Delete files after N days"* (recommend 30 days).

---

## Manual Steps Required

- [ ] Log in to **console.neon.tech** → Settings → Storage, confirm the PITR window and note the project name above.
- [ ] Create a **Backblaze B2** free-tier account at [backblaze.com](https://www.backblaze.com/b2/cloud-storage.html).
- [ ] Create a **private bucket** named `toystore-backups` (or similar).
- [ ] Create an **App Key** with read/write access to that bucket.
- [ ] Add the 4 secrets listed above to your GitHub repository.
- [ ] After the first nightly run, verify a `.sql.gz` file appears in your B2 bucket.
