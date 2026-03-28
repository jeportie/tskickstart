COMPOSE := $(shell if command -v docker-compose >/dev/null 2>&1; then echo docker-compose; elif docker compose version >/dev/null 2>&1; then echo "docker compose"; else echo docker-compose; fi)

.PHONY: docker-up docker-down docker-logs docker-build docker-db-up docker-db-down docker-db-logs docker-db-shell docker-db-migrate

docker-up: ; $(COMPOSE) up --build

docker-down: ; $(COMPOSE) down

docker-logs: ; $(COMPOSE) logs -f

docker-build: ; $(COMPOSE) build

docker-db-up: ; $(COMPOSE) up -d db

docker-db-down: ; $(COMPOSE) stop db

docker-db-logs: ; $(COMPOSE) logs -f db

docker-db-shell: ; $(COMPOSE) exec db sh

docker-db-migrate: ; npm run db:migrate
