#!/bin/sh
set -e

# Garantir que o script tem permissões de execução
echo "Executando migrations do banco de dados..."
python -m alembic upgrade head

echo "Migrations completas. Iniciando servidor Uvicorn..."
# Garantir idiomas padrão presentes
python - <<'PY'
from app.db.session import SessionLocal
from app.models.business_message import Language

session = SessionLocal()
defaults = ["en", "es", "pt-BR"]
try:
    for code in defaults:
        if session.get(Language, code) is None:
            session.add(Language(code=code))
    session.commit()
finally:
    session.close()
PY
# Configuração de logging simples com alta verbosidade
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --log-level trace \
  --access-log \
  --no-use-colors \
  --reload
