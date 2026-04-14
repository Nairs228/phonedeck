import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "devices.db")

build_dir = os.path.join(BASE_DIR, "build")
static_folder_path = os.path.join(build_dir, "static")

app = Flask(
    __name__,
    static_folder=static_folder_path if os.path.isdir(static_folder_path) else None,
)
CORS(app)


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_table():
    conn = get_db_connection()
    c = conn.cursor()
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
    conn.commit()
    conn.close()


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
        conn = get_db_connection()
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
    conn = get_db_connection()
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
