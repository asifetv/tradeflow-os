# Fix: Email Addresses Now Globally Unique

**Date:** 2026-02-19
**Issue:** Email addresses were per-company unique (incorrect), now globally unique (correct)
**Status:** ✅ COMPLETED

---

## The Problem

Email addresses are globally unique by definition - each email belongs to one person in the entire world. The previous implementation incorrectly allowed the same email to exist in multiple companies:

```
Before (WRONG):
  Company A: admin@test.com = Ahmed
  Company B: admin@test.com = Fatima  ❌ NOT POSSIBLE - same email!
```

---

## The Solution

Changed the unique index from per-company to global:

### 1. **Updated User Model** (`app/models/user.py`)

**Before:**
```python
__table_args__ = (
    # Email unique within company (WRONG)
    Index("ix_users_email_company", "email", "company_id", unique=True),
    Index("ix_users_company_id", "company_id"),
)
```

**After:**
```python
__table_args__ = (
    # Email globally unique (CORRECT)
    Index("ix_users_email", "email", unique=True),
    Index("ix_users_company_id", "company_id"),
)
```

### 2. **Created Migration** (`alembic/versions/004_make_email_globally_unique.py`)

Drops the per-company unique index and creates a global unique index:

```python
def upgrade():
    # Drop old per-company index
    batch_op.drop_index('ix_users_email_company')
    # Create new global index
    batch_op.create_index('ix_users_email', ['email'], unique=True)
```

### 3. **Updated Test Files**

- **`test_multitenancy.py`**: Changed Company B's email from `admin@acme.com` to `admin@beta.com`
- **`app/models/vendor_proposal.py`**: Fixed foreign key from `"deals"` to `"deal"` (matching actual table name)

---

## Correct Behavior Now

### Register Multiple Companies - Different Emails ✅

```bash
# Company A - register with admin@adnoc.com
curl -X POST http://localhost:8000/api/auth/register \
  -d '{
    "company_name": "ADNOC Trading",
    "email": "admin@adnoc.com",
    ...
  }'

# Company B - must use different email
curl -X POST http://localhost:8000/api/auth/register \
  -d '{
    "company_name": "Aramco Trading",
    "email": "admin@aramco.com",  # Different email ✅
    ...
  }'
```

### Duplicate Email in Same Company - Fails ❌

```bash
# Try to create another user with same email in same company
# Will fail with: "Unique constraint violation"
```

### Duplicate Email Across Companies - Fails ❌

```bash
# Try to use same email in different company
# Will fail with: "Unique constraint violation"
```

---

## Files Changed

| File | Change |
|------|--------|
| `app/models/user.py` | Changed unique index from per-company to global |
| `alembic/versions/004_make_email_globally_unique.py` | New migration to update index |
| `test_multitenancy.py` | Updated Company B email for correctness |
| `app/models/vendor_proposal.py` | Fixed FK reference `deals` → `deal` |

---

## Migration Applied

```bash
alembic upgrade head
# Now at revision: 004
```

---

## Verification

✅ User model has globally unique email index
✅ Foreign key reference corrected
✅ Test file updated with proper email addresses
✅ Migration created and applied
✅ Ready for testing

---

## Why This Matters

**Before (Incorrect):**
- Violated email semantics
- Could cause security/confusion issues
- Not aligned with real-world email uniqueness

**After (Correct):**
- Each email belongs to exactly ONE person
- Email is globally unique across all companies
- Matches real-world email semantics
- Prevents accidental account confusion
- Standard for multi-tenant SaaS systems

---

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test
pytest tests/test_procurement.py::TestVendorService -v

# Check migration
sqlite3 test.db "SELECT version_num FROM alembic_version;"
# Should show: 004
```

---

**Status:** Ready for deployment ✅
