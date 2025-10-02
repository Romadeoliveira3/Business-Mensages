#!/bin/sh
set -e

# Garantir que o script tem permissões de execução
echo "Executando migrations do banco de dados..."
python -m alembic upgrade head

echo "Migrations completas. Iniciando servidor Uvicorn..."
# Configuração de logging simples com alta verbosidade
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --log-level trace \
  --access-log \
  --no-use-colors \
  --reload