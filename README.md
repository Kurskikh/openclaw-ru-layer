# OpenClaw RU Layer

Русская прослойка "поверх" OpenClaw.

Что делает:

- не трогает backend OpenClaw;
- работает как reverse proxy;
- оставляет тот же личный кабинет;
- переводит интерфейс на русский через оверлей.

## Установка для других пользователей (ваш сценарий)

Пользователь может просто скачать ваш репозиторий и выполнить:

```bash
git clone <your-repo-url>
cd openclaw-ru-layer
sudo bash scripts/install.sh --patch-nginx
```

После установки:

- сервис: `openclaw-ru-layer.service`;
- локальный порт прослойки: `18790`;
- целевой OpenClaw: `http://127.0.0.1:18789` (по умолчанию);
- при `--patch-nginx` скрипт попытается автоматически переключить nginx с `:18789` на `:18790`.

## Проверка

```bash
systemctl status openclaw-ru-layer.service
curl -s http://127.0.0.1:18790/healthz
```

Откройте ваш обычный URL кабинета OpenClaw — интерфейс будет на русском.

## Обновление

```bash
cd openclaw-ru-layer
git pull
sudo bash scripts/install.sh --patch-nginx
```

## Удаление

```bash
cd openclaw-ru-layer
sudo bash scripts/uninstall.sh
```

## Ручной запуск (без systemd)

```bash
npm start
```

Переменные окружения:

- `TARGET_ORIGIN` — куда проксировать;
- `PORT` — порт сервера прослойки.

Пример:

```bash
TARGET_ORIGIN=http://127.0.0.1:18789 PORT=18790 npm start
```

## Docker

```bash
docker build -t openclaw-ru-layer .
docker run --rm -p 18790:18790 -e PORT=18790 -e TARGET_ORIGIN=http://host.docker.internal:18789 openclaw-ru-layer
```

## Ограничения

- Это runtime-перевод (не нативный i18n внутри OpenClaw UI).
- После обновлений OpenClaw может потребоваться обновлять словарь в `public/ru-overlay.js`.
