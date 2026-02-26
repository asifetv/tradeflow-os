# Migration Troubleshooting Guide

## Issues Fixed (2026-02-25)

### ✅ Fixed: Obsolete Docker Compose Version Attribute
**Error:**
```
WARN[0000] /opt/tradeflow/docker-compose.yml: the attribute version is obsolete, it will be ignored
```

**Fix Applied:**
- Removed `version: '3.8'` from `docker-compose.yml`
- Removed `version: '3.8'` from `docker-compose.prod.yml`
- Docker Compose v2+ doesn't need explicit version

**What to do on EC2:**
```bash
cd /opt/tradeflow
git pull origin main  # Get the fixed files
```

---

## Running Database Migrations

### Method 1: From Docker Container (Recommended)

```bash
# Make sure services are running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head

# Verify migrations ran
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current
```

**Expected output:**
```
2025_02_25_000001 -> ... (current head)
```

### Method 2: During Initial Deployment

```bash
# 1. Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 2. Wait for database to be ready (30 seconds)
sleep 30

# 3. Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head

# 4. Verify
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current

# 5. Check API health
curl http://localhost:8000/healthz
```

---

## Common Migration Issues & Solutions

### Issue 1: "Database connection refused"

**Error:**
```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server: Connection refused
```

**Solutions:**

1. **Check PostgreSQL is running:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
   # Should show 'postgres' with status 'Up'
   ```

2. **Check database is ready (wait 30 seconds):**
   ```bash
   sleep 30
   docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
   ```

3. **Check logs:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml logs postgres
   # Look for "database system is ready to accept connections"
   ```

4. **Restart PostgreSQL:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml restart postgres
   sleep 30
   docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head
   ```

### Issue 2: "FATAL: role 'tradeflow' does not exist"

**Error:**
```
FATAL: role "tradeflow" does not exist
```

**Solution:**

```bash
# Database needs to be initialized
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
# This removes all volumes including database

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
sleep 30

# Now run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head
```

### Issue 3: "No such file or directory: 'backend/init_db.sql'"

**Error:**
```
FATAL: could not open file "backend/init_db.sql": No such file or directory
```

**Solution:**

The init_db.sql file is optional. If it doesn't exist:

1. **Check if file exists:**
   ```bash
   ls -la backend/init_db.sql
   ```

2. **If it doesn't exist, remove it from docker-compose.yml:**
   ```bash
   nano docker-compose.yml
   # Find the line: - ./backend/init_db.sql:/docker-entrypoint-initdb.d/init.sql
   # Delete that line
   # Save and exit: Ctrl+X, Y, Enter
   ```

3. **Restart database:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml down postgres
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
   sleep 30
   docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head
   ```

### Issue 4: "Migrations table doesn't exist"

**Error:**
```
ProgrammingError: (psycopg2.errors.UndefinedTable) relation "alembic_version" does not exist
```

**Solution:**

This is normal on first run. Alembic will create the table:

```bash
# Run migrations (will create alembic_version table)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head

# Verify it created the table
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current
```

### Issue 5: "Module not found: app"

**Error:**
```
ModuleNotFoundError: No module named 'app'
```

**Solution:**

Make sure you're running from the correct directory:

```bash
cd /opt/tradeflow
# Verify structure
ls -la backend/app/
# Should show: __init__.py, main.py, database.py, config.py, etc.

# Verify Docker container has the files
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api ls -la /app/
# Should show similar structure

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head
```

### Issue 6: "Import error in alembic env.py"

**Error:**
```
ImportError: cannot import name 'Deal' from 'app.models.deal'
```

**Solution:**

Make sure all models are imported in alembic/env.py:

```bash
# Check env.py has all imports
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api cat alembic/env.py | grep "from app.models"

# Should see:
# from app.models.deal import Deal
# from app.models.customer import Customer
# etc.

# If any are missing, manually add them:
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api nano alembic/env.py
```

---

## Complete Fresh Migration Setup

If everything is broken, do a complete fresh start:

```bash
# 1. Stop and remove all containers and volumes
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v

# 2. Pull latest code
git pull origin main

# 3. Start fresh
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Wait for database
sleep 30

# 5. Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head

# 6. Verify
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current

# 7. Check health
curl http://localhost:8000/healthz
```

---

## Verify Migrations Ran Successfully

### Check Migration Status

```bash
# See current migration head
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current

# See migration history
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic history

# See available migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api ls -la backend/alembic/versions/
```

### Check Database Tables

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres psql -U tradeflow -d tradeflow

# Inside psql, list tables:
\dt

# Exit psql:
\q
```

### Expected Tables

```
Schema |              Name              | Type  |  Owner
--------+--------------------------------+-------+----------
 public | alembic_version               | table | tradeflow
 public | activity_log                  | table | tradeflow
 public | company                       | table | tradeflow
 public | customer                      | table | tradeflow
 public | customer_po                   | table | tradeflow
 public | deal                          | table | tradeflow
 public | document                      | table | tradeflow
 public | quote                         | table | tradeflow
 public | user                          | table | tradeflow
 public | vendor                        | table | tradeflow
 public | vendor_proposal               | table | tradeflow
```

---

## Migration Commands Reference

```bash
# Run all pending migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head

# Rollback one migration
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic downgrade -1

# See current version
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current

# See all migration history
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic history

# Upgrade to specific migration
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade <revision>

# Show database schema
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres psql -U tradeflow -d tradeflow -c "\dt"
```

---

## Quick Test: Is Migration Working?

```bash
# Run this after migrations complete
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api python3 << 'EOF'
from app.database import AsyncSessionLocal, Base, engine
from app.models.deal import Deal

# Test database connection
async def test_db():
    async with AsyncSessionLocal() as session:
        result = await session.execute("SELECT 1")
        print("✅ Database connection OK")

        # Check if tables exist
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"✅ Tables created: {len(tables)}")
        print(f"   Tables: {tables}")

import asyncio
asyncio.run(test_db())
EOF
```

---

## After Migrations: Next Steps

Once migrations run successfully:

1. **Check API is responding:**
   ```bash
   curl http://localhost:8000/healthz
   # Should return: {"status":"ok"}
   ```

2. **Check readiness:**
   ```bash
   curl http://localhost:8000/readyz
   # Should return: {"status":"ready","checks":{"database":true,...}}
   ```

3. **Access frontend:**
   ```
   http://YOUR_EC2_IP
   ```

4. **View API docs:**
   ```
   http://YOUR_EC2_IP/api/docs
   ```

---

## Getting Help

If migrations still fail:

1. **Check Docker logs:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api
   docker compose -f docker-compose.yml -f docker-compose.prod.yml logs postgres
   ```

2. **Check PostgreSQL logs:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml logs postgres | tail -50
   ```

3. **Manually test database:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres psql -U tradeflow -d tradeflow -c "SELECT version();"
   ```

4. **Verify DATABASE_URL is correct:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api env | grep DATABASE_URL
   ```

---

**Created:** 2026-02-25
**Status:** Troubleshooting Guide Ready
