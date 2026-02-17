.PHONY: help dev down migrate seed test lint format generate-types clean

help:
	@echo "TradeFlow OS - Available commands:"
	@echo "  make dev              - Start development environment"
	@echo "  make down             - Stop containers"
	@echo "  make migrate          - Run database migrations"
	@echo "  make seed             - Seed database with demo data"
	@echo "  make test             - Run tests"
	@echo "  make lint             - Run code linters"
	@echo "  make format           - Format code with black"
	@echo "  make generate-types   - Generate TypeScript types from OpenAPI"
	@echo "  make clean            - Clean up containers and data"

dev:
	docker-compose up -d
	@echo "✓ Services started: Postgres, Redis, MinIO, FastAPI, Next.js"
	@echo "  API:      http://localhost:8000"
	@echo "  Frontend: http://localhost:3000"
	@echo "  MinIO:    http://localhost:9001"

down:
	docker-compose down

migrate:
	docker-compose exec api alembic upgrade head

seed:
	docker-compose exec api python -m backend.seeds.main

test:
	docker-compose exec api pytest -v

lint:
	cd backend && python -m flake8 app --max-line-length=120
	cd backend && python -m isort --check-only app

format:
	cd backend && python -m black app
	cd backend && python -m isort app

generate-types:
	@echo "Generating TypeScript types from OpenAPI spec..."
	npx openapi-typescript http://localhost:8000/openapi.json -o frontend/lib/types.ts

clean:
	docker-compose down -v
	rm -rf backend/__pycache__ backend/.pytest_cache
	rm -rf frontend/node_modules frontend/.next

.PHONY: help dev down migrate seed test lint format generate-types clean
