import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEVICES_DB_PATH = os.path.join(BASE_DIR, "devices.db")
USERS_DB_PATH = os.path.join(BASE_DIR, "users.db")

build_dir = os.path.join(BASE_DIR, "build")
static_folder_path = os.path.join(build_dir, "static")

app = Flask(
    __name__,
    static_folder=static_folder_path if os.path.isdir(static_folder_path) else None,
)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-in-production")
CORS(app)

AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 14  # 14 days

# Встроенная учётная запись администратора (создаётся/обновляется при старте сервера)
DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "adminkabphonedeck"


def _token_serializer():
    return URLSafeTimedSerializer(app.secret_key, salt="phonedeck-auth-v1")


def create_auth_token(user_id: int, username: str) -> str:
    return _token_serializer().dumps({"uid": user_id, "u": username})


def verify_auth_token(token: str):
    try:
        return _token_serializer().loads(token, max_age=AUTH_TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None


def get_devices_db_connection():
    conn = sqlite3.connect(DEVICES_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_users_db_connection():
    conn = sqlite3.connect(USERS_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_users_schema():
    conn = get_users_db_connection()
    try:
        c = conn.cursor()
        c.execute("PRAGMA table_info(users)")
        cols = {r[1] for r in c.fetchall()}
        if "is_admin" not in cols:
            c.execute(
                "ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"
            )
            conn.commit()
    finally:
        conn.close()


def _is_builtin_admin_username(username: str) -> bool:
    return (username or "").strip().lower() == DEFAULT_ADMIN_USERNAME.lower()


def ensure_builtin_admin():
    """Всегда есть пользователь admin с паролем по умолчанию и правами администратора."""
    password_hash = generate_password_hash(DEFAULT_ADMIN_PASSWORD)
    conn = get_users_db_connection()
    try:
        c = conn.cursor()
        c.execute(
            "SELECT id FROM users WHERE LOWER(username) = LOWER(?)",
            (DEFAULT_ADMIN_USERNAME,),
        )
        row = c.fetchone()
        if row:
            c.execute(
                """
                UPDATE users
                SET username = ?, password_hash = ?, is_admin = 1
                WHERE id = ?
                """,
                (DEFAULT_ADMIN_USERNAME, password_hash, row["id"]),
            )
        else:
            c.execute(
                """
                INSERT INTO users (username, password_hash, last_name, first_name, patronymic, phone_model, is_admin)
                VALUES (?, ?, ?, ?, ?, ?, 1)
                """,
                (
                    DEFAULT_ADMIN_USERNAME,
                    password_hash,
                    "Администратор",
                    "Системный",
                    "—",
                    "—",
                ),
            )
        conn.commit()
    finally:
        conn.close()


def ensure_admin_account():
    """Доп. администратор из PHONEDECK_* (логин не должен совпадать с встроенным admin)."""
    admin_user = (os.environ.get("PHONEDECK_ADMIN_USERNAME") or "").strip()
    admin_pass = os.environ.get("PHONEDECK_ADMIN_PASSWORD") or ""
    if not admin_user or not admin_pass or len(admin_pass) < 6:
        return
    if admin_user.lower() == DEFAULT_ADMIN_USERNAME.lower():
        return
    password_hash = generate_password_hash(admin_pass)
    conn = get_users_db_connection()
    try:
        c = conn.cursor()
        c.execute("SELECT id FROM users WHERE username = ?", (admin_user,))
        row = c.fetchone()
        if row:
            c.execute(
                "UPDATE users SET password_hash = ?, is_admin = 1 WHERE id = ?",
                (password_hash, row["id"]),
            )
        else:
            c.execute(
                """
                INSERT INTO users (username, password_hash, last_name, first_name, patronymic, phone_model, is_admin)
                VALUES (?, ?, ?, ?, ?, ?, 1)
                """,
                (
                    admin_user,
                    password_hash,
                    "Администратор",
                    "Системный",
                    "—",
                    "—",
                ),
            )
        conn.commit()
    finally:
        conn.close()


def create_table():
    # devices.db
    devices_conn = get_devices_db_connection()
    try:
        c = devices_conn.cursor()
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                model TEXT NOT NULL,
                charge TEXT NOT NULL,
                connection_time TEXT NOT NULL,
                disconnection_time TEXT NOT NULL
            )
            """
        )
        devices_conn.commit()
    finally:
        devices_conn.close()

    # users.db
    users_conn = get_users_db_connection()
    try:
        c = users_conn.cursor()
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                last_name TEXT NOT NULL,
                first_name TEXT NOT NULL,
                patronymic TEXT NOT NULL,
                phone_model TEXT NOT NULL
            )
            """
        )
        users_conn.commit()
    finally:
        users_conn.close()

    _ensure_users_schema()
    ensure_builtin_admin()
    ensure_admin_account()


def _row_user_public(row):
    keys = row.keys()
    is_admin = bool(int(row["is_admin"] or 0)) if "is_admin" in keys else False
    return {
        "id": row["id"],
        "username": row["username"],
        "last_name": row["last_name"],
        "first_name": row["first_name"],
        "patronymic": row["patronymic"],
        "phone_model": row["phone_model"],
        "is_admin": is_admin,
    }


def _get_user_by_id(conn, user_id: int):
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    return c.fetchone()


def _auth_user_from_request():
    auth = request.headers.get("Authorization", "") or ""
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:].strip()
    if not token:
        return None
    payload = verify_auth_token(token)
    if not payload or "uid" not in payload:
        return None
    conn = get_users_db_connection()
    try:
        row = _get_user_by_id(conn, int(payload["uid"]))
        return row
    finally:
        conn.close()


def _require_auth():
    row = _auth_user_from_request()
    if not row:
        return None, (jsonify({"error": "Требуется вход"}), 401)
    return row, None


def _require_admin():
    row, err = _require_auth()
    if err is not None:
        return None, err
    if not int(row["is_admin"] or 0):
        return None, (jsonify({"error": "Недостаточно прав"}), 403)
    return row, None


@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    last_name = (data.get("last_name") or "").strip()
    first_name = (data.get("first_name") or "").strip()
    patronymic = (data.get("patronymic") or "").strip()
    phone_model = (data.get("phone_model") or "").strip()

    if not username or not password:
        return jsonify({"error": "Укажите логин и пароль"}), 400
    if _is_builtin_admin_username(username):
        return jsonify({"error": "Логин зарезервирован для системного администратора"}), 409
    if len(password) < 6:
        return jsonify({"error": "Пароль не короче 6 символов"}), 400
    if not last_name or not first_name or not patronymic:
        return jsonify({"error": "Заполните фамилию, имя и отчество"}), 400
    if not phone_model:
        return jsonify({"error": "Укажите модель телефона"}), 400

    password_hash = generate_password_hash(password)
    conn = get_users_db_connection()
    try:
        c = conn.cursor()
        c.execute(
            """
            INSERT INTO users (username, password_hash, last_name, first_name, patronymic, phone_model)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (username, password_hash, last_name, first_name, patronymic, phone_model),
        )
        conn.commit()
        user_id = c.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({"error": "Такой логин уже занят"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    token = create_auth_token(user_id, username)
    conn = get_users_db_connection()
    try:
        row = _get_user_by_id(conn, user_id)
        user = _row_user_public(row)
    finally:
        conn.close()
    return jsonify({"token": token, "user": user}), 201


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return jsonify({"error": "Укажите логин и пароль"}), 400

    conn = get_users_db_connection()
    try:
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = c.fetchone()
    finally:
        conn.close()

    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Неверный логин или пароль"}), 401

    token = create_auth_token(row["id"], row["username"])
    return jsonify({"token": token, "user": _row_user_public(row)})


@app.route("/api/me", methods=["GET"])
def api_me():
    row = _auth_user_from_request()
    if not row:
        return jsonify({"error": "Требуется вход"}), 401
    return jsonify({"user": _row_user_public(row)})


@app.route("/api/me", methods=["PATCH"])
def api_me_patch():
    row, err = _require_auth()
    if err is not None:
        return err
    data = request.get_json(silent=True) or {}

    last_name = (data.get("last_name") if "last_name" in data else row["last_name"])
    first_name = (data.get("first_name") if "first_name" in data else row["first_name"])
    patronymic = (data.get("patronymic") if "patronymic" in data else row["patronymic"])
    phone_model = (data.get("phone_model") if "phone_model" in data else row["phone_model"])
    new_username = (data.get("username") or "").strip() if "username" in data else None

    last_name = (last_name or "").strip()
    first_name = (first_name or "").strip()
    patronymic = (patronymic or "").strip()
    phone_model = (phone_model or "").strip()

    if not last_name or not first_name or not patronymic:
        return jsonify({"error": "Заполните фамилию, имя и отчество"}), 400
    if not phone_model:
        return jsonify({"error": "Укажите модель телефона"}), 400

    username = row["username"]
    if new_username is not None:
        if not new_username:
            return jsonify({"error": "Логин не может быть пустым"}), 400
        if _is_builtin_admin_username(row["username"]) and not _is_builtin_admin_username(
            new_username
        ):
            return jsonify({"error": "Нельзя сменить логин встроенного администратора"}), 400
        if not _is_builtin_admin_username(row["username"]) and _is_builtin_admin_username(
            new_username
        ):
            return jsonify({"error": "Логин зарезервирован"}), 409
        username = new_username

    new_password = data.get("new_password") or ""
    current_password = data.get("current_password") or ""
    password_hash = row["password_hash"]
    if new_password:
        if len(new_password) < 6:
            return jsonify({"error": "Новый пароль не короче 6 символов"}), 400
        if not current_password or not check_password_hash(
            row["password_hash"], current_password
        ):
            return jsonify({"error": "Неверный текущий пароль"}), 400
        password_hash = generate_password_hash(new_password)

    conn = get_users_db_connection()
    try:
        c = conn.cursor()
        c.execute(
            """
            UPDATE users
            SET username = ?, password_hash = ?, last_name = ?, first_name = ?, patronymic = ?, phone_model = ?
            WHERE id = ?
            """,
            (
                username,
                password_hash,
                last_name,
                first_name,
                patronymic,
                phone_model,
                row["id"],
            ),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "Такой логин уже занят"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    conn = get_users_db_connection()
    try:
        updated = _get_user_by_id(conn, row["id"])
        user = _row_user_public(updated)
    finally:
        conn.close()

    new_token = None
    if username != row["username"]:
        new_token = create_auth_token(row["id"], username)
    return jsonify({"user": user, "token": new_token})


@app.route("/api/admin/users", methods=["GET"])
def api_admin_users():
    _, err = _require_admin()
    if err is not None:
        return err
    conn = get_users_db_connection()
    try:
        c = conn.cursor()
        c.execute(
            """
            SELECT id, username, last_name, first_name, patronymic, phone_model, is_admin
            FROM users ORDER BY id
            """
        )
        rows = c.fetchall()
    finally:
        conn.close()
    users = [_row_user_public(r) for r in rows]
    return jsonify({"users": users})


def _parse_bool_admin(val):
    if val is True or val == 1:
        return True
    if val is False or val == 0:
        return False
    if isinstance(val, str):
        low = val.strip().lower()
        if low in ("true", "1", "yes"):
            return True
        if low in ("false", "0", "no"):
            return False
    return None


@app.route("/api/admin/users/<int:user_id>/role", methods=["PATCH"])
def api_admin_user_role(user_id):
    _, err = _require_admin()
    if err is not None:
        return err
    data = request.get_json(silent=True) or {}
    if "is_admin" not in data:
        return jsonify({"error": "Укажите поле is_admin (true или false)"}), 400
    is_admin_new = _parse_bool_admin(data.get("is_admin"))
    if is_admin_new is None:
        return jsonify({"error": "Некорректное значение is_admin"}), 400

    conn = get_users_db_connection()
    try:
        c = conn.cursor()
        c.execute(
            "SELECT id, username, is_admin FROM users WHERE id = ?",
            (user_id,),
        )
        target = c.fetchone()
        if not target:
            return jsonify({"error": "Пользователь не найден"}), 404
        if _is_builtin_admin_username(target["username"]) and not is_admin_new:
            return (
                jsonify(
                    {
                        "error": "Нельзя снять права администратора с встроенной учётной записи admin"
                    }
                ),
                400,
            )
        c.execute(
            "UPDATE users SET is_admin = ? WHERE id = ?",
            (1 if is_admin_new else 0, user_id),
        )
        conn.commit()
        c.execute(
            """
            SELECT id, username, last_name, first_name, patronymic, phone_model, is_admin
            FROM users WHERE id = ?
            """,
            (user_id,),
        )
        updated = c.fetchone()
    finally:
        conn.close()

    return jsonify({"user": _row_user_public(updated)})


@app.route("/api/admin/health/databases", methods=["GET"])
def api_admin_health_databases():
    _, err = _require_admin()
    if err is not None:
        return err

    def check_db(label, path, get_conn, count_sql):
        entry = {
            "id": label,
            "path": path,
            "ok": False,
            "message": "",
        }
        try:
            if not os.path.isfile(path):
                entry["message"] = "Файл базы не найден"
                return entry
            conn = get_conn()
            try:
                cur = conn.cursor()
                cur.execute(count_sql)
                n = cur.fetchone()[0]
                entry["ok"] = True
                entry["message"] = "Подключение и запрос выполнены успешно"
                entry["row_count"] = int(n)
            finally:
                conn.close()
        except Exception as e:
            entry["message"] = str(e)
        return entry

    databases = [
        check_db(
            "users",
            USERS_DB_PATH,
            get_users_db_connection,
            "SELECT COUNT(*) FROM users",
        ),
        check_db(
            "devices",
            DEVICES_DB_PATH,
            get_devices_db_connection,
            "SELECT COUNT(*) FROM devices",
        ),
    ]
    return jsonify({"databases": databases})


@app.route("/save", methods=["POST"])
def save_data():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = data.get("name")
    model = data.get("model")
    charge = data.get("charge")
    connection_time = data.get("connection_time")
    disconnection_time = data.get("disconnection_time")

    if not name or not model or not charge or not connection_time or not disconnection_time:
        return jsonify({"error": "Missing required data"}), 400

    try:
        conn = get_devices_db_connection()
        c = conn.cursor()
        c.execute(
            """
            INSERT INTO devices (name, model, charge, connection_time, disconnection_time)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name, model, charge, connection_time, disconnection_time),
        )
        conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    return jsonify({"message": "Data saved successfully"}), 201


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/get_data", methods=["GET"])
def get_data():
    conn = get_devices_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM devices")
    rows = c.fetchall()
    conn.close()
    devices = [dict(row) for row in rows]
    return jsonify(devices)


@app.route("/")
def serve_index():
    index_path = os.path.join(build_dir, "index.html")
    if not os.path.exists(index_path):
        return "Error: index.html not found in build directory!", 404
    return send_from_directory(build_dir, "index.html")


@app.route("/<path:path>")
def serve_react_app(path):
    path_in_build = os.path.join(build_dir, path)
    if path != "" and os.path.exists(path_in_build):
        return send_from_directory(build_dir, path)
    index_path = os.path.join(build_dir, "index.html")
    if not os.path.exists(index_path):
        return "Error: index.html not found in build directory!", 404
    return send_from_directory(build_dir, "index.html")


create_table()

if __name__ == "__main__":
    if os.path.isdir(build_dir) and os.path.exists(os.path.join(build_dir, "index.html")):
        print(f"Serving React app from '{build_dir}'")
    else:
        print("No full 'build' yet — API: /health, /get_data, /save")
        print("Full site: cd frontend && npm run build, then copy frontend\\build to .\\build")
    app.run(host="0.0.0.0", port=5000, debug=True)
