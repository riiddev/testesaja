# SinauEnglish V2 — Database Backup and Restore

This procedure is designed for the free Neon plan and keeps credentials and database exports out of Git.

## Connection variables

- `DATABASE_URL`: pooled Neon connection used by the application at runtime.
- `DATABASE_URL_UNPOOLED`: direct (non-pooled) Neon connection used by migration, backup and restore scripts.

Set `DATABASE_URL_UNPOOLED` in a local, untracked `.env` file before running backup or restore. Do not paste either connection string into source code, issues, chat messages or commits.

## Create a complete backup

From the repository root:

```bash
npm run db:backup
```

The script exports all 23 application and authentication tables in one read-only Repeatable Read transaction. If a table cannot be read, the operation fails and does not report a partial backup as successful.

Backups are written to `backups/`, which is excluded by `.gitignore`. Copy completed backups to a separate, private storage location; do not commit database exports to GitHub.

To choose a specific file name:

```bash
npm run db:backup -- --out=sinauuenglish-manual-backup.json
```

## Validate a backup before restoring

Run the dry-run first:

```bash
npm run db:restore -- --dry-run --file=backups/sinauuenglish-manual-backup.json
```

The dry-run checks the backup format and presence of all required application/authentication tables. It does not connect to or modify a database.

## Restore

Only after verifying the target database and the selected backup, run:

```bash
npm run db:restore -- --file=backups/sinauuenglish-manual-backup.json
```

The restore script uses `ON CONFLICT DO NOTHING`: existing rows are not overwritten. The target database must already have the matching Drizzle schema applied. This is a data restore tool, not a schema migration tool.

A backup from the old format (before Better Auth tables were included) is rejected as incomplete. Create a new version-2 backup before relying on this restore procedure.

## Production snapshot

Neon branch snapshots are separate from JSON exports. A manual pre-cutover Production snapshot was created on 7 November 2026:

- Snapshot: `sinauuenglish-before-production-cutover-2026-11-07`
- Branch: `production`

The snapshot is a recovery point, not a substitute for an independently stored database export.
