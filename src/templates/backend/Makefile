COMPOSE := $(shell if command -v docker-compose >/dev/null 2>&1; then echo docker-compose; elif docker compose version >/dev/null 2>&1; then echo "docker compose"; else echo docker-compose; fi)

.PHONY: docker-up docker-down docker-logs docker-build

docker-up: ; $(COMPOSE) up --build

docker-down: ; $(COMPOSE) down

docker-logs: ; $(COMPOSE) logs -f

docker-build: ; $(COMPOSE) build
