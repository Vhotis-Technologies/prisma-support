# Database Migration Commands for Crew Chat

## Prerequisites

Before running migrations, ensure:
1. Database is accessible (check `.env` or environment variables)
2. Redis is running (required for settings validation)
3. Virtual environment is activated (if using one)

## Set Environment Variables (Development/Staging)

If running locally without a `.env` file, set these first:

```bash
# Windows (PowerShell)
$env:PRISMA_ENV="development"
$env:DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
$env:REDIS_URL="redis://localhost:6379/0"
$env:SECRET_KEY="temporary-dev-key"
$env:SUPPORT_INTERNAL_API_KEY="temporary-dev-key"

# Linux/Mac (Bash)
export PRISMA_ENV=development
export DATABASE_URL=postgresql://user:password@localhost:5432/dbname
export REDIS_URL=redis://localhost:6379/0
export SECRET_KEY=temporary-dev-key
export SUPPORT_INTERNAL_API_KEY=temporary-dev-key
```

## Migration Commands

### 1. Create Migrations

Generate migration files from the new models:

```bash
cd support/server/prisma
python manage.py makemigrations main
```

**Expected output:**
```
Migrations for 'main':
  main/migrations/0XXX_crew_chat.py
    - Create model CrewChatThread
    - Create model CrewChatMessage
    - Create index idx_crew_chat_status_time on field(s) status, -last_message_at of model crewchatthread
    - Create index idx_crew_chat_thread_time on field(s) thread, created_at of model crewchatmessage
```

### 2. Review the Migration

Check what the migration will do:

```bash
python manage.py sqlmigrate main 0XXX
```

This shows the SQL that will be executed. Review for:
- Table creation statements
- Index creation
- Foreign key constraints
- Field types and constraints

### 3. Check for Issues

Dry-run to check for migration issues:

```bash
python manage.py migrate --plan
```

### 4. Apply Migrations

Apply the migrations to the database:

```bash
python manage.py migrate
```

**Expected output:**
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, main, sessions
Running migrations:
  Applying main.0XXX_crew_chat... OK
```

### 5. Verify Tables Were Created

Check the database for new tables:

```bash
python manage.py dbshell
```

Then in the PostgreSQL shell:
```sql
\dt crew_chat*

-- Should show:
-- crew_chat_threads
-- crew_chat_messages

\d crew_chat_threads
\d crew_chat_messages

-- Exit psql
\q
```

## Rollback (If Needed)

If something goes wrong and you need to rollback:

### Rollback Last Migration

```bash
# Find the migration before the crew chat one
python manage.py showmigrations main

# Rollback to previous migration
python manage.py migrate main 0XXX_previous_migration_name
```

### Unapply Specific Migration

```bash
python manage.py migrate main zero  # Rolls back ALL main app migrations (destructive!)
```

**Warning:** Rollback will delete the tables and all data in them.

## Production Deployment

For production, follow this process:

### 1. Backup Database First

```bash
pg_dump -h host -U user -d dbname > backup_before_crew_chat_$(date +%Y%m%d).sql
```

### 2. Run Migrations with Downtime Window

```bash
# Stop the application servers (to prevent concurrent writes)
sudo systemctl stop support-server

# Run migrations
cd /path/to/support/server/prisma
python manage.py migrate

# Check for errors
echo $?  # Should be 0

# Restart with Daphne (not Gunicorn!)
sudo systemctl start support-server-daphne
```

### 3. Verify Tables

```bash
python manage.py dbshell
```

```sql
SELECT COUNT(*) FROM crew_chat_threads;  -- Should be 0 initially
SELECT COUNT(*) FROM crew_chat_messages;  -- Should be 0 initially
\q
```

## Zero-Downtime Migration (Advanced)

For zero-downtime deployment:

1. **Add tables** (migrations) - safe, no downtime
2. **Deploy new code** - starts using new tables
3. **Monitor** - ensure no errors
4. **Old tables** - can be removed later after confirming everything works

This crew chat migration is already zero-downtime safe because:
- Creates new tables (doesn't modify existing ones)
- No data migration required
- Old code doesn't reference these tables

## Troubleshooting

### Error: "No migrations to apply"

**Cause:** Migrations were already created/applied, or models weren't changed.

**Solution:**
```bash
# Check migration status
python manage.py showmigrations main

# If crew_chat migration exists and is checked [X], it's already applied
```

### Error: "Table already exists"

**Cause:** Tables were manually created or migration partially applied.

**Solution:**
```bash
# Option 1: Fake the migration (if tables match exactly)
python manage.py migrate main 0XXX --fake

# Option 2: Drop tables and rerun (development only!)
python manage.py dbshell
DROP TABLE crew_chat_messages CASCADE;
DROP TABLE crew_chat_threads CASCADE;
\q
python manage.py migrate
```

### Error: "relation does not exist"

**Cause:** Migration wasn't applied, or table was dropped.

**Solution:**
```bash
# Check migration status
python manage.py showmigrations main

# Apply migrations
python manage.py migrate
```

### Error: "DatabaseError: column does not exist"

**Cause:** Code is referencing a field that doesn't exist in DB.

**Solution:**
```bash
# Ensure migrations are up to date
python manage.py migrate

# If still failing, regenerate migrations
rm main/migrations/0XXX_crew_chat.py  # Remove the migration file
python manage.py makemigrations main
python manage.py migrate
```

## Migration File Location

After running `makemigrations`, the migration file will be at:

```
support/server/prisma/main/migrations/0XXX_crew_chat.py
```

**Commit this file to version control** so other developers and production servers can apply the same migration.

## Index Performance Notes

The migration creates these indexes for performance:

1. **idx_crew_chat_status_time**: For listing open/closed threads sorted by time
   ```sql
   CREATE INDEX idx_crew_chat_status_time ON crew_chat_threads (status, last_message_at DESC);
   ```

2. **idx_crew_chat_thread_time**: For loading messages in a thread sorted by time
   ```sql
   CREATE INDEX idx_crew_chat_thread_time ON crew_chat_messages (thread_id, created_at);
   ```

3. **Unique index on crew_user_id**: Ensures one thread per crew member
   ```sql
   CREATE UNIQUE INDEX crew_chat_threads_crew_user_id_key ON crew_chat_threads (crew_user_id);
   ```

These indexes are critical for performance at scale (thousands of threads/messages).

## Post-Migration Verification

After migration, verify the schema:

```bash
python manage.py shell
```

```python
from main.models import CrewChatThread, CrewChatMessage

# Should not raise errors
print(CrewChatThread.objects.count())  # 0
print(CrewChatMessage.objects.count())  # 0

# Create a test thread
thread = CrewChatThread.objects.create(
    crew_user_id='00000000-0000-0000-0000-000000000001',
    crew_name='Test Crew',
    crew_email='test@example.com'
)
print(f"Created thread: {thread.id}")

# Create a test message
message = CrewChatMessage.objects.create(
    thread=thread,
    sender_role='crew',
    sender_id='00000000-0000-0000-0000-000000000001',
    sender_name='Test Crew',
    body='Test message'
)
print(f"Created message: {message.id}")
print(f"Message format: {message.to_gifted_chat_format()}")

# Clean up test data
message.delete()
thread.delete()
print("Test data cleaned up successfully")
exit()
```

## Next Steps After Migration

1. ✅ Migrations applied successfully
2. ⏭️ Switch from Gunicorn to Daphne (see `CREW_CHAT_DEPLOYMENT.md`)
3. ⏭️ Configure environment variables
4. ⏭️ Update Nginx for WebSocket support
5. ⏭️ Deploy crew app with new config
6. ⏭️ Test end-to-end flow

---

**Last Updated:** 2026-08-19  
**Contact:** support@prismavalet.com
