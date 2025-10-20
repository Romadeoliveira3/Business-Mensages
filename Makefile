# Makefile para gerenciar operações Docker do projeto Business-Messages-Manager

.PHONY: up down restart prune clean restart-docker all help test test-one

# Configuração para Docker
LOCAL_DOCKER_CONFIG ?= 0
DOCKER_CONFIG_DIR := $(CURDIR)/.docker-config

ifeq ($(LOCAL_DOCKER_CONFIG),1)
DC = docker compose
else
DC = docker compose
endif

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
	@echo "$(GREEN)Iniciando containers com docker compose (--build)...$(NC)"
	$(DC) up --build -d
	@echo "$(GREEN)Containers iniciados com sucesso!$(NC)"

## Para os containers e remove volumes
down:
	@echo "$(RED)Parando containers e removendo volumes...$(NC)"
	$(DC) down -v
	@echo "$(RED)Containers parados e volumes removidos!$(NC)"

## Remove recursos não utilizados (imagens, containers, redes e volumes não utilizados)
prune:
	@echo "$(YELLOW)Limpando recursos Docker não utilizados...$(NC)"
	docker system prune -f
	@echo "$(YELLOW)Limpeza finalizada!$(NC)"

## Limpa todos os recursos relacionados ao Docker (use com cuidado)
clean:
	@echo "$(RED)Limpando todos os recursos...$(NC)"
	$(DC) down -v
	docker system prune -a -f --volumes
	@echo "$(RED)Limpeza completa finalizada!$(NC)"

## Reinicia o serviço Docker
restart-docker:
	@echo "$(YELLOW)Reiniciando o serviço Docker...$(NC)"
	@echo "$(YELLOW)Nota: Este comando pode requerer sudo no WSL ou ser executado diretamente no Windows$(NC)"
	-@(command -v sudo >/dev/null 2>&1 && sudo service docker restart) || echo "Execute 'Restart-Service -Name docker -Force' no PowerShell como administrador"
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


## Roda o seed de mensagens no container backend
seed:
	@echo "$(BLUE)Rodando seeds no container backend...$(NC)"
	$(DC) exec backend python -m app.seed_messages
	@echo "$(GREEN)Seeds executados com sucesso!$(NC)"

## Roda todos os testes do backend com pytest
test:
	@echo "$(BLUE)Executando suite completa de testes do backend...$(NC)"
	$(DC) exec backend poetry run pytest -q --disable-warnings --maxfail=1 -rA
	@echo "$(GREEN)Testes finalizados!$(NC)"

## Roda um teste específico do backend (ex.: make test-one target=tests/test_file.py::TestClass::test_case)
test-one:
	@if [ -z "$(target)" ]; then \
		echo "$(RED)Informe o alvo do pytest usando target=... (ex.: tests/test_module.py::TestClass::test_name).$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Executando teste do backend: $(target)...$(NC)"
	$(DC) exec backend poetry run pytest -q --disable-warnings --maxfail=1 -rA $(target)
	@echo "$(GREEN)Teste finalizado!$(NC)"


## Exibe ajuda com os comandos disponíveis
help:
	@echo "$(GREEN)Comandos disponíveis:$(NC)"
	@grep -E '^##' Makefile | sed -e 's/## //' | sed -e 's/^/  /'
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
