<div align="center">

# PhoneDeck

**Аппаратно-программный комплекс для борьбы с информационной зависимостью**

Станция фиксирует момент помещения и извлечения телефона, отображает время на дисплее и отправляет данные на веб-сервер.

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.x-000000?style=flat&logo=flask)](https://flask.palletsprojects.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat&logo=sqlite)](https://sqlite.org)
[![Arduino](https://img.shields.io/badge/Arduino-Uno%20%2B%20ESP8266-00979D?style=flat&logo=arduino)](https://arduino.cc)

**Сайт: http://109.73.206.169**

</div>

---

## Содержание

- [Архитектура](#архитектура)
- [Серверная часть](#серверная-часть)
- [Фронтенд](#фронтенд)
- [API](#api)
- [Хостинг и деплой](#хостинг-и-деплой)
- [Перенос на новый хостинг](#перенос-на-новый-хостинг)
- [Настройка окружения разработчика](#настройка-окружения-разработчика)
- [Аппаратная часть](#аппаратная-часть)
- [Устранение неполадок](#устранение-неполадок)
- [Известные ограничения](#известные-ограничения)

---

## Архитектура

### Схема системы

```
┌────────────────────────── СТАНЦИЯ ───────────────────────────┐
│                                                              │
│  [Телефон] → [Концевик] → [Arduino Uno] ──UART──► [ESP8266] │
│                                │                      │      │
│                         [Дисплей ММ:СС]          WiFi POST   │
└───────────────────────────────────────────────────┬──────────┘
                                                    ↓
                                       ┌─────────────────────┐
                                       │      VPS СЕРВЕР      │
                                       │                      │
                                       │  nginx :80           │
                                       │    ↓                 │
                                       │  gunicorn :5000      │
                                       │    ↓                 │
                                       │  Flask (app.py)      │
                                       │    ↓           ↓     │
                                       │  devices.db  users.db│
                                       │    ↓                 │
                                       │  React (build/)      │
                                       └─────────────────────┘
```

### Стек технологий

| Слой | Технология | Роль |
|------|-----------|------|
| Контроллер | Arduino Uno + C++ | Чтение 6 концевиков, управление 6 дисплеями I2C, RTC DS3231 |
| WiFi-модуль | ESP8266 NodeMCU | Приём данных от Arduino по UART, HTTP POST на сервер |
| Бэкенд | Flask (Python 3) | REST API, авторизация, раздача фронтенда |
| Фронтенд | React 18 (CRA) | Отображение данных, навигация, бонусная система |
| БД | SQLite × 2 | `devices.db` — журнал сеансов, `users.db` — пользователи |
| Прокси | nginx + gunicorn | Продакшен-окружение |

### Структура проекта

```
phonedeck/
├── app.py                      # Flask: API + раздача React-билда
├── requirements.txt            # Python-зависимости
├── Procfile                    # gunicorn: web: gunicorn app:app
├── build.sh                    # Скрипт сборки (pip + npm + cp)
├── devices.db                  # Журнал сеансов (в .gitignore)
├── users.db                    # Пользователи (должен быть в .gitignore!)
│
├── frontend/                   # Исходники React
│   ├── public/
│   │   └── runtime-config.js   # Базовый URL API
│   └── src/
│       ├── api.js              # apiUrl() + Bearer-токен
│       ├── firebase.js         # Firebase (подключён, не используется)
│       ├── pages/              # Страницы приложения
│       ├── components/         # Переиспользуемые компоненты
│       └── context/            # Auth + Bonuses контексты
│
├── build/                      # Скомпилированный React (в .gitignore!)
│
└── arduino/                    # Скетчи микроконтроллеров
    ├── Arduino_230225/         # Arduino Uno — главный контроллер
    ├── NodeMCU_updated/        # ESP8266 — WiFi + POST на сервер
    ├── ESP32S_POST.ino         # ESP32 — тестовый POST
    ├── ESP32S_Sensors.ino      # ESP32 — лазерные датчики
    ├── RTC_SetTime.ino         # Установка времени DS3231
    └── Display_SetAddress.ino  # Установка I2C-адреса дисплея
```

---

## Серверная часть

### Что делает `app.py`

1. Принимает `POST /save` с данными от ESP8266
2. Отдаёт `GET /get_data` — все записи из `devices.db`
3. Управляет авторизацией (`/api/register`, `/api/login`, `/api/me`)
4. Панель администратора (`/api/admin/*`)
5. Раздаёт скомпилированный React из `build/` + поддержка React Router

### Переменные окружения

| Переменная | Обязательна | Описание |
|------------|:-----------:|----------|
| `FLASK_SECRET_KEY` | **Да** | Подпись Bearer-токенов. По умолчанию `dev-secret-change-in-production` — **небезопасно в продакшене** |

```bash
# Сгенерировать случайный ключ
openssl rand -hex 32
```

### Встроенный администратор

При каждом старте Flask пересоздаёт аккаунт `admin` с паролем `adminkabphonedeck`. Пароль задан константой `DEFAULT_ADMIN_PASSWORD` в `app.py` — смените его в коде, чтобы изменение было постоянным.

### Базы данных

**`devices.db`** — журнал сеансов, таблица `devices`:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | INTEGER PRIMARY KEY | Автоинкремент |
| `name` | TEXT | ФИО |
| `model` | TEXT | Модель телефона |
| `charge` | TEXT | Заряд батареи |
| `connection_time` | TEXT | Время помещения (ЧЧ:ММ) |
| `disconnection_time` | TEXT | Время извлечения (ЧЧ:ММ) |

**`users.db`** — пользователи, таблица `users`:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | INTEGER PRIMARY KEY | Автоинкремент |
| `username` | TEXT UNIQUE | Логин |
| `password_hash` | TEXT | Хэш пароля (werkzeug) |
| `last_name` / `first_name` / `patronymic` | TEXT | ФИО |
| `phone_model` | TEXT | Модель телефона пользователя |
| `is_admin` | INTEGER | `0` = пользователь, `1` = администратор |

> Схема таблиц создаётся автоматически при первом запуске — вручную создавать БД не нужно.

### Python-зависимости

```
Flask           веб-фреймворк
Flask-Cors      CORS-заголовки
gunicorn        WSGI-сервер
itsdangerous    подпись токенов авторизации
werkzeug        хэширование паролей
```

> **Важно:** текущий `requirements.txt` содержит только первые три. `itsdangerous` и `werkzeug` входят в состав Flask транзитивно, но лучше зафиксировать явно. После стабильного деплоя выполни `pip freeze > requirements.txt`.

---

## Фронтенд

### Страницы

| Маршрут | Страница | Источник данных |
|---------|----------|-----------------|
| `/viewPage` | Обзор станции | `GET /get_data` |
| `/rating/school` | Рейтинг по школе | ⚠️ Заглушка |
| `/rating/classes` | Рейтинг по классам | ⚠️ Заглушка |
| `/statistics` | Статистика | ⚠️ Заглушка |
| `/bonuses` | Бонусы | Локальный Context |
| `/station` | Статус станций | ⚠️ Заглушка |
| `/contacts` | Контакты | ⚠️ Заглушка |
| `/login` | Вход | `POST /api/login` |
| `/register` | Регистрация | `POST /api/register` |
| `/profile` | Профиль | `GET /PATCH /api/me` |
| `/admin` | Администрирование | `/api/admin/*` |

> Страницы с пометкой ⚠️ **Заглушка** используют `https://jsonplaceholder.typicode.com/users` — это тестовый внешний сервис, не связанный с бэкендом. Не является багом переноса.

### Конфигурация URL (`runtime-config.js`)

`frontend/public/runtime-config.js` загружается до React и задаёт базовый адрес API:

```javascript
// Стандарт — тот же хост, с которого открыт сайт
window.__PHONEDECK_API_BASE__ = "";

// Если фронт и бэк на разных серверах:
window.__PHONEDECK_API_BASE__ = "http://новый-ip-или-домен";
```

После `npm run build` файл автоматически копируется в `build/`.

---

## API

### `POST /save`

Приём данных от ESP8266.

```json
// Запрос
{
  "name": "Петров А.Д.",
  "model": "TCL",
  "charge": "71%",
  "connection_time": "09:15",
  "disconnection_time": "10:30"
}

// Ответ 201
{ "message": "Data saved successfully" }
```

Ошибки: `400` — нет обязательных полей, `500` — ошибка БД.

### `GET /get_data`

Все записи из `devices.db`.

```json
[
  {
    "id": 1,
    "name": "Петров А.Д.",
    "model": "TCL",
    "charge": "71%",
    "connection_time": "09:15",
    "disconnection_time": "10:30"
  }
]
```

### `GET /health`

```json
{ "status": "ok" }
```

### Auth-эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/register` | Регистрация |
| POST | `/api/login` | Вход → Bearer-токен (14 дней) |
| GET | `/api/me` | Профиль текущего пользователя |
| PATCH | `/api/me` | Обновление профиля |
| GET | `/api/admin/users` | Список всех пользователей (только admin) |
| PATCH | `/api/admin/users/:id/role` | Изменить роль пользователя (только admin) |
| GET | `/api/admin/health/databases` | Состояние обеих БД (только admin) |

```bash
# Пример отправки данных
curl -X POST http://109.73.206.169/save \
  -H "Content-Type: application/json" \
  -d '{"name":"Иванов С.М.","model":"Samsung","charge":"85%","connection_time":"14:30","disconnection_time":"15:45"}'
```

---

## Хостинг и деплой

### Текущий сервер

| Параметр | Значение |
|----------|----------|
| Провайдер | Timeweb Cloud |
| ОС | Ubuntu 24.04 LTS |
| IP | 109.73.206.169 |
| CPU / RAM | 1 vCPU / 1 GB |
| Диск | 15 GB NVMe |

Схема: `nginx :80` → `gunicorn :5000` → `Flask app.py`

### Конфигурационные файлы

**`/etc/systemd/system/phonedeck.service`**

```ini
[Unit]
Description=PhoneDeck Flask App
After=network.target

[Service]
User=root
WorkingDirectory=/opt/phonedeck
Environment="FLASK_SECRET_KEY=замените-на-случайную-строку"
ExecStart=/opt/phonedeck/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**`/etc/nginx/sites-available/phonedeck`**

```nginx
server {
    listen 80;
    server_name _;

    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Файрвол (UFW): `22/tcp` · `80/tcp` · `443/tcp`

### Деплой обновлений

```bash
ssh root@109.73.206.169
cd /opt/phonedeck
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
cd frontend && npm ci && CI=false npm run build && cd ..
cp -r frontend/build ./build
sudo systemctl restart phonedeck
```

### Логи

```bash
sudo journalctl -u phonedeck -f           # в реальном времени
sudo journalctl -u phonedeck -n 100       # последние 100 строк
sudo systemctl status phonedeck           # статус + хвост лога
```

---

## Перенос на новый хостинг

### Требования к серверу

| | Минимум | Рекомендуется |
|-|---------|---------------|
| ОС | Ubuntu 20.04+ | Ubuntu 24.04 LTS |
| RAM | 512 MB | 1 GB |
| Диск | 5 GB | 15 GB |
| Python | 3.8+ | 3.11+ |
| Node.js | 16+ | 20 LTS |
| Порты | 22, 80 | 22, 80, 443 |

---

### Шаг 1 — Получить код

```bash
# Через Git
git clone https://github.com/Nairs228/phonedeck /opt/phonedeck

# Или через архив
scp phonedeck.zip root@НОВЫЙ-IP:/opt/
ssh root@НОВЫЙ-IP "cd /opt && unzip phonedeck.zip && mv phonedeck /opt/phonedeck"
```

---

### Шаг 2 — Перенести базы данных

Базы данных **не хранятся в репозитории** — их нужно скопировать вручную.

```bash
# Резервная копия (на старом сервере)
sqlite3 /opt/phonedeck/devices.db ".backup '/tmp/devices_bak.db'"
sqlite3 /opt/phonedeck/users.db   ".backup '/tmp/users_bak.db'"

# Копирование на новый сервер
scp root@109.73.206.169:/opt/phonedeck/devices.db root@НОВЫЙ-IP:/opt/phonedeck/
scp root@109.73.206.169:/opt/phonedeck/users.db   root@НОВЫЙ-IP:/opt/phonedeck/
```

> Если старый сервер недоступен — БД пересоздадутся пустыми при первом запуске. Данные сеансов и пользователи потеряются.

> `build/` **не переносить** — он пересобирается на новом сервере на шаге 5.

---

### Шаг 3 — Установить системные пакеты

```bash
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv nginx nodejs npm git curl unzip sqlite3
```

Проверить версии:

```bash
python3 --version   # >= 3.8
node --version      # >= 16
```

> **Мелочь: Node.js слишком старый (Ubuntu 20.04 ставит 10–12)**
>
> ```bash
> curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
> apt install -y nodejs
> ```

---

### Шаг 4 — Python-окружение

```bash
cd /opt/phonedeck
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Проверить:

```bash
python -c "import flask, flask_cors, itsdangerous, werkzeug; print('OK')"
```

> **Мелочь: ошибка `externally-managed-environment`** (Debian 12 / Ubuntu 24) — убедитесь, что вы активировали venv **до** `pip install`:
>
> ```bash
> source venv/bin/activate   # обязательно перед pip
> pip install -r requirements.txt
> ```

---

### Шаг 5 — Собрать фронтенд

```bash
cd /opt/phonedeck/frontend
npm ci
CI=false npm run build
cd ..
cp -r frontend/build ./build
```

> **Мелочь: почему `CI=false`?**
> Без этого флага `react-scripts build` трактует ESLint-предупреждения как ошибки и падает. Флаг обязателен на сервере.

> **Мелочь: сборка вылетает с `Killed`** — нехватка RAM (актуально для 512 MB). Создать swap:
>
> ```bash
> fallocate -l 1G /swapfile && chmod 600 /swapfile
> mkswap /swapfile && swapon /swapfile
> ```
> После этого повторить сборку.

> **Мелочь: `npm ci` падает с `Cannot find module`** — удалить `node_modules` и повторить:
>
> ```bash
> rm -rf node_modules && npm ci
> ```

---

### Шаг 6 — Проверить `runtime-config.js`

```bash
cat /opt/phonedeck/build/runtime-config.js
```

Для стандартного деплоя (один сервер) должно быть:

```javascript
window.__PHONEDECK_API_BASE__ = "";
```

Если нужно явно указать адрес — отредактировать `frontend/public/runtime-config.js` и **пересобрать фронтенд**.

---

### Шаг 7 — Создать systemd-сервис

```bash
openssl rand -hex 32   # Сгенерировать ключ и скопировать
nano /etc/systemd/system/phonedeck.service
```

```ini
[Unit]
Description=PhoneDeck Flask App
After=network.target

[Service]
User=root
WorkingDirectory=/opt/phonedeck
Environment="FLASK_SECRET_KEY=ВСТАВЬТЕ-КЛЮЧ-СЮДА"
ExecStart=/opt/phonedeck/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable phonedeck
systemctl start phonedeck
curl http://127.0.0.1:5000/health    # Должно вернуть: {"status": "ok"}
```

> **Мелочь: сервис упал сразу** — смотреть причину:
>
> ```bash
> journalctl -u phonedeck -n 30 --no-pager
> ```
>
> Частые причины: неверный путь к `gunicorn`, не активирован venv, отсутствующий пакет, неверный `WorkingDirectory`.

> **Мелочь: `FLASK_SECRET_KEY` не подхватывается** — если задали через `export` в терминале, сервис переменную не видит. Она должна быть в секции `[Service]` файла, не в `.bashrc`. После правки юнит-файла: `systemctl daemon-reload && systemctl restart phonedeck`.

---

### Шаг 8 — Настроить nginx

```bash
nano /etc/nginx/sites-available/phonedeck
```

```nginx
server {
    listen 80;
    server_name _;

    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/phonedeck /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default    # убрать дефолтный сайт nginx
nginx -t                                   # проверить конфиг на ошибки
systemctl enable nginx && systemctl restart nginx
```

> **Мелочь: `nginx -t` говорит `bind() to 0.0.0.0:80 failed`** — порт занят другим процессом:
>
> ```bash
> ss -tlnp | grep :80    # найти кто занял
> systemctl stop apache2  # обычно это apache
> ```

---

### Шаг 9 — Файрвол

```bash
ufw allow 22/tcp    # СНАЧАЛА разрешить SSH — иначе потеряете доступ!
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

> **Мелочь: потеря SSH после `ufw enable`** — если 22/tcp не был разрешён до включения файрвола, соединение оборвётся. Восстановить доступ можно только через KVM/VNC-консоль в панели хостинга.

---

### Шаг 10 — Перепрошить ESP8266 (если IP изменился)

В скетче `arduino/NodeMCU_updated/NodeMCU_updated.ino` найти строку с адресом сервера:

```cpp
const char* host = "109.73.206.169";   // заменить на новый IP или домен
```

Затем перепрошить (см. [Прошивка ESP8266](#прошивка-esp8266)).

> Лучше указывать **доменное имя**, а не IP — домен стабильнее при смене сервера.

> **Мелочь:** изменения в `runtime-config.js` недостаточно — ESP8266 шлёт данные на IP, зашитый в прошивке, и о `runtime-config.js` ничего не знает.

---

### Шаг 11 — Финальная проверка

```bash
curl http://127.0.0.1:5000/health    # {"status": "ok"}
curl http://НОВЫЙ-IP/health          # {"status": "ok"}
curl http://НОВЫЙ-IP/get_data        # [] или список устройств
curl -I http://НОВЫЙ-IP/             # HTTP/1.1 200
journalctl -u phonedeck -n 50 --no-pager   # нет ошибок
```

---

### Опционально: HTTPS через Let's Encrypt

Нужен домен (на IP сертификат не выдают).

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ваш-домен.ru
```

Certbot сам обновит конфиг nginx и настроит автообновление. После этого отредактировать `frontend/public/runtime-config.js`:

```javascript
window.__PHONEDECK_API_BASE__ = "https://ваш-домен.ru";
```

И пересобрать фронтенд.

---

### Чеклист переноса

- [ ] Код получен (`git clone` или архив)
- [ ] `devices.db` перенесён с боевого сервера (или смирились с потерей данных)
- [ ] `users.db` перенесён (или пересоздадут аккаунты вручную)
- [ ] Системные пакеты установлены (`python3`, `nodejs`, `nginx`)
- [ ] Python venv создан, `pip install` выполнен
- [ ] Фронтенд собран (`npm ci` → `CI=false npm run build` → `cp`)
- [ ] `runtime-config.js` проверен — пустая строка или новый адрес
- [ ] `FLASK_SECRET_KEY` сгенерирован и прописан в systemd `[Service]`
- [ ] systemd-сервис создан, включён, запущен
- [ ] `curl 127.0.0.1:5000/health` возвращает `{"status": "ok"}`
- [ ] nginx настроен, `nginx -t` без ошибок, перезапущен
- [ ] Файрвол: порты 22 и 80 открыты
- [ ] `curl НОВЫЙ-IP/` возвращает HTTP 200
- [ ] ESP8266 перепрошита с новым IP (если IP изменился)
- [ ] Пароль `admin` сменён после первого входа

---

## Настройка окружения разработчика

### Необходимое ПО

| Программа | macOS | Windows / Linux |
|-----------|-------|-----------------|
| Arduino IDE | `brew install --cask arduino-ide` | [arduino.cc/downloads](https://www.arduino.cc/en/software) |
| CP2102 драйвер | `brew install --cask silicon-labs-vcp-driver` | [silabs.com](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) |
| Node.js 20 | `brew install node` | [nodejs.org](https://nodejs.org) |
| Python 3 | Предустановлен | [python.org](https://python.org) |

### Локальный запуск

```bash
# Терминал 1 — бэкенд
cd phonedeck
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py
# http://127.0.0.1:5000

# Терминал 2 — фронтенд
cd phonedeck/frontend
npm install
npm start
# http://localhost:3000 (проксирует API на :5000 через package.json → "proxy")
```

### Платы в Arduino IDE

Добавить в **Settings → Additional boards manager URLs**:

```
https://arduino.esp8266.com/stable/package_esp8266com_index.json
https://dl.espressif.com/dl/package_esp32_index.json
```

Установить через Boards Manager: `esp8266`, `esp32`, `Arduino AVR Boards`.

| Устройство | Плата в IDE |
|-----------|-------------|
| Arduino Uno | Arduino Uno |
| ESP8266 NodeMCU Amica | NodeMCU 1.0 (ESP-12E Module) |
| ESP32S | DOIT ESP32 DEVKIT V1 |

### Библиотеки Arduino

Установка: **Sketch → Include Library → Add .ZIP Library**

| Библиотека | Версия | Назначение |
|------------|--------|------------|
| [ArduinoJson](https://github.com/bblanchon/ArduinoJson) | 7.0.4 | JSON для POST-запросов |
| [TimeLib](https://github.com/Floodeer/TimeLib) | master | Unix → ЧЧ:ММ |
| [iarduino_I2C_4LED](https://github.com/tremaru/iarduino_I2C_4LED) | 1.0.2 | I2C-дисплеи |
| [iarduino_RTC](https://github.com/iarduino/iarduino_RTC) | 2.0.0 | RTC DS3231 |

### Прошивка ESP8266

1. Открыть `arduino/NodeMCU_updated/NodeMCU_updated.ino`
2. Заполнить:

```cpp
#define WIFI_SSID     "название_сети"
#define WIFI_PASSWORD "пароль"
const char* host = "109.73.206.169";  // IP сервера — менять при смене хостинга
```

3. **Tools → Board → NodeMCU 1.0 (ESP-12E Module)**
4. **Tools → Port → `/dev/cu.usbserial-*`**
5. Upload →

```bash
# Через CLI
arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 arduino/NodeMCU_updated/
arduino-cli upload  --fqbn esp8266:esp8266:nodemcuv2 --port /dev/cu.usbserial-0001 arduino/NodeMCU_updated/
```

### Прошивка Arduino Uno

1. **Tools → Board → Arduino Uno**
2. **Tools → Port → `/dev/cu.usbmodem*`**
3. Upload → (IP сервера в скетче нет — менять не нужно)

### Кабели

| Устройство | Кабель |
|-----------|--------|
| Arduino Uno | USB Type B (фиолетовый, внутри станции) |
| ESP8266 / ESP32 | USB Micro |

**Serial Monitor для отладки:** 9600 бод.

---

## Аппаратная часть

### Компоненты

| Компонент | Кол-во | Роль |
|-----------|:------:|------|
| Arduino Uno | 1 | Главный контроллер |
| ESP8266 NodeMCU Amica | 1 | WiFi-модуль |
| Микропереключатель SM5-02N-38G | 6 | Датчик присутствия телефона |
| I2C дисплей Trema 4LED | 6 | Отображение времени ММ:СС |
| RTC DS3231 | 1 | Часы реального времени |
| Батарейка CR2032 | 1 | Питание RTC при отключении |

### Протокол Arduino ↔ ESP8266

**SoftwareSerial UART, 9600 бод:**
- Arduino: TX=3, RX=2
- ESP8266: RX=D7, TX=D8

Структура пакета:

```cpp
struct MyData {
  uint32_t start;  // Unix-время начала
  uint32_t stop;   // Unix-время конца
  byte slot;       // Номер слота (1–6)
  byte crc;        // CRC8
};
```

ESP8266 проверяет CRC. Подтверждение: `0` — успех, `1` — запрос повтора.

### Распиновка Arduino Uno

| Пин | Назначение |
|-----|-----------|
| 2 | RX ← ESP8266 |
| 3 | TX → ESP8266 |
| 5 | Концевик (слот 6) |
| 7 | Концевик (слот 5) |
| 8 | Концевик (слот 3) |
| 9 | Концевик (слот 4) |
| 11 | Концевик (слот 2) |
| 13 | Концевик (слот 1) |
| A4 (SDA) | I2C шина |
| A5 (SCL) | I2C шина |

> Нумерация слотов инвертирована из-за физического монтажа внутри корпуса.

### I2C-адреса дисплеев

| Дисплей | Адрес |
|:-------:|:-----:|
| 1 | `0x0E` |
| 2 | `0x0C` |
| 3 | `0x0D` |
| 4 | `0x0F` |
| 5 | `0x0A` |
| 6 | `0x0B` |

Для смены адреса — скетч `Display_SetAddress.ino` (подключать **по одному** устройству).
Для установки времени — `RTC_SetTime.ino` (загрузить один раз).

---

## Устранение неполадок

### ESP8266 не подключается к WiFi

- Проверить SSID и пароль в скетче
- ESP8266 работает **только на 2.4 GHz** — 5 GHz не поддерживается
- Serial Monitor 9600 бод → смотреть вывод. 50 точек = сеть недоступна
- Некоторые ESP8266 не любят пробелы или кириллицу в SSID

### Данные не приходят на сервер

- WiFi подключён? (`"WiFi connected"` в Serial Monitor)
- Сервер отвечает? `curl http://IP-СЕРВЕРА/health`
- IP в скетче актуален?
- Данные отправляются при **отпускании** концевика, не при нажатии
- TX/RX не перепутаны? TX Arduino → RX ESP8266, и наоборот

### Сайт не открывается

```bash
systemctl status phonedeck            # сервис запущен?
journalctl -u phonedeck -f            # что в логах?
curl http://127.0.0.1:5000/health     # Flask отвечает напрямую?
systemctl status nginx                # nginx работает?
nginx -t                              # конфиг без ошибок?
ss -tlnp | grep :80                   # порт 80 слушается?
```

### Flask стартует, но сразу падает

```bash
journalctl -u phonedeck -n 30 --no-pager
```

Частые причины:

- **`ModuleNotFoundError`** → venv не активирован или пакет не установлен
- **`Address already in use`** → порт 5000 занят: `ss -tlnp | grep 5000`
- **`No such file or directory: app.py`** → неверный `WorkingDirectory` в systemd

### 502 Bad Gateway (nginx работает, сайт нет)

nginx не может достучаться до gunicorn. Проверить:

```bash
ss -tlnp | grep 5000                          # gunicorn слушает?
grep proxy_pass /etc/nginx/sites-enabled/*    # правильный порт?
```

### Ошибка 500 на `/save` или `/get_data`

```bash
sqlite3 /opt/phonedeck/devices.db "SELECT COUNT(*) FROM devices;"
sqlite3 /opt/phonedeck/users.db   "SELECT COUNT(*) FROM users;"
```

Если `no such table` — перезапустить Flask: схема создаётся при старте.

### Авторизация не работает после переноса

Нормальная ситуация — токены подписаны старым `FLASK_SECRET_KEY`. После переноса пользователям нужно войти заново.

### Arduino IDE не видит плату

- Кабель поддерживает передачу данных (не только зарядку)?
- `ls /dev/cu.usb*` — устройство появилось?
- `/dev/cu.usbserial-*` → ESP8266, `/dev/cu.usbmodem-*` → Arduino Uno
- Перезапустить IDE после установки новых плат
- **"programmer is not responding"** — выбрана неправильная плата в Tools → Board

---

## Известные ограничения

1. **Страницы-заглушки.** Rating, Statistics, Station, Contacts используют `jsonplaceholder.typicode.com`. Для полноценной работы нужно реализовать соответствующие эндпоинты в `app.py` и подключить их во фронтенде.

2. **Пароль администратора** задан константой `DEFAULT_ADMIN_PASSWORD` в `app.py`. При каждом рестарте Flask сбрасывает его к дефолтному значению `adminkabphonedeck`. Для постоянной смены — менять константу в коде.

3. **Firebase** подключён, но не используется. Ключи лежат в открытом виде в `firebase.js` — стоит убрать их в переменные окружения или удалить Firebase, если не планируется использовать.

4. **`users.db` попала в репозиторий.** Исправить:

   ```bash
   echo "users.db" >> .gitignore
   git rm --cached users.db
   git commit -m "fix: remove users.db from tracking"
   git push
   ```

5. **SQLite** не рассчитан на конкурентную запись под нагрузкой. При масштабировании — переход на PostgreSQL.

6. **`requirements.txt`** без фиксации версий. После стабильного деплоя: `pip freeze > requirements.txt`.

---

<div align="center">

Сделано командой · ВУЗ · 2025–2026

</div>
