#!/usr/bin/env bash
set -euo pipefail

APP_NAME="openclaw-ru-layer"
INSTALL_DIR="/opt/${APP_NAME}"
ENV_FILE="/etc/${APP_NAME}.env"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
DEFAULT_PORT="18790"
DEFAULT_TARGET="http://127.0.0.1:18789"
PATCH_NGINX="false"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/install.sh [--patch-nginx]"
  exit 1
fi

for arg in "$@"; do
  case "$arg" in
    --patch-nginx)
      PATCH_NGINX="true"
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: sudo bash scripts/install.sh [--patch-nginx]"
      exit 1
      ;;
  esac
done

command -v node >/dev/null 2>&1 || {
  echo "Node.js is required (>=18). Install Node first."
  exit 1
}
NODE_BIN="$(command -v node)"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "${INSTALL_DIR}"

cp "${ROOT_DIR}/server.mjs" "${INSTALL_DIR}/server.mjs"
mkdir -p "${INSTALL_DIR}/public"
cp "${ROOT_DIR}/public/ru-overlay.js" "${INSTALL_DIR}/public/ru-overlay.js"

cat > "${ENV_FILE}" <<EOF
PORT=${DEFAULT_PORT}
TARGET_ORIGIN=${DEFAULT_TARGET}
EOF

cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=OpenClaw Russian overlay layer
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${ENV_FILE}
ExecStart=${NODE_BIN} ${INSTALL_DIR}/server.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "${APP_NAME}.service"

if [[ "${PATCH_NGINX}" == "true" ]]; then
  if ! command -v nginx >/dev/null 2>&1; then
    echo "Nginx not found, skipping nginx patch."
  else
    mapfile -t NGINX_FILES < <(grep -RIl "127.0.0.1:18789\|localhost:18789" /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null || true)
    if [[ "${#NGINX_FILES[@]}" -eq 0 ]]; then
      echo "Could not find nginx upstream with :18789 automatically."
      echo "Manual change needed: route OpenClaw location to 127.0.0.1:${DEFAULT_PORT}"
    else
      for file in "${NGINX_FILES[@]}"; do
        cp "${file}" "${file}.bak.${APP_NAME}"
        sed -i '' "s/127\\.0\\.0\\.1:18789/127.0.0.1:${DEFAULT_PORT}/g" "${file}" 2>/dev/null || \
        sed -i "s/127\\.0\\.0\\.1:18789/127.0.0.1:${DEFAULT_PORT}/g" "${file}"
        sed -i '' "s/localhost:18789/127.0.0.1:${DEFAULT_PORT}/g" "${file}" 2>/dev/null || \
        sed -i "s/localhost:18789/127.0.0.1:${DEFAULT_PORT}/g" "${file}"
        echo "Patched nginx file: ${file}"
      done
      nginx -t
      systemctl reload nginx
    fi
  fi
fi

echo
echo "Installed ${APP_NAME}."
echo "Service: systemctl status ${APP_NAME}.service"
echo "Health:  curl -s http://127.0.0.1:${DEFAULT_PORT}/healthz"
echo
echo "If nginx was not patched automatically, point your OpenClaw upstream to 127.0.0.1:${DEFAULT_PORT}"
