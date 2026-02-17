# TradeFlow OS

Production-grade oil & gas trading platform built with Python/FastAPI, React, and PostgreSQL.

## Tech Stack

- **Backend**: FastAPI 0.115+, SQLAlchemy 2.0, Pydantic v2, async/await
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL 16 + pgvector, Redis 7
- **Storage**: MinIO (S3-compatible)
- **Background Jobs**: Celery + Redis
- **AI**: Anthropic Claude SDK with Pydantic structured outputs
- **Infrastructure**: Docker Compose, GitHub Actions

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.12+ (for local development)
- Node.js 18+ (for frontend)

### Setup

1. **Clone and configure**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start services**
   ```bash
   make dev
   ```

3. **Run migrations**
   ```bash
   make migrate
   ```

4. **Seed demo data**
   ```bash
   make seed
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - MinIO Console: http://localhost:9001

## Project Structure

```
tradeflow-os/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── api/             # FastAPI routers
│   │   ├── services/        # Business logic layer
│   │   ├── middleware/      # FastAPI middleware (auth, RBAC)
│   │   ├── workers/         # Celery tasks
│   │   ├── main.py          # FastAPI app factory
│   │   ├── config.py        # Settings
│   │   ├── database.py      # SQLAlchemy setup
│   │   └── deps.py          # FastAPI dependencies
│   ├── alembic/             # Database migrations
│   ├── seeds/               # Demo data seeding
│   ├── tests/               # Test suite
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/
│   ├── app/                 # Next.js app router
│   │   ├── (auth)/login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── deals/
│   │   ├── customers/
│   │   └── ...
│   ├── components/          # React components
│   ├── lib/
│   │   ├── api.ts          # Typed API client
│   │   ├── auth.ts         # Auth utilities
│   │   └── types.ts        # Auto-generated from OpenAPI
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── Makefile
├── .env.example
└── README.md
```

## Development Workflow

### Backend

```bash
# Backend files are auto-reloaded with uvicorn --reload
# Logs appear in Docker output

# Run tests
make test

# Format code
make format

# Create migration
docker-compose exec api alembic revision --autogenerate -m "Add new column"
docker-compose exec api alembic upgrade head
```

### Frontend

```bash
# Next.js hot reload works automatically
# Access http://localhost:3000

# Generate types from OpenAPI
make generate-types
```

## Build Order (Module-by-Module)

1. **M0 - Foundation** ✅ (In progress)
   - Project setup, Docker, auth, database models

2. **M1 - Deal Hub**
   - Deal CRUD, status machine, pipeline view

3. **M3 - Procurement**
   - Vendors, proposals, comparison dashboard

4. **M4 - AI Engine**
   - Document parsing, semantic search

5. **M2 - CRM & Sales**
   - Customers, quotes, customer POs

6. **M5 - Finance**
   - Payments, invoicing, P&L

7. **M6 - Dashboard**
   - KPIs, charts, activity feed

8. **M7 - Quality & Logistics** (Post-MVP)
   - TPI, certificates, freight, customs

## Environment Variables

See `.env.example` for all configuration options. Key variables:

- `ANTHROPIC_API_KEY`: Claude API key for document parsing
- `DATABASE_URL`: PostgreSQL connection string
- `MINIO_*`: Object storage credentials
- `JWT_SECRET_KEY`: Change in production!
- `SMTP_*`: Email configuration

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Spec**: http://localhost:8000/openapi.json

## Database

### Migrations

```bash
# Create migration
docker-compose exec api alembic revision --autogenerate -m "Description"

# Apply migrations
docker-compose exec api alembic upgrade head

# Rollback
docker-compose exec api alembic downgrade -1
```

### Models

All 12 core entities are defined in `backend/app/models/`:
- User, Customer, Vendor, Deal
- VendorProposal, Quote, CustomerPO, VendorPO
- Payment, Invoice, Document, ActivityLog

## Testing

```bash
# Run all tests
make test

# Run specific test
docker-compose exec api pytest tests/test_auth.py -v

# With coverage
docker-compose exec api pytest --cov=app tests/
```

## Production Hardening

See `tradeflow-build-plan-python.pdf` Section 11 for the complete checklist:

- ✅ Password hashing (bcrypt)
- ✅ JWT in httpOnly cookies
- ✅ CORS configured
- ✅ Rate limiting
- ✅ Input validation
- ✅ Structured logging
- ✅ Error tracking (Sentry)
- ✅ Database backups
- ✅ Health checks

## Monitoring & Observability

- **Logs**: Structured JSON via structlog
- **Errors**: Sentry (set `SENTRY_DSN`)
- **Uptime**: Uptime Robot (recommended)
- **Health**: `/healthz` and `/readyz` endpoints

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit with clear messages: `git commit -m "Add feature: description"`
4. Push and create a pull request

## License

Proprietary - TradeFlow OS

## Support

For issues or questions, contact the development team.

---

Built with ❤️ for the oil & gas industry | Generated with Claude Code
