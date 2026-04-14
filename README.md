# PhoneDeck — Станция для борьбы с информационной зависимостью

Проект представляет собой аппаратно-программный комплекс для хранения телефонов с учётом времени использования. Станция фиксирует момент помещения и извлечения телефона, отображает время на дисплее и отправляет данные на веб-сервер.

## Сайт

**http://109.73.206.169**

## Оглавление

- [Структура проекта](#структура-проекта)
- [Архитектура системы](#архитектура-системы)
- [Серверная часть](#серверная-часть)
- [Фронтенд](#фронтенд)
- [Аппаратная часть](#аппаратная-часть)
- [API](#api)
- [Хостинг и деплой](#хостинг-и-деплой)
- [Инструкция для команды сайта (для новичка)](#инструкция-для-команды-сайта-для-новичка)
- [Настройка рабочего окружения](#настройка-рабочего-окружения)
- [Устранение неполадок](#устранение-неполадок)

---

## Структура проекта

```
phonedeck/
├── app.py                     # Flask бэкенд (API + раздача React)
├── requirements.txt           # Python зависимости (Flask, Flask-Cors, gunicorn)
├── Procfile                   # Конфиг запуска gunicorn
├── build.sh                   # Скрипт сборки для деплоя
├── build/                     # Скомпилированный React (раздается Flask в проде)
├── frontend/                  # React приложение
│   ├── src/
│   │   ├── pages/             # Страницы
│   │   │   ├── ViewPage/      # Главная (обзор станции)
│   │   │   ├── Rating/        # Рейтинг (по школе и по классам)
│   │   │   ├── Statistics/    # Статистика пользователей
│   │   │   ├── Bonuses/       # Бонусная система
│   │   │   ├── Station/       # Информация о станциях
│   │   │   ├── Contacts/      # Контакты
│   │   │   └── NotFound/      # 404
│   │   ├── components/        # Переиспользуемые компоненты
│   │   │   ├── UserTable/     # Таблица пользователей (данные с сервера)
│   │   │   ├── Pagination/    # Пагинация
│   │   │   ├── MorrisChart/   # График
│   │   │   ├── Modals/        # Модальные окна
│   │   │   └── SemanticElements/  # Header, Aside, Footer
│   │   ├── context/           # React Context (бонусы)
│   │   ├── routes/            # React Router
│   │   ├── assets/            # SVG, MP3
│   │   └── api.js             # Единая сборка URL API (/get_data, /save)
│   ├── public/
│   │   └── runtime-config.js  # Runtime-настройка API URL в проде
│   └── package.json
└── arduino/                   # Скетчи для микроконтроллеров
    ├── Arduino_230225/        # Arduino Uno (основной контроллер)
    ├── NodeMCU_updated/       # ESP8266 (WiFi + отправка на сервер)
    ├── ESP32S_POST.ino        # ESP32 (тестовый POST)
    ├── ESP32S_Sensors.ino     # ESP32 (лазерные датчики)
    ├── RTC_SetTime.ino        # Установка времени RTC
    └── Display_SetAddress.ino # Установка адреса I2C дисплея
```

---

## Архитектура системы

### Общая схема

```
┌─────────────────────────────────────────────────────────────────┐
│                          СТАНЦИЯ                                │
│                                                                 │
│  [Телефон] → [Концевик] → [Arduino Uno] ──Serial──→ [ESP8266]  │
│                                ↓                        ↓       │
│                         [Дисплей ММ:СС]          WiFi POST      │
│                                                     ↓           │
└─────────────────────────────────────────────────────────────────┘
                                                      ↓
                                          ┌───────────────────┐
                                          │    VPS СЕРВЕР     │
                                          │  nginx → gunicorn │
                                          │       ↓           │
                                          │  Flask (app.py)   │
                                          │       ↓           │
                                          │  SQLite (devices)  │
                                          │       ↓           │
                                          │  React (frontend)  │
                                          └───────────────────┘
                                                      ↓
                                              http://109.73.206.169
```

### Компоненты

| Компонент | Технология | Роль |
|-----------|-----------|------|
| Arduino Uno | C++ / Arduino IDE | Главный контроллер: чтение 6 концевиков, управление 6 дисплеями I2C, работа с RTC DS3231 |
| ESP8266 (NodeMCU Amica) | C++ / Arduino IDE | WiFi-модуль: получает данные от Arduino по Serial (UART 9600 бод), отправляет HTTP POST на сервер |
| Flask | Python 3 | Бэкенд: API для приёма и отдачи данных, раздача React-билда |
| React | JavaScript (CRA) | Фронтенд: отображение данных, навигация, бонусная система |
| SQLite | SQL | База данных: хранение записей об устройствах |
| nginx | - | Reverse proxy: проксирует HTTP запросы на gunicorn |
| gunicorn | Python | WSGI-сервер: запускает Flask в продакшене |

### Обмен данными Arduino ↔ ESP8266

Связь по **SoftwareSerial (UART)** на скорости **9600 бод**:

- Arduino Uno: TX=3, RX=2
- ESP8266: RX=D7, TX=D8

Данные передаются как структура с побайтовым выравниванием:

```cpp
struct MyData {
  uint32_t start;  // Время начала (Unix)
  uint32_t stop;   // Время конца (Unix)
  byte slot;       // Номер слота (1-6)
  byte crc;        // Контрольная сумма CRC8
};
```

ESP8266 проверяет CRC и при успехе отправляет подтверждение (0) на Arduino. При ошибке — запрос повторной отправки (1).

---

## Серверная часть

### Бэкенд (app.py)

Flask-приложение, которое:
1. Принимает POST-запросы с данными от ESP8266 (`/save`)
2. Отдаёт все записи из БД (`/get_data`)
3. Отдаёт статус сервиса (`/health`)
4. Раздаёт скомпилированный React-фронтенд (из папки `build/`)
5. Поддерживает React Router (catch-all маршрут)

### База данных

SQLite файл `devices.db`, таблица `devices`:

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PRIMARY KEY | Автоинкремент |
| name | TEXT NOT NULL | ФИО пользователя |
| model | TEXT NOT NULL | Модель телефона |
| charge | TEXT NOT NULL | Заряд батареи |
| connection_time | TEXT NOT NULL | Время подключения (ЧЧ:ММ) |
| disconnection_time | TEXT NOT NULL | Время отключения (ЧЧ:ММ) |

### Зависимости Python

```
Flask          — веб-фреймворк
Flask-Cors     — CORS для кросс-доменных запросов
gunicorn       — WSGI-сервер для продакшена
```

---

## Фронтенд

### Технологии

- **React 18.2** (Create React App)
- **React Router 6** — маршрутизация
- **Axios** — HTTP-запросы
- **Chart.js + react-chartjs-2** — графики
- **Runtime API config** — `public/runtime-config.js` + `src/api.js`
- **Redux** — установлен, но не используется

### Страницы

| Маршрут | Страница | Описание |
|---------|----------|----------|
| `/viewPage` | Обзор | Главная: график и таблица пользователей с сервера (`/get_data`). Блок "999 / 67%" сейчас статический UI |
| `/rating/school` | Рейтинг по школе | Таблица учеников с бонусами |
| `/rating/classes` | Рейтинг по классам | Выбор класса → таблица учеников |
| `/statistics` | Статистика | Накопленные/потраченные бонусы, часы в станции |
| `/bonuses` | Бонусы | Траты бонусов, история операций |
| `/station` | Станции | Демонстрационная страница со случайными/mock данными (не из `/get_data`) |
| `/contacts` | Контакты | Контактная информация |

### Компонент UserTable

Ключевой компонент — получает реальные данные с бэкенда:

```javascript
const response = await axios.get(apiUrl("/get_data"))
```

Отображает таблицу устройств с пагинацией (5 записей на страницу).

---

## API

### POST /save

Сохранение данных об устройстве.

**Запрос:**
```json
{
  "name": "Петров А.Д.",
  "model": "TCL",
  "charge": "71%",
  "connection_time": "09:15",
  "disconnection_time": "10:30"
}
```

**Ответ (201):**
```json
{
  "message": "Data saved successfully"
}
```

**Ошибки:**
- `400` — отсутствуют обязательные поля
- `500` — ошибка базы данных

### GET /get_data

Получение всех записей.

**Ответ (200):**
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

### GET /health

Проверка, что API запущено.

**Ответ (200):**
```json
{
  "status": "ok"
}
```

### Пример отправки данных (curl)

```bash
curl -X POST http://109.73.206.169/save \
  -H "Content-Type: application/json" \
  -d '{"name":"Иванов С.М.","model":"Samsung","charge":"85%","connection_time":"14:30","disconnection_time":"15:45"}'
```

---

## Хостинг и деплой

### Сервер

| Параметр | Значение |
|----------|----------|
| Провайдер | Timeweb Cloud |
| ОС | Ubuntu 24.04 |
| Регион | Москва |
| IP | 109.73.206.169 |
| CPU / RAM | 1 vCPU / 1 GB |
| Диск | 15 GB NVMe |

### Стек на сервере

```
nginx (порт 80) → gunicorn (порт 5000) → Flask (app.py)
```

### Файлы конфигурации на сервере

**systemd сервис** (`/etc/systemd/system/phonedeck.service`):
```ini
[Unit]
Description=PhoneDeck Flask App
After=network.target

[Service]
User=root
WorkingDirectory=/opt/phonedeck
ExecStart=/opt/phonedeck/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

**nginx** (`/etc/nginx/sites-available/phonedeck`):
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Файрвол (UFW):**
- 22/tcp (SSH)
- 80/tcp (HTTP)
- 443/tcp (HTTPS — зарезервирован)

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

После деплоя проверь:

```bash
curl http://109.73.206.169/health
curl http://109.73.206.169/get_data
```

Если фронтенд и API на разных доменах, отредактируй `build/runtime-config.js`:

```js
window.__PHONEDECK_API_BASE__ = "http://109.73.206.169";
```

### Просмотр логов

```bash
sudo journalctl -u phonedeck -f
```

---

## Инструкция для команды сайта (для новичка)

Этот раздел только про веб-часть: как быстро проверить, что сервер и сайт принимают/показывают данные от станции.

### 1) Быстрая проверка прод-сервера (без Arduino)

Проверка "жив ли backend":

```bash
curl http://109.73.206.169/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

Проверка "есть ли записи в БД":

```bash
curl http://109.73.206.169/get_data
```

Если `[]`, сервер работает, но данных пока нет.

### 2) Проверка POST /save на реальном сайте (через браузер)

1. Открыть `http://109.73.206.169/`
2. Нажать `F12` -> вкладка `Console`
3. Выполнить:

```js
fetch("http://109.73.206.169/save", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Браузер тест",
    model: "TCL",
    charge: "88%",
    connection_time: "10:00",
    disconnection_time: "10:30",
  }),
})
  .then(async (r) => ({ status: r.status, text: await r.text() }))
  .then(console.log)
  .catch(console.error);
```

4. Проверить, что запись появилась:

```js
fetch("http://109.73.206.169/get_data")
  .then((r) => r.json())
  .then((data) => console.log("last:", data[data.length - 1], "count:", data.length))
  .catch(console.error);
```

Если в консоли есть `status: 201` и запись видна в `/get_data`, значит backend корректно принимает POST.

### 3) Локальная проверка сайта (для разработки)

В двух терминалах:

Терминал 1 (backend):

```powershell
cd C:\Users\horde\Downloads\phonedeck-main
py app.py
```

Терминал 2 (frontend):

```powershell
cd C:\Users\horde\Downloads\phonedeck-main\frontend
npm.cmd run start
```

Открыть:

`http://localhost:3000/viewPage`

Таблица на `ViewPage` должна показывать данные из `/get_data`.

### 4) Что уже является нормальным поведением

- На `ViewPage` блок `999` и `67%` сейчас статический UI (заглушка).
- Реальные данные сейчас отображаются в:
  - таблице пользователей (`UserTable`)
  - графике (`MorrisChart`)
- Данные со станции отправляются при отпускании концевика (когда телефон вынимают).

### 5) Частые проблемы и что делать

- **`/health` не открывается**
  - backend не запущен или nginx не проксирует на gunicorn.

- **`/save` возвращает 404**
  - запрос попадает не в Flask-приложение (проверить nginx/маршрутизацию).

- **`/save` возвращает 400**
  - в JSON нет обязательных полей: `name`, `model`, `charge`, `connection_time`, `disconnection_time`.

- **`/get_data` возвращает `[]`**
  - сервер жив, но записи не поступили (или не дошёл POST от станции).

- **Сайт открыт, но таблица пустая**
  - проверить ответ `/get_data` в браузере и во вкладке Network.

### 6) Мини-чек перед демонстрацией

- [ ] `http://109.73.206.169/health` отвечает `ok`
- [ ] `http://109.73.206.169/get_data` отдаёт JSON
- [ ] Тестовый `POST /save` возвращает `201`
- [ ] После POST запись видна в `/get_data`
- [ ] На `viewPage` запись появилась в таблице

---

## Настройка рабочего окружения

### Необходимое ПО

| Программа | Установка (macOS) |
|-----------|-------------------|
| Arduino IDE | `brew install --cask arduino-ide` |
| CP2102 драйвер | `brew install --cask silicon-labs-vcp-driver` |
| Node.js | `brew install node` |
| Python 3 | Предустановлен на macOS |

### Платы в Arduino IDE

В Arduino IDE → Settings → Additional boards manager URLs добавить:

```
https://arduino.esp8266.com/stable/package_esp8266com_index.json
https://dl.espressif.com/dl/package_esp32_index.json
```

Затем через Boards Manager установить:
- **esp8266** — для NodeMCU
- **esp32** — для ESP32S
- **Arduino AVR Boards** — для Arduino Uno (предустановлен)

### Выбор плат

| Микроконтроллер | Плата в Arduino IDE |
|----------------|---------------------|
| Arduino Uno | Arduino Uno |
| ESP8266 (NodeMCU Amica) | NodeMCU 1.0 (ESP-12E Module) |
| ESP32S | DOIT ESP32 DEVKIT V1 |

### Библиотеки Arduino

Установка: Sketch → Include Library → Add .ZIP Library

| Библиотека | Версия | Назначение | Ссылка |
|------------|--------|------------|--------|
| ArduinoJson | 7.0.4 | Формирование JSON для POST-запросов | https://github.com/bblanchon/ArduinoJson |
| TimeLib | master | Преобразование Unix времени в ЧЧ:ММ | https://github.com/Floodeer/TimeLib |
| iarduino_I2C_4LED | 1.0.2 | Управление 4-разрядными I2C дисплеями | https://github.com/tremaru/iarduino_I2C_4LED |
| iarduino_RTC | 2.0.0 | Работа с часами реального времени DS3231 | https://github.com/iarduino/iarduino_RTC |

### Прошивка ESP8266

1. Указать WiFi в `arduino/NodeMCU_updated/NodeMCU_updated.ino`:
   ```cpp
   #define WIFI_SSID "название_сети"
   #define WIFI_PASSWORD "пароль"
   ```
2. Подключить NodeMCU кабелем USB Micro
3. Tools → Board → **NodeMCU 1.0 (ESP-12E Module)**
4. Tools → Port → `/dev/cu.usbserial-*`
5. Upload (→)

Или через CLI:
```bash
arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 arduino/NodeMCU_updated/
arduino-cli upload --fqbn esp8266:esp8266:nodemcuv2 --port /dev/cu.usbserial-0001 arduino/NodeMCU_updated/
```

### Прошивка Arduino Uno

1. Подключить Arduino кабелем USB Type B
2. Tools → Board → **Arduino Uno**
3. Tools → Port → `/dev/cu.usbmodem*`
4. Upload (→)

Скетч Arduino Uno (`Arduino_230225.ino`) менять не нужно — в нём нет адреса сервера.

### Кабели

| Устройство | Кабель | Примечание |
|-----------|--------|------------|
| Arduino Uno | USB Type B | Фиолетовый, внутри станции |
| ESP8266 / ESP32 | USB Micro | - |

### Serial Monitor

Для отладки: Tools → Serial Monitor, скорость **9600 бод**.

---

## Аппаратная часть

### Компоненты станции

| Компонент | Кол-во | Назначение |
|-----------|--------|------------|
| Arduino Uno | 1 | Главный контроллер |
| ESP8266 (NodeMCU Amica) | 1 | WiFi-модуль |
| Микропереключатель SM5-02N-38G | 6 | Датчик присутствия телефона |
| I2C дисплей (Trema 4LED) | 6 | Отображение времени (ММ:СС) |
| RTC DS3231 | 1 | Часы реального времени |
| Батарейка CR2032 | 1 | Автономное питание RTC |

### Распиновка Arduino Uno

| Пин | Назначение |
|-----|------------|
| 2 | RX (приём от ESP8266) |
| 3 | TX (отправка на ESP8266) |
| 5 | Концевик 1 (слот 6) |
| 7 | Концевик 2 (слот 5) |
| 8 | Концевик 3 (слот 3) |
| 9 | Концевик 4 (слот 4) |
| 11 | Концевик 5 (слот 2) |
| 13 | Концевик 6 (слот 1) |
| A4 (SDA) | I2C — дисплеи + RTC |
| A5 (SCL) | I2C — дисплеи + RTC |

Нумерация слотов инвертирована из-за физического подключения внутри станции.

### Адреса I2C дисплеев

| Дисплей | Адрес (hex) |
|---------|-------------|
| 1 | 0x0E |
| 2 | 0x0C |
| 3 | 0x0D |
| 4 | 0x0F |
| 5 | 0x0A |
| 6 | 0x0B |

Для смены адреса использовать скетч `Display_SetAddress.ino` (подключать по одному устройству).

### Установка времени RTC

Скетч `RTC_SetTime.ino` — загрузить один раз для установки текущего времени на модуль DS3231.

---

## Устранение неполадок

### ESP8266 не подключается к WiFi

- Проверить SSID и пароль в скетче
- ESP8266 поддерживает **только 2.4 GHz** (не 5 GHz)
- Открыть Serial Monitor (9600 бод) — посмотреть вывод "Connecting..."
- Если 50 точек без подключения — сеть недоступна

### Данные не приходят на сервер

- Проверить что ESP8266 подключена к WiFi ("WiFi connected" в Serial Monitor)
- Проверить API: `curl http://109.73.206.169/health`
- Проверить доступность данных: `curl http://109.73.206.169/get_data`
- Проверить что концевики срабатывают (данные отправляются при **отпускании** концевика)
- Проверить соединение Arduino ↔ ESP8266 (провода TX/RX)
- Проверить локально `curl -X POST http://109.73.206.169/save \
  -H "Content-Type: application/json" \
  -d '{"name":"Иванов С.М.","model":"Samsung","charge":"85%","connection_time":"14:30","disconnection_time":"15:45"}'`. Если в `/get_data` отображается приход данных, то проверить в коде `arduino`, что отправка запроса не содержит порта `:500x`

### Сайт не открывается

- Проверить статус сервиса: `sudo systemctl status phonedeck`
- Проверить логи: `sudo journalctl -u phonedeck -f`
- Перезапустить: `sudo systemctl restart phonedeck`
- Проверить nginx: `sudo systemctl status nginx`

### Arduino IDE не видит плату

- Проверить что кабель поддерживает передачу данных (не только зарядку)
- Проверить драйвер CP2102: `ls /dev/cu.usb*`
- Перезагрузить Arduino IDE после установки плат/библиотек

### Ошибка "programmer is not responding"

- Выбрана неправильная плата в Tools → Board
- `/dev/cu.usbserial-*` — это ESP8266 (CP2102)
- `/dev/cu.usbmodem-*` — это Arduino Uno
