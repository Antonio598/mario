#!/usr/bin/env sh
# =============================================================================
# Copia de seguridad diaria de la base de n8n a almacenamiento externo.
#
# n8n guarda en su Postgres los workflows, las credenciales cifradas y el
# historial de ejecuciones. Perder esa base significa reconstruir a mano el
# pipeline de contenido completo.
#
# Ejecutar como cron diario. En EasyPanel: Service > Scheduled Tasks, o un cron
# del host que invoque este script.
#
# Requiere en el entorno:
#   PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
#   S3_BUCKET S3_ENDPOINT AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
#   TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID
# =============================================================================

# -e aborta al primer fallo, -u trata una variable sin definir como error.
# Sin -u, una variable mal escrita produciria una ruta vacia y el script
# reportaria exito habiendo subido un fichero a ninguna parte.
set -eu

RETENCION_DIAS=30
FECHA="$(date +%Y-%m-%d)"
ARCHIVO="/tmp/n8n-${FECHA}.sql.gz"

avisar() {
  # El mismo canal que usa la aprobacion de articulos: un solo sitio que mirar.
  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
    curl -s -X POST \
      "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${TELEGRAM_CHAT_ID}" \
      -d "text=$1" > /dev/null || true
  fi
}

# Cualquier salida no controlada avisa. Una copia de seguridad que falla en
# silencio es peor que no tenerla: da una falsa sensacion de proteccion.
trap 'avisar "❌ Reset Alfa · fallo en la copia de n8n del ${FECHA}"' EXIT

pg_dump --no-owner --no-acl --clean --if-exists | gzip -9 > "$ARCHIVO"

TAMANO="$(wc -c < "$ARCHIVO")"
if [ "$TAMANO" -lt 1024 ]; then
  echo "La copia pesa ${TAMANO} bytes: es sospechosamente pequena." >&2
  exit 1
fi

aws s3 cp "$ARCHIVO" "s3://${S3_BUCKET}/n8n/n8n-${FECHA}.sql.gz" \
  --endpoint-url "$S3_ENDPOINT"

# Retencion. Se aplica en destino, no en local, porque el fichero local se borra
# al terminar.
LIMITE="$(date -d "-${RETENCION_DIAS} days" +%Y-%m-%d 2>/dev/null || date -v-${RETENCION_DIAS}d +%Y-%m-%d)"
aws s3 ls "s3://${S3_BUCKET}/n8n/" --endpoint-url "$S3_ENDPOINT" \
  | awk '{print $4}' \
  | while read -r objeto; do
      case "$objeto" in
        n8n-*.sql.gz)
          f="$(echo "$objeto" | sed 's/n8n-\(.*\)\.sql\.gz/\1/')"
          if [ "$f" \< "$LIMITE" ]; then
            aws s3 rm "s3://${S3_BUCKET}/n8n/${objeto}" --endpoint-url "$S3_ENDPOINT"
          fi
          ;;
      esac
    done

rm -f "$ARCHIVO"

trap - EXIT
avisar "✅ Reset Alfa · copia de n8n del ${FECHA} completada ($((TAMANO / 1024)) KB)"
