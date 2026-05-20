<div align="center">
📵 PhoneDeck
Аппаратно-программный комплекс для борьбы с информационной зависимостью
Станция фиксирует момент помещения и извлечения телефона, считает время на дисплее и отправляет данные на сервер.
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=black)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask)
![SQLite](https://img.shields.io/badge/SQLite-2×БД-003B57?style=flat-square&logo=sqlite)
![Arduino](https://img.shields.io/badge/Arduino-Uno%20+%20ESP8266-00979D?style=flat-square&logo=arduino)
🌐 Сайт: http://109.73.206.169
</div>
---
📋 Оглавление
Архитектура
Серверная часть
Фронтенд
API
Хостинг и деплой
🚀 Перенос на новый хостинг
Аппаратная часть
Разработка локально
Устранение неполадок
Известные ограничения
---
🏗 Архитектура
```
┌──────────────────── СТАНЦИЯ ────────────────────┐
│                                                  │
│  [Телефон] → [Концевик] → [Arduino Uno]          │
│                                ↓          ↓      │
│                         [Дисплей]   Serial UART  │
│                          ММ:СС        ↓          │
│                                  [ESP8266]        │
│                                   WiFi POST       │
└───────────────────────────────────┬──────────────┘
                                    ↓
                       ┌────────────────────────┐
                       │       VPS СЕРВЕР       │
                       │                        │
                       │  nginx :80             │
                       │    ↓                   │
                       │  gunicorn :5000        │
                       │    ↓                   │
                       │  Flask (app.py)        │
                       │    ↓           ↓       │
                       │  devices.db  users.db  │
                       │    ↓                   │
                       │  React build/          │
                       └────────────────────────┘
```
Стек технологий
Компонент	Технология	Роль
Arduino Uno	C++ / Arduino IDE	Чтение 6 концевиков, 6 дисплеев I2C, RTC DS3231
ESP8266 NodeMCU	C++ / Arduino IDE	WiFi: получает данные от Arduino по UART, шлёт HTTP POST
Flask	Python 3	API + авторизация + раздача React-билда
React 18	JavaScript (CRA)	Фронтенд: данные, навигация, бонусная система
SQLite ×2	SQL	`devices.db` — журнал; `users.db` — пользователи
nginx	—	Reverse proxy → gunicorn
gunicorn	Python	WSGI-сервер продакшена
Структура проекта
```
phonedeck/
├── app.py                 # Flask: API + раздача React
├── requirements.txt       # Python зависимости
├── Procfile               # gunicorn запуск
├── build.sh               # сборка для деплоя
├── devices.db             # журнал сеансов (в .gitignore)
├── users.db               # пользователи (в .gitignore!)
├── frontend/
│   ├── public/
│   │   └── runtime-config.js   # базовый URL API
│   └── src/
│       ├── api.js              # apiUrl() + auth token
│       ├── firebase.js         # Firebase (не используется)
│       ├── pages/              # страницы приложения
│       ├── components/         # переиспользуемые компоненты
│       └── context/            # AuthContext, BonusContext
└── arduino/
    ├── Arduino_230225/         # Arduino Uno — основной контроллер
    ├── NodeMCU_updated/        # ESP8266 — WiFi + POST на сервер
    ├── ESP32S_POST.ino         # ESP32 тестовый POST
    ├── ESP32S_Sensors.ino      # ESP32 лазерные датчики
    ├── RTC_SetTime.ino         # установка времени DS3231
    └── Display_SetAddress.ino  # установка I2C адреса дисплея
```
---
⚙️ Серверная часть
Flask (app.py)
Принимает POST от ESP8266 → `/save`
Отдаёт записи из БД → `/get_data`
Авторизация → `/api/login`, `/api/register`, `/api/me`
Панель администратора → `/api/admin/*`
Раздаёт React-билд и поддерживает React Router
Переменные окружения
Переменная	Обязательна	По умолчанию
`FLASK_SECRET_KEY`	Да	`dev-secret-change-in-production` ⚠️
Сгенерировать безопасный ключ:
```bash
openssl rand -hex 32
```
> ⚠️ Дефолтный ключ небезопасен — токены авторизации будут предсказуемы. Всегда задавайте переменную в продакшене.
Встроенный администратор
При каждом старте Flask создаёт/обновляет аккаунт:
Логин: `admin`
Пароль: `adminkabphonedeck`
Смените пароль сразу после первого входа.
> ⚠️ Пароль задан константой в коде (`DEFAULT_ADMIN_PASSWORD` в `app.py`). При рестарте сервера он сбрасывается к этому значению. Для постоянной смены нужно изменить константу в коде.
Базы данных
`devices.db` — журнал сеансов, таблица `devices`:
Поле	Тип	Описание
id	INTEGER PK	Автоинкремент
name	TEXT	ФИО
model	TEXT	Модель телефона
charge	TEXT	Заряд батареи
connection_time	TEXT	Время помещения (ЧЧ:ММ)
disconnection_time	TEXT	Время извлечения (ЧЧ:ММ)
`users.db` — пользователи, таблица `users`:
Поле	Тип	Описание
id	INTEGER PK	Автоинкремент
username	TEXT UNIQUE	Логин
password_hash	TEXT	Хэш пароля
last_name / first_name / patronymic	TEXT	ФИО
phone_model	TEXT	Модель телефона пользователя
is_admin	INTEGER	0 = обычный, 1 = админ
Схема таблиц создаётся автоматически при первом запуске — вручную создавать ничего не нужно.
Зависимости Python
```
Flask           веб-фреймворк
Flask-Cors      CORS для фронтенда
gunicorn        WSGI-сервер продакшена
itsdangerous    подпись токенов авторизации
werkzeug        хэширование паролей
```
> ⚠️ Текущий `requirements.txt` содержит только первые три. `itsdangerous` и `werkzeug` входят в состав Flask транзитивно, но лучше указать явно. После успешного деплоя зафиксируйте версии: `pip freeze > requirements.txt`
---
🖥 Фронтенд
Страницы
Маршрут	Страница	Источник данных
`/viewPage`	Обзор станции	`/get_data` ✅
`/rating/school`	Рейтинг по школе	⚠️ Заглушка
`/rating/classes`	Рейтинг по классам	⚠️ Заглушка
`/statistics`	Статистика	⚠️ Заглушка
`/bonuses`	Бонусы	Локальный Context
`/station`	Статус станций	⚠️ Заглушка
`/contacts`	Контакты	⚠️ Заглушка
`/login`	Вход	`/api/login` ✅
`/register`	Регистрация	`/api/register` ✅
`/profile`	Профиль	`/api/me` ✅
`/admin`	Администрирование	`/api/admin/*` ✅
> Страницы с пометкой ⚠️ используют `https://jsonplaceholder.typicode.com/users` — внешнюю заглушку, не связанную с бэкендом.
runtime-config.js
Файл `frontend/public/runtime-config.js` (копируется в `build/` при сборке) задаёт базовый URL API:
```javascript
// Стандарт — тот же хост, с которого открыт сайт:
window.__PHONEDECK_API_BASE__ = "";

// Если фронт и бэк на разных серверах:
window.__PHONEDECK_API_BASE__ = "http://ВАШ-IP-ИЛИ-ДОМЕН";
```
---
📡 API
`POST /save`
Приём данных от ESP8266.
```json
// Тело запроса:
{
  "name": "Петров А.Д.",
  "model": "TCL",
  "charge": "71%",
  "connection_time": "09:15",
  "disconnection_time": "10:30"
}
// Ответ 201: {"message": "Data saved successfully"}
// Ошибка 400: отсутствуют поля
// Ошибка 500: ошибка БД
```
`GET /get_data`
Все записи из `devices.db`.
`GET /health`
Пинг сервера. Возвращает `{"status": "ok"}`.
`POST /api/register` / `POST /api/login`
Регистрация и вход. Логин возвращает Bearer-токен (действует 14 дней).
`GET /PATCH /api/me`
Профиль текущего пользователя.
`GET /api/admin/users`
Список всех пользователей (только для админа).
`PATCH /api/admin/users/:id/role`
Назначить / снять права администратора.
`GET /api/admin/health/databases`
Проверка состояния обеих баз данных.
Пример curl:
```bash
curl -X POST http://109.73.206.169/save \
  -H "Content-Type: application/json" \
  -d '{"name":"Иванов С.М.","model":"Samsung","charge":"85%","connection_time":"14:30","disconnection_time":"15:45"}'
```
---
🖥 Хостинг и деплой
Параметры текущего сервера
	
Провайдер	Timeweb Cloud
ОС	Ubuntu 24.04
IP	109.73.206.169
CPU / RAM	1 vCPU / 1 GB
Диск	15 GB NVMe
Схема работы
```
nginx :80  →  gunicorn :5000  →  Flask app.py
```
Конфигурационные файлы на сервере
<details>
<summary><b>systemd: /etc/systemd/system/phonedeck.service</b></summary>
```ini
[Unit]
Description=PhoneDeck Flask App
After=network.target

[Service]
User=root
WorkingDirectory=/opt/phonedeck
Environment="FLASK_SECRET_KEY=ВАШ-СЕКРЕТНЫЙ-КЛЮЧ"
ExecStart=/opt/phonedeck/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
</details>
<details>
<summary><b>nginx: /etc/nginx/sites-available/phonedeck</b></summary>
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
</details>
Файрвол (UFW): 22/tcp · 80/tcp · 443/tcp
Деплой обновлений
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
Просмотр логов
```bash
sudo journalctl -u phonedeck -f
```
---
🚀 Перенос на новый хостинг
Требования к серверу
	Минимум	Рекомендуется
ОС	Ubuntu 20.04+	Ubuntu 24.04 LTS
RAM	512 MB	1 GB
Диск	5 GB	15 GB NVMe
Python	3.8+	3.11+
Node.js	16+	20 LTS
Порты	22, 80	22, 80, 443
---
Шаг 1 — Получить код
Через Git:
```bash
git clone https://github.com/Nairs228/phonedeck /opt/phonedeck
```
Через архив:
```bash
scp phonedeck.zip root@НОВЫЙ-IP:/opt/
ssh root@НОВЫЙ-IP
cd /opt && unzip phonedeck.zip && mv phonedeck /opt/phonedeck
```
---
Шаг 2 — Перенести базы данных
```bash
# Резервная копия (на старом сервере)
sqlite3 /opt/phonedeck/devices.db ".backup '/tmp/devices_backup.db'"
sqlite3 /opt/phonedeck/users.db   ".backup '/tmp/users_backup.db'"

# Копирование на новый сервер
scp root@109.73.206.169:/opt/phonedeck/devices.db root@НОВЫЙ-IP:/opt/phonedeck/devices.db
scp root@109.73.206.169:/opt/phonedeck/users.db   root@НОВЫЙ-IP:/opt/phonedeck/users.db
```
> Если старый сервер недоступен — БД пустые, создадутся автоматически при первом запуске. Данные будут утрачены.
> `build/` **не переносить** — он собирается заново на новом сервере (шаг 5).
---
Шаг 3 — Установить пакеты
```bash
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv nginx nodejs npm git curl unzip sqlite3

# Проверить версии
python3 --version   # >= 3.8
node --version      # >= 16
```
---
Шаг 4 — Python окружение
```bash
cd /opt/phonedeck
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Если возникнут ImportError — установить явно:
pip install Flask Flask-Cors gunicorn itsdangerous werkzeug
```
---
Шаг 5 — Собрать фронтенд
```bash
cd /opt/phonedeck/frontend
npm ci
CI=false npm run build
cd ..
cp -r frontend/build ./build
```
> Флаг `CI=false` обязателен — без него React трактует предупреждения как ошибки и сборка падает.
---
Шаг 6 — Проверить runtime-config.js
```bash
cat /opt/phonedeck/build/runtime-config.js
```
Для стандартного деплоя (один сервер) должно быть `""`:
```javascript
window.__PHONEDECK_API_BASE__ = "";
```
---
Шаг 7 — Создать systemd-сервис
```bash
# Сгенерировать ключ
openssl rand -hex 32
# Скопировать вывод

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

# Проверка
curl http://127.0.0.1:5000/health
# {"status": "ok"}
```
---
Шаг 8 — Настроить nginx
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
rm -f /etc/nginx/sites-enabled/default   # убрать дефолтный сайт

nginx -t                  # проверить конфиг
systemctl enable nginx
systemctl restart nginx
```
---
Шаг 9 — Файрвол
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```
---
Шаг 10 — Перепрошить ESP8266 (если IP изменился)
Если адрес нового сервера отличается от `109.73.206.169`:
Открыть `arduino/NodeMCU_updated/NodeMCU_updated.ino`
Найти строку с `host` или `server`
Заменить IP на новый
Залить прошивку (см. раздел Прошивка ESP8266)
> Лучше указать доменное имя вместо IP — домен остаётся неизменным при смене сервера.
---
Шаг 11 — Финальная проверка
```bash
systemctl status phonedeck                        # сервис запущен
curl http://НОВЫЙ-IP/health                       # {"status": "ok"}
curl http://НОВЫЙ-IP/get_data                     # [] или список устройств
curl -I http://НОВЫЙ-IP/                          # HTTP 200
journalctl -u phonedeck -n 50 --no-pager          # нет ошибок
```
---
Необязательно: HTTPS через Let's Encrypt
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ВАШ-ДОМЕН.ru
# Certbot сам обновит nginx и настроит автопродление
```
---
Чеклист переноса
[ ] Код на новом сервере (`/opt/phonedeck`)
[ ] `devices.db` перенесён / пустой (данные утрачены)
[ ] `users.db` перенесён / пустой (пользователи утрачены)
[ ] Python venv создан, зависимости установлены
[ ] Фронтенд собран (`npm ci && CI=false npm run build`)
[ ] `build/runtime-config.js` — значение `""`
[ ] `FLASK_SECRET_KEY` задан в systemd-сервисе
[ ] systemd-сервис создан, запущен, включён в автозапуск
[ ] nginx настроен, `nginx -t` без ошибок, перезапущен
[ ] Файрвол: порты 22 и 80 открыты
[ ] `/health` возвращает `{"status": "ok"}`
[ ] Сайт открывается в браузере
[ ] ESP8266 перепрошит с новым IP (если изменился)
[ ] Пароль `admin` сменён
---
🔧 Мелочи при установке и переносе
<details>
<summary><b>npm ci падает с ошибкой ENOENT или missing package-lock.json</b></summary>
Если `package-lock.json` не попал в репозиторий или повреждён:
```bash
# Вместо npm ci используйте:
npm install
# После успешной установки зафиксируйте lock-файл:
git add package-lock.json && git commit -m "fix: add package-lock.json"
```
</details>
<details>
<summary><b>npm run build падает с "Treating warnings as errors"</b></summary>
React CRA в CI-режиме трактует предупреждения как ошибки. Решение:
```bash
CI=false npm run build
```
Всегда используйте этот флаг на сервере.
</details>
<details>
<summary><b>Node.js слишком старый (< 16)</b></summary>
Ubuntu 20.04 по умолчанию ставит Node.js 10–12. Обновить:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version   # должно быть >= 16
```
</details>
<details>
<summary><b>gunicorn не стартует: "ModuleNotFoundError: No module named 'itsdangerous'"</b></summary>
`itsdangerous` не указан в `requirements.txt`, но используется в `app.py`. Установить:
```bash
source /opt/phonedeck/venv/bin/activate
pip install itsdangerous werkzeug
```
Затем добавить в `requirements.txt` и закоммитить.
</details>
<details>
<summary><b>Flask запустился, но сайт не открывается (502 Bad Gateway)</b></summary>
nginx работает, но не может достучаться до gunicorn. Проверить:
```bash
# 1. Gunicorn слушает правильный адрес?
ss -tlnp | grep 5000
# Должно быть: 127.0.0.1:5000

# 2. Сервис запущен?
systemctl status phonedeck

# 3. В nginx правильный proxy_pass?
grep proxy_pass /etc/nginx/sites-enabled/phonedeck
# Должно быть: proxy_pass http://127.0.0.1:5000;
```
</details>
<details>
<summary><b>После git pull сайт не обновился</b></summary>
Фронтенд нужно пересобрать и перезапустить сервис:
```bash
cd /opt/phonedeck/frontend
npm ci && CI=false npm run build
cd .. && cp -r frontend/build ./build
systemctl restart phonedeck
```
Просто `git pull` без пересборки обновит только `app.py` и Python-код.
</details>
<details>
<summary><b>systemd не подхватывает FLASK_SECRET_KEY</b></summary>
Если переменная задана через `export` в терминале, а не в юнит-файле, сервис её не видит. Правильно — прописать в `[Service]`:
```ini
Environment="FLASK_SECRET_KEY=ваш-ключ"
```
После изменения юнит-файла:
```bash
systemctl daemon-reload
systemctl restart phonedeck
```
</details>
<details>
<summary><b>ufw enable заблокировал SSH — потеря доступа к серверу</b></summary>
Если порт 22 не был разрешён до включения файрвола — соединение оборвётся. Правильный порядок:
```bash
ufw allow 22/tcp   # сначала разрешить SSH
ufw enable         # потом включать
```
Если доступ уже потерян — нужна консоль через панель хостинга (VNC/KVM).
</details>
<details>
<summary><b>ESP8266 отправляет данные на старый IP после смены сервера</b></summary>
IP прошит в скетче. Одного изменения `runtime-config.js` недостаточно — нужно перепрошить ESP8266 с новым адресом. Если доступа к устройству нет физически, данные временно не будут поступать.
</details>
<details>
<summary><b>После переноса авторизация не работает — все пользователи выкинуты</b></summary>
Токены подписаны `FLASK_SECRET_KEY`. Если на новом сервере ключ другой (а он должен быть другим) — все старые токены недействительны. Это нормально и безопасно. Пользователям нужно просто войти заново.
</details>
<details>
<summary><b>pip install падает с ошибкой SSL или "Could not fetch URL"</b></summary>
Проблема с сетью или DNS на сервере:
```bash
# Проверить интернет
ping -c 3 8.8.8.8

# Если DNS не работает — указать явно
echo "nameserver 8.8.8.8" >> /etc/resolv.conf

# Повторить установку
pip install -r requirements.txt
```
</details>
---
🔩 Аппаратная часть
Компоненты
Компонент	Кол-во	Назначение
Arduino Uno	1	Главный контроллер
ESP8266 NodeMCU Amica	1	WiFi-модуль
Микропереключатель SM5-02N-38G	6	Датчик присутствия телефона
I2C дисплей Trema 4LED	6	Отображение времени ММ:СС
RTC DS3231	1	Часы реального времени
Батарейка CR2032	1	Питание RTC
Связь Arduino ↔ ESP8266
SoftwareSerial UART, 9600 бод:
Arduino: TX=3, RX=2
ESP8266: RX=D7, TX=D8
Структура пакета данных:
```cpp
struct MyData {
  uint32_t start;  // Unix-время начала
  uint32_t stop;   // Unix-время конца
  byte slot;       // Номер слота (1–6)
  byte crc;        // CRC8
};
```
ESP8266 проверяет CRC → подтверждение (0) или запрос повтора (1).
Распиновка Arduino Uno
Пин	Назначение
2	RX ← ESP8266
3	TX → ESP8266
5	Концевик слот 6
7	Концевик слот 5
8	Концевик слот 3
9	Концевик слот 4
11	Концевик слот 2
13	Концевик слот 1
A4 (SDA)	I2C шина
A5 (SCL)	I2C шина
> Нумерация слотов инвертирована из-за физики монтажа внутри станции.
Адреса I2C дисплеев
Дисплей	Адрес
1	`0x0E`
2	`0x0C`
3	`0x0D`
4	`0x0F`
5	`0x0A`
6	`0x0B`
Для изменения адреса: скетч `Display_SetAddress.ino`, подключать дисплеи по одному.
---
💻 Разработка локально
Необходимое ПО
	macOS	Ubuntu
Arduino IDE	`brew install --cask arduino-ide`	arduino.cc/downloads
CP2102 драйвер	`brew install --cask silicon-labs-vcp-driver`	обычно не нужен
Node.js	`brew install node`	`apt install nodejs npm`
Python 3	предустановлен	`apt install python3 python3-venv`
Запуск
```bash
# Терминал 1 — бэкенд
cd phonedeck
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py
# → http://127.0.0.1:5000

# Терминал 2 — фронтенд
cd phonedeck/frontend
npm install
npm start
# → http://localhost:3000 (проксирует API на :5000)
```
Платы Arduino IDE
Добавить в Settings → Additional boards manager URLs:
```
https://arduino.esp8266.com/stable/package_esp8266com_index.json
https://dl.espressif.com/dl/package_esp32_index.json
```
Устройство	Плата в IDE
Arduino Uno	Arduino Uno
ESP8266 NodeMCU	NodeMCU 1.0 (ESP-12E Module)
ESP32S	DOIT ESP32 DEVKIT V1
Библиотеки Arduino
Библиотека	Версия	Назначение
ArduinoJson	7.0.4	JSON для POST
TimeLib	master	Unix → ЧЧ:ММ
iarduino_I2C_4LED	1.0.2	I2C дисплеи
iarduino_RTC	2.0.0	DS3231 RTC
Прошивка ESP8266
Перед загрузкой указать WiFi и адрес сервера в `arduino/NodeMCU_updated/NodeMCU_updated.ino`:
```cpp
#define WIFI_SSID     "название_сети"
#define WIFI_PASSWORD "пароль"
const char* host = "109.73.206.169";  // ← менять при смене сервера
```
```
Tools → Board  → NodeMCU 1.0 (ESP-12E Module)
Tools → Port   → /dev/cu.usbserial-*
Upload (→)
```
Прошивка Arduino Uno
Скетч `Arduino_230225.ino` — IP сервера не содержит, менять не нужно.
```
Tools → Board → Arduino Uno
Tools → Port  → /dev/cu.usbmodem*
```
Кабели
Устройство	Кабель
Arduino Uno	USB Type B (фиолетовый)
ESP8266 / ESP32	USB Micro
Serial Monitor для отладки: 9600 бод
---
🛠 Устранение неполадок
ESP8266 не подключается к WiFi
Проверить SSID/пароль в скетче
ESP8266 поддерживает только 2.4 GHz
Serial Monitor 9600 бод → смотреть "Connecting..."
Данные не приходят на сервер
`curl http://IP/health` → ожидается `{"status":"ok"}`
Проверить актуальность IP в скетче ESP8266
Данные отправляются при отпускании концевика, не при нажатии
Проверить провода TX/RX между Arduino и ESP8266
Сайт не открывается
```bash
systemctl status phonedeck
journalctl -u phonedeck -f
curl http://127.0.0.1:5000/health   # Flask напрямую
systemctl status nginx
```
Arduino IDE не видит порт
Кабель должен поддерживать передачу данных (не только зарядку)
`ls /dev/cu.usb*` — проверить драйвер CP2102
`/dev/cu.usbserial-*` → ESP8266
`/dev/cu.usbmodem-*` → Arduino Uno
"programmer is not responding" — выбрана неправильная плата в Tools → Board
---
⚠️ Известные ограничения
Страницы Rating, Statistics, Station, Contacts подключены к заглушке `jsonplaceholder.typicode.com`, а не к реальному бэкенду — требуют доработки.
Пароль администратора задан константой в `app.py` и сбрасывается при каждом рестарте Flask.
Firebase подключён, но не используется. Ключи в `firebase.js` хранятся в открытом виде в репозитории.
SQLite не рассчитан на конкурентную запись. При росте нагрузки потребуется переход на PostgreSQL.
`requirements.txt` без фиксации версий. После стабильного деплоя выполните `pip freeze > requirements.txt`.
---
<div align="center">
Сделано командой для вузовского проекта 🎓
</div>
