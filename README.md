# OpenClaw RU Layer

Русская прослойка "поверх" OpenClaw.

Что делает:

- не трогает backend OpenClaw;
- работает как reverse proxy;
- оставляет тот же личный кабинет;
- переводит интерфейс на русский через оверлей.

## Версия и покрытие

Словарь собран и отлажен против **OpenClaw v2026.5.12** (бандл `index-Bsr3gFG6.js`),
дополнительно проверен на **v2026.5.18** (`index-quv2B8bV.js`).

| Метрика | v2026.5.12 | v2026.5.18 |
|---|---|---|
| English UI-строк извлечено из бандла | 2 232 | 1 275 |
| Точные совпадения со словарём | 341 (~15%) | 144 (~11%) |
| Строк, которых касается overlay (substring) | **555 (~25%)** | **264 (~21%)** |
| Записей в словаре | 455 уникальных |

Цифры — это доля всех текстовых литералов из JS-бандла. Визуально перевод
ощущается богаче, потому что чаще всего пользователь видит как раз
покрытые элементы (сайдбар, заголовки страниц, кнопки, статусы).

**Что переведено хорошо:**

- сайдбар, breadcrumb, главный экран Overview;
- форма логина и экран ошибки "origin not allowed";
- раздел «Сны» (Dream Diary, Memory Palace, Imported Insights, тулбары);
- типовые кнопки (Save / Cancel / Edit / Search / Connect и т.п.);
- баннер обновлений, типовые empty-state.

**Что переведено частично или не переведено:**

- глубокие настройки моделей/провайдеров;
- динамические сообщения с интерполяцией (`${...}`);
- большая часть Cron-форм, Approvals-флоу, Communications;
- tooltip'ы редких контролов;
- сообщения realtime/audio-стека.

После апгрейда OpenClaw до новой версии часть строк может расходиться —
дописывайте недостающее в `public/ru-overlay.js`. Файл монтируется в
контейнер как volume, правки применяются по Ctrl+F5 без рестарта.

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
