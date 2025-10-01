# Makefile para gerenciar operações Docker do projeto Business-Messages-Manager

.PHONY: up down restart prune clean restart-docker all help

# Cores para saída
GREEN=\033[0;32m
YELLOW=\033[0;33m
RED=\033[0;31m
BLUE=\033[0;34m
NC=\033[0m # No Color

# Valor padrão
default: help

## Inicia os containers em modo detached com rebuild
up:
	@echo "$(GREEN)Iniciando containers com docker-compose (--build)...$(NC)"
	docker-compose up --build -d
	@echo "$(GREEN)Containers iniciados com sucesso!$(NC)"

## Para os containers e remove volumes
down:
	@echo "$(RED)Parando containers e removendo volumes...$(NC)"
	docker-compose down -v
	@echo "$(RED)Containers parados e volumes removidos!$(NC)"

## Remove recursos não utilizados (imagens, containers, redes e volumes não utilizados)
prune:
	@echo "$(YELLOW)Limpando recursos Docker não utilizados...$(NC)"
	docker system prune -f
	@echo "$(YELLOW)Limpeza finalizada!$(NC)"

## Limpa todos os recursos relacionados ao Docker (use com cuidado)
clean:
	@echo "$(RED)Limpando todos os recursos...$(NC)"
	docker-compose down -v
	docker system prune -a -f --volumes
	@echo "$(RED)Limpeza completa finalizada!$(NC)"

## Reinicia o serviço Docker (Windows)
restart-docker:
	@echo "$(YELLOW)Reiniciando o serviço Docker...$(NC)"
	@powershell -Command "Restart-Service -Name docker -Force"
	@echo "$(GREEN)Serviço Docker reiniciado!$(NC)"

## Reinicia todos os containers (down e up)
restart:
	@echo "$(BLUE)Reiniciando os containers...$(NC)"
	$(MAKE) down
	$(MAKE) up
	@echo "$(BLUE)Containers reiniciados com sucesso!$(NC)"

## Executa operações de limpeza completa, reinicia o Docker e levanta os containers
all: down prune restart-docker up
	@echo "$(GREEN)Operação completa finalizada com sucesso!$(NC)"

## Exibe ajuda com os comandos disponíveis
help:
	@echo "$(GREEN)Comandos disponíveis:$(NC)"
	@grep -E '^##' Makefile | sed -e 's/## //' | sed -e 's/^/  /'
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
