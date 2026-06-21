import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "hsc_records.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS hsc_records (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            hsc     TEXT,
            name    TEXT,
            village TEXT,
            address TEXT,
            agl     TEXT,
            phone   TEXT,
            cast    TEXT,
            pronounce TEXT,
            remarks TEXT
        )
    """)
    # Add columns if upgrading from old schema
    existing = [row[1] for row in conn.execute("PRAGMA table_info(hsc_records)").fetchall()]
    for col, coltype in [("phone", "TEXT"), ("cast", "TEXT"), ("pronounce", "TEXT")]:
        if col not in existing:
            conn.execute(f"ALTER TABLE hsc_records ADD COLUMN {col} {coltype}")
    conn.commit()
    conn.close()
