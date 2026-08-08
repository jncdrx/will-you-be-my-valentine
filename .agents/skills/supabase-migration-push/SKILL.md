---
name: supabase-migration-push
description: Use when pushing, previewing, or applying local SQL database migrations to a remote Supabase project, or troubleshooting out-of-sync migration history using the Supabase CLI.
---

# Supabase Migration Push

Compare local migration files with the remote Supabase database migration history and execute pending SQL migrations in chronological order using the Supabase CLI.

## Prerequisites

Before pushing migrations, ensure local CLI authentication and project linkage are complete:

```bash
# 1. Log in to Supabase CLI
supabase login

# 2. Link local repo to remote project (requires database password)
supabase link --project-ref <your-project-reference-id>
```

## Execution Commands

### Standard Migration Push
Apply all pending local SQL migration files to the remote database:
```bash
supabase db push
```

### Push Migrations with Seed Data
Include default or test seed data from `supabase/seed.sql` during migration:
```bash
supabase db push --include-seed
```

### Dry Run (Preview Changes)
Simulate migration execution to preview SQL changes without altering the live database:
```bash
supabase db push --dry-run
```

## Best Practices & Pre-Flight Checks

- **Check Sync Status First**: Inspect local vs. remote applied migrations prior to pushing:
  ```bash
  supabase migration list
  ```
- **Single-Executor Rule**: Coordinate with team members so only one developer pushes migrations at a time. Concurrent migration pushes desynchronize the remote `schema_migrations` tracking history.

## Troubleshooting & Maintenance

- **Fixing Out-of-Sync Errors**: If a migration fails midway or tracking history becomes corrupted, repair specific migration versions manually:
  ```bash
  # Mark a migration version as applied
  supabase migration repair --status applied <version>

  # Mark a migration version as reverted
  supabase migration repair --status reverted <version>
  ```
- **Generating New Migrations**: Create SQL migration files automatically by diffing local database changes:
  ```bash
  supabase db diff -f <migration_name>
  ```
