PhoneDeck — Станция для борьбы с информационной зависимостью
Проект представляет собой аппаратно-программный комплекс для хранения телефонов с учётом времени использования. Станция фиксирует момент помещения и извлечения телефона, отображает время на дисплее и отправляет данные на веб-сервер.
<<<<<<< HEAD

## Сайт

**http://109.73.206.169**

## Оглавление

* [Структура проекта](#структура-проекта)
* [Архитектура системы](#архитектура-системы)
* [Серверная часть](#серверная-часть)
* [Фронтенд](#фронтенд)
* [Аппаратная часть](#аппаратная-часть)
* [API](#api)
* [Хостинг и деплой](#хостинг-и-деплой)
* [**Перенос на новый хостинг**](#перенос-на-новый-хостинг)
* [Настройка рабочего окружения](#настройка-рабочего-окружения)
* [Устранение неполадок](#устранение-неполадок)
* [Известные ограничения](#известные-ограничения)

\---

## Структура проекта

=======
Сайт
http://109.73.206.169
Оглавление
Структура проекта
Архитектура системы
Серверная часть
Фронтенд
Аппаратная часть
API
Хостинг и деплой
Перенос на новый хостинг
Настройка рабочего окружения
Устранение неполадок
Известные ограничения
---
Структура проекта
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
```
phonedeck/
├── app.py                     # Flask бэкенд (API + раздача React)
├── requirements.txt           # Python зависимости
├── Procfile                   # Конфиг запуска gunicorn
├── build.sh                   # Скрипт сборки для деплоя
├── devices.db                 # SQLite: журнал сеансов хранения телефонов
├── users.db                   # SQLite: пользователи и авторизация
├── frontend/                  # React приложение
│   ├── src/
│   │   ├── api.js             # Хелпер apiUrl() + работа с токеном авторизации
│   │   ├── firebase.js        # Firebase конфиг (подключён, но не используется)
│   │   ├── pages/             # Страницы
│   │   │   ├── ViewPage/      # Главная (обзор станции)
│   │   │   ├── Rating/        # Рейтинг (по школе и по классам)
│   │   │   ├── Statistics/    # Статистика пользователей
│   │   │   ├── Bonuses/       # Бонусная система
│   │   │   ├── Station/       # Информация о станциях
│   │   │   ├── Contacts/      # Контакты
│   │   │   ├── Auth/          # Логин и регистрация
│   │   │   ├── Admin/         # Панель администратора
│   │   │   └── NotFound/      # 404
│   │   ├── components/        # Переиспользуемые компоненты
│   │   │   ├── UserTable/     # Таблица устройств (данные с /get\\\_data)
│   │   │   ├── Pagination/    # Пагинация
│   │   │   ├── MorrisChart/   # График (данные с /get\\\_data)
│   │   │   ├── Modals/        # Модальные окна
│   │   │   └── SemanticElements/  # Header, Aside, Footer
│   │   ├── context/           # React Context (авторизация, бонусы)
│   │   ├── routes/            # React Router
│   │   └── assets/            # SVG, MP3
│   └── package.json
└── arduino/                   # Скетчи для микроконтроллеров
    ├── Arduino\\\_230225/        # Arduino Uno (основной контроллер)
    ├── NodeMCU\\\_updated/       # ESP8266 (WiFi + отправка на сервер)
    ├── ESP32S\\\_POST.ino        # ESP32 (тестовый POST)
    ├── ESP32S\\\_Sensors.ino     # ESP32 (лазерные датчики)
    ├── RTC\\\_SetTime.ino        # Установка времени RTC
    └── Display\\\_SetAddress.ino # Установка адреса I2C дисплея
```
<<<<<<< HEAD

\---

## Архитектура системы

### Общая схема

=======
---
Архитектура системы
Общая схема
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
```
┌─────────────────────────────────────────────────────────────────┐
│                          СТАНЦИЯ                                │
│                                                                 │
│  \\\[Телефон] → \\\[Концевик] → \\\[Arduino Uno] ──Serial──→ \\\[ESP8266]  │
│                                ↓                        ↓       │
│                         \\\[Дисплей ММ:СС]          WiFi POST      │
│                                                     ↓           │
└─────────────────────────────────────────────────────────────────┘
                                                      ↓
                                          ┌───────────────────┐
                                          │    VPS СЕРВЕР     │
                                          │  nginx → gunicorn │
                                          │       ↓           │
                                          │  Flask (app.py)   │
                                          │       ↓           │
                                          │  SQLite ×2        │
                                          │  (devices+users)  │
                                          │       ↓           │
                                          │  React (frontend)  │
                                          └───────────────────┘
                                                      ↓
                                              http://<IP-СЕРВЕРА>
```
<<<<<<< HEAD

### Компоненты

|Компонент|Технология|Роль|
|-|-|-|
|Arduino Uno|C++ / Arduino IDE|Главный контроллер: чтение 6 концевиков, управление 6 дисплеями I2C, работа с RTC DS3231|
|ESP8266 (NodeMCU Amica)|C++ / Arduino IDE|WiFi-модуль: получает данные от Arduino по Serial (UART 9600 бод), отправляет HTTP POST на сервер|
|Flask|Python 3|Бэкенд: API для приёма и отдачи данных, авторизация, раздача React-билда|
|React|JavaScript (CRA)|Фронтенд: отображение данных, навигация, бонусная система|
|SQLite|SQL|Две БД: `devices.db` (журнал устройств), `users.db` (пользователи)|
|nginx|-|Reverse proxy: проксирует HTTP запросы на gunicorn|
|gunicorn|Python|WSGI-сервер: запускает Flask в продакшене|

### Обмен данными Arduino ↔ ESP8266

Связь по **SoftwareSerial (UART)** на скорости **9600 бод**:

* Arduino Uno: TX=3, RX=2
* ESP8266: RX=D7, TX=D8

=======
Компоненты
Компонент	Технология	Роль
Arduino Uno	C++ / Arduino IDE	Главный контроллер: чтение 6 концевиков, управление 6 дисплеями I2C, работа с RTC DS3231
ESP8266 (NodeMCU Amica)	C++ / Arduino IDE	WiFi-модуль: получает данные от Arduino по Serial (UART 9600 бод), отправляет HTTP POST на сервер
Flask	Python 3	Бэкенд: API для приёма и отдачи данных, авторизация, раздача React-билда
React	JavaScript (CRA)	Фронтенд: отображение данных, навигация, бонусная система
SQLite	SQL	Две БД: `devices.db` (журнал устройств), `users.db` (пользователи)
nginx	-	Reverse proxy: проксирует HTTP запросы на gunicorn
gunicorn	Python	WSGI-сервер: запускает Flask в продакшене
Обмен данными Arduino ↔ ESP8266
Связь по SoftwareSerial (UART) на скорости 9600 бод:
Arduino Uno: TX=3, RX=2
ESP8266: RX=D7, TX=D8
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
Данные передаются как структура с побайтовым выравниванием:
```cpp
struct MyData {
  uint32\\\_t start;  // Время начала (Unix)
  uint32\\\_t stop;   // Время конца (Unix)
  byte slot;       // Номер слота (1-6)
  byte crc;        // Контрольная сумма CRC8
};
```
ESP8266 проверяет CRC и при успехе отправляет подтверждение (0) на Arduino. При ошибке — запрос повторной отправки (1).
<<<<<<< HEAD

\---

## Серверная часть

### Бэкенд (app.py)

Flask-приложение, которое:

1. Принимает POST-запросы с данными от ESP8266 (`/save`)
2. Отдаёт все записи из БД (`/get\\\_data`)
3. Управляет регистрацией и авторизацией пользователей (`/api/register`, `/api/login`, `/api/me`)
4. Предоставляет панель администратора (`/api/admin/\\\*`)
5. Раздаёт скомпилированный React-фронтенд (из папки `build/`)
6. Поддерживает React Router (catch-all маршрут)

### Переменные окружения

|Переменная|Обязательна|Описание|
|-|-|-|
|`FLASK\\\_SECRET\\\_KEY`|**Да (в продакшене)**|Секрет для подписи токенов авторизации. По умолчанию `dev-secret-change-in-production` — **небезопасно для боевого сервера**|

=======
---
Серверная часть
Бэкенд (app.py)
Flask-приложение, которое:
Принимает POST-запросы с данными от ESP8266 (`/save`)
Отдаёт все записи из БД (`/get_data`)
Управляет регистрацией и авторизацией пользователей (`/api/register`, `/api/login`, `/api/me`)
Предоставляет панель администратора (`/api/admin/*`)
Раздаёт скомпилированный React-фронтенд (из папки `build/`)
Поддерживает React Router (catch-all маршрут)
Переменные окружения
Переменная	Обязательна	Описание
`FLASK_SECRET_KEY`	Да (в продакшене)	Секрет для подписи токенов авторизации. По умолчанию `dev-secret-change-in-production` — небезопасно для боевого сервера
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
Установить перед запуском:

```bash
export FLASK\\\_SECRET\\\_KEY="$(openssl rand -hex 32)"
```
Или прописать в systemd-сервис (см. раздел Перенос на новый хостинг).
Встроенная учётная запись администратора
При каждом старте Flask автоматически создаёт/обновляет пользователя `admin` с паролем `adminkabphonedeck`. Обязательно смените пароль через страницу профиля сразу после первого входа на новом сервере.
Базы данных
Два SQLite-файла в корне проекта:
<<<<<<< HEAD

**`devices.db`** — журнал сеансов хранения телефонов, таблица `devices`:

|Поле|Тип|Описание|
|-|-|-|
|id|INTEGER PRIMARY KEY|Автоинкремент|
|name|TEXT NOT NULL|ФИО пользователя|
|model|TEXT NOT NULL|Модель телефона|
|charge|TEXT NOT NULL|Заряд батареи|
|connection\_time|TEXT NOT NULL|Время подключения (ЧЧ:ММ)|
|disconnection\_time|TEXT NOT NULL|Время отключения (ЧЧ:ММ)|

**`users.db`** — учётные записи, таблица `users`:

|Поле|Тип|Описание|
|-|-|-|
|id|INTEGER PRIMARY KEY|Автоинкремент|
|username|TEXT UNIQUE|Логин|
|password\_hash|TEXT|Хэш пароля (werkzeug)|
|last\_name|TEXT|Фамилия|
|first\_name|TEXT|Имя|
|patronymic|TEXT|Отчество|
|phone\_model|TEXT|Модель телефона пользователя|
|is\_admin|INTEGER|0 = обычный, 1 = администратор|

### Зависимости Python

=======
`devices.db` — журнал сеансов хранения телефонов, таблица `devices`:
Поле	Тип	Описание
id	INTEGER PRIMARY KEY	Автоинкремент
name	TEXT NOT NULL	ФИО пользователя
model	TEXT NOT NULL	Модель телефона
charge	TEXT NOT NULL	Заряд батареи
connection_time	TEXT NOT NULL	Время подключения (ЧЧ:ММ)
disconnection_time	TEXT NOT NULL	Время отключения (ЧЧ:ММ)
`users.db` — учётные записи, таблица `users`:
Поле	Тип	Описание
id	INTEGER PRIMARY KEY	Автоинкремент
username	TEXT UNIQUE	Логин
password_hash	TEXT	Хэш пароля (werkzeug)
last_name	TEXT	Фамилия
first_name	TEXT	Имя
patronymic	TEXT	Отчество
phone_model	TEXT	Модель телефона пользователя
is_admin	INTEGER	0 = обычный, 1 = администратор
Зависимости Python
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
```
Flask           — веб-фреймворк
Flask-Cors      — CORS для кросс-доменных запросов
gunicorn        — WSGI-сервер для продакшена
itsdangerous    — подпись и верификация токенов авторизации
werkzeug        — хэширование паролей (входит в состав Flask, но указан явно)
```
<<<<<<< HEAD

> ⚠️ \\\*\\\*Важно:\\\*\\\* текущий `requirements.txt` содержит только `Flask`, `Flask-Cors`, `gunicorn`. Перед деплоем на новый сервер добавьте недостающие зависимости (они уже входят в дистрибутив Flask, но лучше зафиксировать версии явно):
=======
> ⚠️ **Важно:** текущий `requirements.txt` содержит только `Flask`, `Flask-Cors`, `gunicorn`. Перед деплоем на новый сервер добавьте недостающие зависимости (они уже входят в дистрибутив Flask, но лучше зафиксировать версии явно):
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
> ```
> Flask
> Flask-Cors
> gunicorn
> itsdangerous
> werkzeug
> ```
<<<<<<< HEAD

\---

## Фронтенд

### Технологии

* **React 18.2** (Create React App)
* **React Router 6** — маршрутизация
* **Axios** — HTTP-запросы
* **Chart.js + react-chartjs-2** — графики
* **Firebase** — конфигурация (подключена, но не активно используется)
* **Redux** — установлен, но не используется

### Страницы

|Маршрут|Страница|Описание|Источник данных|
|-|-|-|-|
|`/viewPage`|Обзор|Главная: количество телефонов, график, таблица|`/get\\\_data` (реальный сервер)|
|`/rating/school`|Рейтинг по школе|Таблица учеников с бонусами|⚠️ Заглушка (jsonplaceholder)|
|`/rating/classes`|Рейтинг по классам|Выбор класса → таблица учеников|⚠️ Заглушка (jsonplaceholder)|
|`/statistics`|Статистика|Накопленные/потраченные бонусы, часы|⚠️ Заглушка (jsonplaceholder)|
|`/bonuses`|Бонусы|Траты бонусов, история операций|Локальный Context|
|`/station`|Станции|Статус всех станций|⚠️ Заглушка (jsonplaceholder)|
|`/contacts`|Контакты|Контактная информация|⚠️ Заглушка (jsonplaceholder)|
|`/login`|Авторизация|Вход в аккаунт|`/api/login`|
|`/register`|Регистрация|Создание аккаунта|`/api/register`|
|`/profile`|Профиль|Данные пользователя|`/api/me`|
|`/admin`|Администрирование|Управление пользователями|`/api/admin/\\\*`|

> ⚠️ \\\*\\\*Страницы Rating, Statistics, Station, Contacts\\\*\\\* пока используют внешнюю заглушку `https://jsonplaceholder.typicode.com/users` вместо реальных данных. Это не зависит от хостинга — данные не связаны с бэкендом.

### Конфигурация API (runtime-config.js)

=======
---
Фронтенд
Технологии
React 18.2 (Create React App)
React Router 6 — маршрутизация
Axios — HTTP-запросы
Chart.js + react-chartjs-2 — графики
Firebase — конфигурация (подключена, но не активно используется)
Redux — установлен, но не используется
Страницы
Маршрут	Страница	Описание	Источник данных
`/viewPage`	Обзор	Главная: количество телефонов, график, таблица	`/get_data` (реальный сервер)
`/rating/school`	Рейтинг по школе	Таблица учеников с бонусами	⚠️ Заглушка (jsonplaceholder)
`/rating/classes`	Рейтинг по классам	Выбор класса → таблица учеников	⚠️ Заглушка (jsonplaceholder)
`/statistics`	Статистика	Накопленные/потраченные бонусы, часы	⚠️ Заглушка (jsonplaceholder)
`/bonuses`	Бонусы	Траты бонусов, история операций	Локальный Context
`/station`	Станции	Статус всех станций	⚠️ Заглушка (jsonplaceholder)
`/contacts`	Контакты	Контактная информация	⚠️ Заглушка (jsonplaceholder)
`/login`	Авторизация	Вход в аккаунт	`/api/login`
`/register`	Регистрация	Создание аккаунта	`/api/register`
`/profile`	Профиль	Данные пользователя	`/api/me`
`/admin`	Администрирование	Управление пользователями	`/api/admin/*`
> ⚠️ **Страницы Rating, Statistics, Station, Contacts** пока используют внешнюю заглушку `https://jsonplaceholder.typicode.com/users` вместо реальных данных. Это не зависит от хостинга — данные не связаны с бэкендом.
Конфигурация API (runtime-config.js)
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
Файл `build/runtime-config.js` (загружается перед React) определяет базовый URL API:
```javascript
// Пустая строка = тот же хост, с которого открыт сайт (рекомендуется)
window.\\\_\\\_PHONEDECK\\\_API\\\_BASE\\\_\\\_ = "";

// Если фронтенд на другом домене/IP:
window.\\\_\\\_PHONEDECK\\\_API\\\_BASE\\\_\\\_ = "http://новый-ip-или-домен";
```
При стандартном деплое (nginx → gunicorn → Flask раздаёт React) значение должно быть `""`. Менять только если фронтенд и бэкенд на разных серверах.
Компонент UserTable
Ключевой компонент — получает реальные данные с бэкенда:
```javascript
const response = await axios.get(apiUrl("/get\\\_data"))
```
Отображает таблицу устройств с пагинацией (5 записей на страницу).
<<<<<<< HEAD

\---

## API

### POST /save

Сохранение данных об устройстве. Используется ESP8266.

**Запрос:**

=======
---
API
POST /save
Сохранение данных об устройстве. Используется ESP8266.
Запрос:
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
```json
{
  "name": "Петров А.Д.",
  "model": "TCL",
  "charge": "71%",
  "connection\\\_time": "09:15",
  "disconnection\\\_time": "10:30"
}
```
<<<<<<< HEAD

**Ответ (201):**

=======
Ответ (201):
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
```json
{
  "message": "Data saved successfully"
}
```
<<<<<<< HEAD

**Ошибки:**

* `400` — отсутствуют обязательные поля
* `500` — ошибка базы данных

### GET /get\_data

Получение всех записей из devices.db.

**Ответ (200):**

=======
Ошибки:
`400` — отсутствуют обязательные поля
`500` — ошибка базы данных
GET /get_data
Получение всех записей из devices.db.
Ответ (200):
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
```json
\\\[
  {
    "id": 1,
    "name": "Петров А.Д.",
    "model": "TCL",
    "charge": "71%",
    "connection\\\_time": "09:15",
    "disconnection\\\_time": "10:30"
  }
]
```
GET /health
Проверка доступности сервера. Возвращает `{"status": "ok"}`.
POST /api/register
Регистрация нового пользователя.
POST /api/login
Вход. Возвращает токен авторизации (Bearer Token, действует 14 дней).
GET/PATCH /api/me
Просмотр и редактирование профиля текущего пользователя.
GET /api/admin/users
Список всех пользователей (только для администраторов).
PATCH /api/admin/users/:id/role
Назначение/снятие прав администратора.
GET /api/admin/health/databases
Проверка состояния обеих баз данных.
Пример отправки данных (curl)
```bash
curl -X POST http://109.73.206.169/save \\\\
  -H "Content-Type: application/json" \\\\
  -d '{"name":"Иванов С.М.","model":"Samsung","charge":"85%","connection\\\_time":"14:30","disconnection\\\_time":"15:45"}'
```
<<<<<<< HEAD

\---

## Хостинг и деплой

### Сервер

|Параметр|Значение|
|-|-|
|Провайдер|Timeweb Cloud|
|ОС|Ubuntu 24.04|
|Регион|Москва|
|IP|109.73.206.169|
|CPU / RAM|1 vCPU / 1 GB|
|Диск|15 GB NVMe|

### Стек на сервере

```
nginx (порт 80) → gunicorn (порт 5000) → Flask (app.py)
```

### Файлы конфигурации на сервере

**systemd сервис** (`/etc/systemd/system/phonedeck.service`):

=======
---
Хостинг и деплой
Сервер
Параметр	Значение
Провайдер	Timeweb Cloud
ОС	Ubuntu 24.04
Регион	Москва
IP	109.73.206.169
CPU / RAM	1 vCPU / 1 GB
Диск	15 GB NVMe
Стек на сервере
```
nginx (порт 80) → gunicorn (порт 5000) → Flask (app.py)
```
Файлы конфигурации на сервере
systemd сервис (`/etc/systemd/system/phonedeck.service`):
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
```ini
\\\[Unit]
Description=PhoneDeck Flask App
After=network.target

\\\[Service]
User=root
WorkingDirectory=/opt/phonedeck
Environment="FLASK\\\_SECRET\\\_KEY=замените-на-случайную-строку"
ExecStart=/opt/phonedeck/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 app:app
Restart=always

\\\[Install]
WantedBy=multi-user.target
```
<<<<<<< HEAD

**nginx** (`/etc/nginx/sites-available/phonedeck`):

=======
nginx (`/etc/nginx/sites-available/phonedeck`):
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
```nginx
server {
    listen 80;
    server\\\_name \\\_;

    location / {
        proxy\\\_pass http://127.0.0.1:5000;
        proxy\\\_set\\\_header Host $host;
        proxy\\\_set\\\_header X-Real-IP $remote\\\_addr;
        proxy\\\_set\\\_header X-Forwarded-For $proxy\\\_add\\\_x\\\_forwarded\\\_for;
    }
}
```
<<<<<<< HEAD

**Файрвол (UFW):**

* 22/tcp (SSH)
* 80/tcp (HTTP)
* 443/tcp (HTTPS — зарезервирован)

### Деплой обновлений (на текущий сервер)

=======
Файрвол (UFW):
22/tcp (SSH)
80/tcp (HTTP)
443/tcp (HTTPS — зарезервирован)
Деплой обновлений (на текущий сервер)
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
```bash
ssh root@109.73.206.169
cd /opt/phonedeck
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
cd frontend \\\&\\\& npm ci \\\&\\\& CI=false npm run build \\\&\\\& cd ..
cp -r frontend/build ./build
sudo systemctl restart phonedeck
```
Просмотр логов
```bash
sudo journalctl -u phonedeck -f
```
<<<<<<< HEAD

\---

## Перенос на новый хостинг

### Что потребуется

|Требование|Минимум|Рекомендуется|
|-|-|-|
|ОС|Ubuntu 20.04+|Ubuntu 24.04 LTS|
|CPU|1 vCPU|1–2 vCPU|
|RAM|512 MB|1 GB|
|Диск|5 GB|15 GB NVMe|
|Открытые порты|22, 80|22, 80, 443|
|Python|3.8+|3.11+|
|Node.js|16+|20 LTS|

### Шаг 1. Получить код и данные

**Вариант A — через Git (если есть репозиторий):**

```bash
git clone <адрес-репозитория> /opt/phonedeck
```

**Вариант B — через архив (из этого zip):**

=======
---
Перенос на новый хостинг
Что потребуется
Требование	Минимум	Рекомендуется
ОС	Ubuntu 20.04+	Ubuntu 24.04 LTS
CPU	1 vCPU	1–2 vCPU
RAM	512 MB	1 GB
Диск	5 GB	15 GB NVMe
Открытые порты	22, 80	22, 80, 443
Python	3.8+	3.11+
Node.js	16+	20 LTS
Шаг 1. Получить код и данные
Вариант A — через Git (если есть репозиторий):
```bash
git clone <адрес-репозитория> /opt/phonedeck
```
Вариант B — через архив (из этого zip):
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
```bash
# Загрузить phonedeck.zip на новый сервер
scp phonedeck.zip root@НОВЫЙ-IP:/opt/
ssh root@НОВЫЙ-IP
cd /opt
unzip phonedeck.zip
mv phonedeck /opt/phonedeck
```
Шаг 2. Перенести базы данных
Оба файла содержат важные данные и должны быть перенесены со старого сервера:
```bash
# Со старого сервера — скопировать БД на новый
scp root@109.73.206.169:/opt/phonedeck/devices.db root@НОВЫЙ-IP:/opt/phonedeck/devices.db
scp root@109.73.206.169:/opt/phonedeck/users.db   root@НОВЫЙ-IP:/opt/phonedeck/users.db
```
<<<<<<< HEAD

Если старый сервер уже недоступен, а БД есть в архиве — они будут созданы заново пустыми при первом запуске. **Схема создаётся автоматически** в `create\\\_table()` в `app.py`.

> ⚠️ \\\*\\\*Важно:\\\*\\\* перед переносом сделайте резервную копию:
=======
Если старый сервер уже недоступен, а БД есть в архиве — они будут созданы заново пустыми при первом запуске. Схема создаётся автоматически в `create_table()` в `app.py`.
> ⚠️ **Важно:** перед переносом сделайте резервную копию:
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
> ```bash
> sqlite3 /opt/phonedeck/devices.db ".backup '/tmp/devices\\\_backup.db'"
> sqlite3 /opt/phonedeck/users.db   ".backup '/tmp/users\\\_backup.db'"
> ```
Шаг 3. Установить системные пакеты
```bash
apt update \\\&\\\& apt upgrade -y
apt install -y python3 python3-pip python3-venv nginx nodejs npm git curl unzip
```
Проверить версии:

```bash
python3 --version   # >= 3.8
node --version      # >= 16
npm --version
```
Шаг 4. Настроить Python окружение
```bash
cd /opt/phonedeck
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

# Установить зависимости (убедитесь что requirements.txt содержит все пакеты)
pip install -r requirements.txt

# Если возникнут ошибки импорта — установить явно:
pip install Flask Flask-Cors gunicorn itsdangerous werkzeug
```
Шаг 5. Собрать фронтенд
```bash
cd /opt/phonedeck/frontend
npm ci
CI=false npm run build
cd ..
cp -r frontend/build ./build
```
> Флаг `CI=false` необходим — без него React-скрипты трактуют предупреждения как ошибки и сборка падает.
Шаг 6. Проверить runtime-config.js
Файл `build/runtime-config.js` управляет тем, куда фронтенд отправляет запросы:
```bash
cat /opt/phonedeck/build/runtime-config.js
```
Для стандартного деплоя (один сервер) должно быть:

```javascript
window.\\\_\\\_PHONEDECK\\\_API\\\_BASE\\\_\\\_ = "";
```
Если нужно явно указать домен:

```javascript
window.\\\_\\\_PHONEDECK\\\_API\\\_BASE\\\_\\\_ = "http://НОВЫЙ-IP-ИЛИ-ДОМЕН";
```
Шаг 7. Сгенерировать секретный ключ
```bash
openssl rand -hex 32
# Скопируйте вывод — он понадобится в шаге 8
```
Шаг 8. Создать systemd-сервис
```bash
nano /etc/systemd/system/phonedeck.service
```
```ini
\\\[Unit]
Description=PhoneDeck Flask App
After=network.target

\\\[Service]
User=root
WorkingDirectory=/opt/phonedeck
Environment="FLASK\\\_SECRET\\\_KEY=ВСТАВЬТЕ-КЛЮЧ-ИЗ-ШАГА-7"
ExecStart=/opt/phonedeck/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 app:app
Restart=always
RestartSec=5

\\\[Install]
WantedBy=multi-user.target
```
Запустить:

```bash
systemctl daemon-reload
systemctl enable phonedeck
systemctl start phonedeck
systemctl status phonedeck
```
Проверить, что Flask поднялся:

```bash
curl http://127.0.0.1:5000/health
# Ожидаемый ответ: {"status": "ok"}
```
Шаг 9. Настроить nginx
```bash
nano /etc/nginx/sites-available/phonedeck
```
```nginx
server {
    listen 80;
    server\\\_name \\\_;   # или ваш домен: example.com

    # Увеличенный таймаут на случай медленных запросов
    proxy\\\_read\\\_timeout 60s;
    proxy\\\_connect\\\_timeout 10s;

    location / {
        proxy\\\_pass http://127.0.0.1:5000;
        proxy\\\_set\\\_header Host $host;
        proxy\\\_set\\\_header X-Real-IP $remote\\\_addr;
        proxy\\\_set\\\_header X-Forwarded-For $proxy\\\_add\\\_x\\\_forwarded\\\_for;
        proxy\\\_set\\\_header X-Forwarded-Proto $scheme;
    }
}
```
Активировать и проверить:

```bash
ln -s /etc/nginx/sites-available/phonedeck /etc/nginx/sites-enabled/
# Отключить дефолтный сайт, если он мешает:
rm -f /etc/nginx/sites-enabled/default

nginx -t           # Проверить конфиг на ошибки
systemctl enable nginx
systemctl restart nginx
```
Шаг 10. Настроить файрвол
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp  # Резерв под HTTPS
ufw enable
ufw status
```
Шаг 11. Перепрошить ESP8266 (если IP изменился)
Если IP-адрес нового сервера отличается от `109.73.206.169`, устройство ESP8266 не сможет отправлять данные. Нужно обновить скетч:
<<<<<<< HEAD

1. Открыть `arduino/NodeMCU\\\_updated/NodeMCU\\\_updated.ino`
2. Найти строку с адресом сервера (переменная `server`, `host` или похожая)
3. Заменить `109.73.206.169` на новый IP или домен
4. Перепрошить ESP8266 (см. раздел [Прошивка ESP8266](#прошивка-esp8266))

=======
Открыть `arduino/NodeMCU_updated/NodeMCU_updated.ino`
Найти строку с адресом сервера (переменная `server`, `host` или похожая)
Заменить `109.73.206.169` на новый IP или домен
Перепрошить ESP8266 (см. раздел Прошивка ESP8266)
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
Если у нового сервера есть доменное имя, лучше указать домен — IP может измениться, домен останется.
Шаг 12. Финальная проверка
```bash
# 1. Сервис запущен
systemctl status phonedeck

# 2. API отвечает
curl http://НОВЫЙ-IP/health         # {"status": "ok"}
curl http://НОВЫЙ-IP/get\\\_data       # \\\[] или список устройств

# 3. Сайт открывается
curl -I http://НОВЫЙ-IP/            # HTTP 200

# 4. Логи без ошибок
journalctl -u phonedeck -n 50 --no-pager
```
Необязательно: подключить HTTPS (Let's Encrypt)
Если у сервера есть доменное имя:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ваш-домен.ru
# Certbot сам обновит конфиг nginx и настроит автообновление сертификата
```
После этого обновить `runtime-config.js` (если он не пустой):

```javascript
window.\\\_\\\_PHONEDECK\\\_API\\\_BASE\\\_\\\_ = "https://ваш-домен.ru";
```
<<<<<<< HEAD

### Чеклист переноса

* \[ ] Код скопирован на новый сервер (`/opt/phonedeck`)
* \[ ] `devices.db` перенесён (или пустой — данные утрачены)
* \[ ] `users.db` перенесён (или пустой — пользователи будут созданы заново)
* \[ ] Python venv создан, зависимости установлены
* \[ ] Фронтенд собран (`npm ci \\\&\\\& npm run build`)
* \[ ] `build/runtime-config.js` настроен под новый адрес
* \[ ] `FLASK\\\_SECRET\\\_KEY` задан в systemd (новое случайное значение)
* \[ ] systemd-сервис создан, включён, запущен
* \[ ] nginx настроен, проверен `nginx -t`, перезапущен
* \[ ] Файрвол настроен (22, 80)
* \[ ] `/health` возвращает `{"status": "ok"}`
* \[ ] Сайт открывается в браузере
* \[ ] ESP8266 перепрошит с новым IP/доменом (если IP изменился)
* \[ ] Пароль администратора сменён через веб-интерфейс

\---

## Настройка рабочего окружения

### Необходимое ПО

|Программа|Установка (macOS)|
|-|-|
|Arduino IDE|`brew install --cask arduino-ide`|
|CP2102 драйвер|`brew install --cask silicon-labs-vcp-driver`|
|Node.js|`brew install node`|
|Python 3|Предустановлен на macOS|

### Платы в Arduino IDE

=======
Чеклист переноса
[ ] Код скопирован на новый сервер (`/opt/phonedeck`)
[ ] `devices.db` перенесён (или пустой — данные утрачены)
[ ] `users.db` перенесён (или пустой — пользователи будут созданы заново)
[ ] Python venv создан, зависимости установлены
[ ] Фронтенд собран (`npm ci && npm run build`)
[ ] `build/runtime-config.js` настроен под новый адрес
[ ] `FLASK_SECRET_KEY` задан в systemd (новое случайное значение)
[ ] systemd-сервис создан, включён, запущен
[ ] nginx настроен, проверен `nginx -t`, перезапущен
[ ] Файрвол настроен (22, 80)
[ ] `/health` возвращает `{"status": "ok"}`
[ ] Сайт открывается в браузере
[ ] ESP8266 перепрошит с новым IP/доменом (если IP изменился)
[ ] Пароль администратора сменён через веб-интерфейс
---
Настройка рабочего окружения
Необходимое ПО
Программа	Установка (macOS)
Arduino IDE	`brew install --cask arduino-ide`
CP2102 драйвер	`brew install --cask silicon-labs-vcp-driver`
Node.js	`brew install node`
Python 3	Предустановлен на macOS
Платы в Arduino IDE
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
В Arduino IDE → Settings → Additional boards manager URLs добавить:
```
https://arduino.esp8266.com/stable/package\\\_esp8266com\\\_index.json
https://dl.espressif.com/dl/package\\\_esp32\\\_index.json
```
Затем через Boards Manager установить:
<<<<<<< HEAD

* **esp8266** — для NodeMCU
* **esp32** — для ESP32S
* **Arduino AVR Boards** — для Arduino Uno (предустановлен)

### Выбор плат

|Микроконтроллер|Плата в Arduino IDE|
|-|-|
|Arduino Uno|Arduino Uno|
|ESP8266 (NodeMCU Amica)|NodeMCU 1.0 (ESP-12E Module)|
|ESP32S|DOIT ESP32 DEVKIT V1|

### Библиотеки Arduino

Установка: Sketch → Include Library → Add .ZIP Library

|Библиотека|Версия|Назначение|Ссылка|
|-|-|-|-|
|ArduinoJson|7.0.4|Формирование JSON для POST-запросов|https://github.com/bblanchon/ArduinoJson|
|TimeLib|master|Преобразование Unix времени в ЧЧ:ММ|https://github.com/Floodeer/TimeLib|
|iarduino\_I2C\_4LED|1.0.2|Управление 4-разрядными I2C дисплеями|https://github.com/tremaru/iarduino\_I2C\_4LED|
|iarduino\_RTC|2.0.0|Работа с часами реального времени DS3231|https://github.com/iarduino/iarduino\_RTC|

### Прошивка ESP8266

1. Указать WiFi и адрес сервера в `arduino/NodeMCU\\\_updated/NodeMCU\\\_updated.ino`:

```cpp
   #define WIFI\\\_SSID "название\\\_сети"
   #define WIFI\\\_PASSWORD "пароль"
=======
esp8266 — для NodeMCU
esp32 — для ESP32S
Arduino AVR Boards — для Arduino Uno (предустановлен)
Выбор плат
Микроконтроллер	Плата в Arduino IDE
Arduino Uno	Arduino Uno
ESP8266 (NodeMCU Amica)	NodeMCU 1.0 (ESP-12E Module)
ESP32S	DOIT ESP32 DEVKIT V1
Библиотеки Arduino
Установка: Sketch → Include Library → Add .ZIP Library
Библиотека	Версия	Назначение	Ссылка
ArduinoJson	7.0.4	Формирование JSON для POST-запросов	https://github.com/bblanchon/ArduinoJson
TimeLib	master	Преобразование Unix времени в ЧЧ:ММ	https://github.com/Floodeer/TimeLib
iarduino_I2C_4LED	1.0.2	Управление 4-разрядными I2C дисплеями	https://github.com/tremaru/iarduino_I2C_4LED
iarduino_RTC	2.0.0	Работа с часами реального времени DS3231	https://github.com/iarduino/iarduino_RTC
Прошивка ESP8266
Указать WiFi и адрес сервера в `arduino/NodeMCU_updated/NodeMCU_updated.ino`:
```cpp
   #define WIFI_SSID "название_сети"
   #define WIFI_PASSWORD "пароль"
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
   // Адрес сервера — менять при смене хостинга!
   const char\\\* host = "109.73.206.169";  // или новый IP/домен
   ```
<<<<<<< HEAD

2. Подключить NodeMCU кабелем USB Micro
3. Tools → Board → **NodeMCU 1.0 (ESP-12E Module)**
4. Tools → Port → `/dev/cu.usbserial-\\\*`
5. Upload (→)

=======
Подключить NodeMCU кабелем USB Micro
Tools → Board → NodeMCU 1.0 (ESP-12E Module)
Tools → Port → `/dev/cu.usbserial-*`
Upload (→)
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
Или через CLI:

```bash
arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 arduino/NodeMCU\\\_updated/
arduino-cli upload --fqbn esp8266:esp8266:nodemcuv2 --port /dev/cu.usbserial-0001 arduino/NodeMCU\\\_updated/
```
<<<<<<< HEAD

### Прошивка Arduino Uno

1. Подключить Arduino кабелем USB Type B
2. Tools → Board → **Arduino Uno**
3. Tools → Port → `/dev/cu.usbmodem\\\*`
4. Upload (→)

Скетч Arduino Uno (`Arduino\\\_230225.ino`) менять не нужно — в нём нет адреса сервера.

### Кабели

|Устройство|Кабель|Примечание|
|-|-|-|
|Arduino Uno|USB Type B|Фиолетовый, внутри станции|
|ESP8266 / ESP32|USB Micro|-|

### Serial Monitor

Для отладки: Tools → Serial Monitor, скорость **9600 бод**.

### Локальный запуск (разработка)

=======
Прошивка Arduino Uno
Подключить Arduino кабелем USB Type B
Tools → Board → Arduino Uno
Tools → Port → `/dev/cu.usbmodem*`
Upload (→)
Скетч Arduino Uno (`Arduino_230225.ino`) менять не нужно — в нём нет адреса сервера.
Кабели
Устройство	Кабель	Примечание
Arduino Uno	USB Type B	Фиолетовый, внутри станции
ESP8266 / ESP32	USB Micro	-
Serial Monitor
Для отладки: Tools → Serial Monitor, скорость 9600 бод.
Локальный запуск (разработка)
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
```bash
# Бэкенд
cd /path/to/phonedeck
python3 -m venv venv \\\&\\\& source venv/bin/activate
pip install -r requirements.txt
python app.py
# Flask запустится на http://127.0.0.1:5000

# Фронтенд (в отдельном терминале)
cd frontend
npm install
npm start
# React dev-server на http://localhost:3000
# Проксирует API на :5000 (настроено в package.json → "proxy")
```
<<<<<<< HEAD

\---

## Аппаратная часть

### Компоненты станции

|Компонент|Кол-во|Назначение|
|-|-|-|
|Arduino Uno|1|Главный контроллер|
|ESP8266 (NodeMCU Amica)|1|WiFi-модуль|
|Микропереключатель SM5-02N-38G|6|Датчик присутствия телефона|
|I2C дисплей (Trema 4LED)|6|Отображение времени (ММ:СС)|
|RTC DS3231|1|Часы реального времени|
|Батарейка CR2032|1|Автономное питание RTC|

### Распиновка Arduino Uno

|Пин|Назначение|
|-|-|
|2|RX (приём от ESP8266)|
|3|TX (отправка на ESP8266)|
|5|Концевик 1 (слот 6)|
|7|Концевик 2 (слот 5)|
|8|Концевик 3 (слот 3)|
|9|Концевик 4 (слот 4)|
|11|Концевик 5 (слот 2)|
|13|Концевик 6 (слот 1)|
|A4 (SDA)|I2C — дисплеи + RTC|
|A5 (SCL)|I2C — дисплеи + RTC|

Нумерация слотов инвертирована из-за физического подключения внутри станции.

### Адреса I2C дисплеев

|Дисплей|Адрес (hex)|
|-|-|
|1|0x0E|
|2|0x0C|
|3|0x0D|
|4|0x0F|
|5|0x0A|
|6|0x0B|

Для смены адреса использовать скетч `Display\\\_SetAddress.ino` (подключать по одному устройству).

### Установка времени RTC

Скетч `RTC\\\_SetTime.ino` — загрузить один раз для установки текущего времени на модуль DS3231.

\---

## Устранение неполадок

### ESP8266 не подключается к WiFi

* Проверить SSID и пароль в скетче
* ESP8266 поддерживает **только 2.4 GHz** (не 5 GHz)
* Открыть Serial Monitor (9600 бод) — посмотреть вывод "Connecting..."
* Если 50 точек без подключения — сеть недоступна

### Данные не приходят на сервер

* Проверить что ESP8266 подключена к WiFi ("WiFi connected" в Serial Monitor)
* Проверить доступность сервера: `curl http://IP-СЕРВЕРА/health`
* Убедиться, что в скетче ESP8266 указан актуальный IP/домен сервера
* Проверить что концевики срабатывают (данные отправляются при **отпускании** концевика)
* Проверить соединение Arduino ↔ ESP8266 (провода TX/RX)

### Сайт не открывается

* Проверить статус сервиса: `sudo systemctl status phonedeck`
* Проверить логи: `sudo journalctl -u phonedeck -f`
* Перезапустить: `sudo systemctl restart phonedeck`
* Проверить nginx: `sudo systemctl status nginx`
* Проверить что Flask отвечает напрямую: `curl http://127.0.0.1:5000/health`

### Ошибка 500 при запуске Flask

=======
---
Аппаратная часть
Компоненты станции
Компонент	Кол-во	Назначение
Arduino Uno	1	Главный контроллер
ESP8266 (NodeMCU Amica)	1	WiFi-модуль
Микропереключатель SM5-02N-38G	6	Датчик присутствия телефона
I2C дисплей (Trema 4LED)	6	Отображение времени (ММ:СС)
RTC DS3231	1	Часы реального времени
Батарейка CR2032	1	Автономное питание RTC
Распиновка Arduino Uno
Пин	Назначение
2	RX (приём от ESP8266)
3	TX (отправка на ESP8266)
5	Концевик 1 (слот 6)
7	Концевик 2 (слот 5)
8	Концевик 3 (слот 3)
9	Концевик 4 (слот 4)
11	Концевик 5 (слот 2)
13	Концевик 6 (слот 1)
A4 (SDA)	I2C — дисплеи + RTC
A5 (SCL)	I2C — дисплеи + RTC
Нумерация слотов инвертирована из-за физического подключения внутри станции.
Адреса I2C дисплеев
Дисплей	Адрес (hex)
1	0x0E
2	0x0C
3	0x0D
4	0x0F
5	0x0A
6	0x0B
Для смены адреса использовать скетч `Display_SetAddress.ino` (подключать по одному устройству).
Установка времени RTC
Скетч `RTC_SetTime.ino` — загрузить один раз для установки текущего времени на модуль DS3231.
---
Устранение неполадок
ESP8266 не подключается к WiFi
Проверить SSID и пароль в скетче
ESP8266 поддерживает только 2.4 GHz (не 5 GHz)
Открыть Serial Monitor (9600 бод) — посмотреть вывод "Connecting..."
Если 50 точек без подключения — сеть недоступна
Данные не приходят на сервер
Проверить что ESP8266 подключена к WiFi ("WiFi connected" в Serial Monitor)
Проверить доступность сервера: `curl http://IP-СЕРВЕРА/health`
Убедиться, что в скетче ESP8266 указан актуальный IP/домен сервера
Проверить что концевики срабатывают (данные отправляются при отпускании концевика)
Проверить соединение Arduino ↔ ESP8266 (провода TX/RX)
Сайт не открывается
Проверить статус сервиса: `sudo systemctl status phonedeck`
Проверить логи: `sudo journalctl -u phonedeck -f`
Перезапустить: `sudo systemctl restart phonedeck`
Проверить nginx: `sudo systemctl status nginx`
Проверить что Flask отвечает напрямую: `curl http://127.0.0.1:5000/health`
Ошибка 500 при запуске Flask
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
Скорее всего — отсутствует зависимость Python. Проверить:

```bash
source /opt/phonedeck/venv/bin/activate
python -c "import itsdangerous; import werkzeug; print('OK')"
# Если ImportError — установить: pip install itsdangerous werkzeug
```
<<<<<<< HEAD

### Авторизация перестала работать после переноса

Токены подписаны `FLASK\\\_SECRET\\\_KEY`. Если на новом сервере ключ другой — все старые токены недействительны. Пользователям нужно войти заново. Это нормально.

### Arduino IDE не видит плату

* Проверить что кабель поддерживает передачу данных (не только зарядку)
* Проверить драйвер CP2102: `ls /dev/cu.usb\\\*`
* Перезагрузить Arduino IDE после установки плат/библиотек

### Ошибка "programmer is not responding"

* Выбрана неправильная плата в Tools → Board
* `/dev/cu.usbserial-\\\*` — это ESP8266 (CP2102)
* `/dev/cu.usbmodem-\\\*` — это Arduino Uno

\---

## Известные ограничения

1. **Страницы Rating, Statistics, Station, Contacts** используют внешнюю заглушку `jsonplaceholder.typicode.com` — реальные данные туда не подключены. Для полноценной работы нужно реализовать соответствующие эндпоинты в `app.py` и подключить их во фронтенде.
2. **Пароль администратора** задан в коде (`app.py`, константа `DEFAULT\\\_ADMIN\\\_PASSWORD`). При каждом старте сервера он сбрасывается к значению из кода. Для смены пароля нужно либо изменить константу в коде, либо реализовать отдельный механизм смены пароля.
3. **Firebase** подключён, но не используется (конфиг в `firebase.js` содержит реальные ключи — в будущем стоит убрать их из репозитория или перенести в переменные окружения).
4. **SQLite** не рассчитан на высокую нагрузку (конкурентная запись). Для масштабирования потребуется переход на PostgreSQL.
5. **`requirements.txt`** не зафиксированы версии пакетов (`Flask` без `==X.Y.Z`). Рекомендуется зафиксировать: `pip freeze > requirements.txt` после успешного деплоя..

=======
Авторизация перестала работать после переноса
Токены подписаны `FLASK_SECRET_KEY`. Если на новом сервере ключ другой — все старые токены недействительны. Пользователям нужно войти заново. Это нормально.
Arduino IDE не видит плату
Проверить что кабель поддерживает передачу данных (не только зарядку)
Проверить драйвер CP2102: `ls /dev/cu.usb*`
Перезагрузить Arduino IDE после установки плат/библиотек
Ошибка "programmer is not responding"
Выбрана неправильная плата в Tools → Board
`/dev/cu.usbserial-*` — это ESP8266 (CP2102)
`/dev/cu.usbmodem-*` — это Arduino Uno
---
Известные ограничения
Страницы Rating, Statistics, Station, Contacts используют внешнюю заглушку `jsonplaceholder.typicode.com` — реальные данные туда не подключены. Для полноценной работы нужно реализовать соответствующие эндпоинты в `app.py` и подключить их во фронтенде.
Пароль администратора задан в коде (`app.py`, константа `DEFAULT_ADMIN_PASSWORD`). При каждом старте сервера он сбрасывается к значению из кода. Для смены пароля нужно либо изменить константу в коде, либо реализовать отдельный механизм смены пароля.
Firebase подключён, но не используется (конфиг в `firebase.js` содержит реальные ключи — в будущем стоит убрать их из репозитория или перенести в переменные окружения).
SQLite не рассчитан на высокую нагрузку (конкурентная запись). Для масштабирования потребуется переход на PostgreSQL.
`requirements.txt` не зафиксированы версии пакетов (`Flask` без `==X.Y.Z`). Рекомендуется зафиксировать: `pip freeze > requirements.txt` после успешного деплоя.
>>>>>>> 641c151322911b1cafb993d8e70808ff5e5b2efa
