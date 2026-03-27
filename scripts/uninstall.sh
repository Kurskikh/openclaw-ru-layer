#!/usr/bin/env bash
set -euo pipefail

APP_NAME="openclaw-ru-layer"
INSTALL_DIR="/opt/${APP_NAME}"
ENV_FILE="/etc/${APP_NAME}.env"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/uninstall.sh"
  exit 1
fi

if systemctl list-unit-files | grep -q "^${APP_NAME}.service"; then
  systemctl disable --now "${APP_NAME}.service" || true
fi

rm -f "${SERVICE_FILE}"
rm -f "${ENV_FILE}"
rm -rf "${INSTALL_DIR}"
systemctl daemon-reload

echo "Removed ${APP_NAME}."
echo "If nginx was patched, restore from *.bak.${APP_NAME} backups manually if needed."
