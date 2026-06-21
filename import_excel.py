"""
One-time import script: reads an Excel file and inserts records into hsc_records.db
Usage: python import_excel.py <path_to_excel_file>
       python import_excel.py "yourfile.xlsx" --header 1
"""

import sqlite3
import pandas as pd
import sys
import os
import argparse

DB_PATH = os.path.join(os.path.dirname(__file__), "backend", "hsc_records.db")

POSSIBLE_HEADER_ROWS = [0, 1, 2, 3]


def create_table(conn):
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
    # Migrate old schema if needed
    existing = [row[1] for row in conn.execute("PRAGMA table_info(hsc_records)").fetchall()]
    for col, coltype in [("phone", "TEXT"), ("cast", "TEXT"), ("pronounce", "TEXT")]:
        if col not in existing:
            conn.execute(f"ALTER TABLE hsc_records ADD COLUMN {col} {coltype}")
    conn.commit()


def find_best_header_row(file_path):
    best_row = 0
    best_score = -1
    for row in POSSIBLE_HEADER_ROWS:
        try:
            df = pd.read_excel(file_path, header=row, nrows=3, dtype=str)
            named = sum(1 for c in df.columns if "UNNAMED" not in str(c).upper())
            print(f"  [try row {row}] columns: {list(df.columns)[:7]}  → named={named}")
            if named > best_score:
                best_score = named
                best_row = row
        except Exception:
            pass
    return best_row


def build_col_map(df_columns):
    """
    Map our internal field names to actual Excel column names.
    Skips any 'Unnamed' columns (empty index columns).
    """
    cols_upper = [str(c).strip().upper() for c in df_columns]
    original   = list(df_columns)

    def find(*keywords):
        for kw in keywords:
            for i, c in enumerate(cols_upper):
                if "UNNAMED" in c:
                    continue
                if kw in c:
                    return original[i]
        return None

    return {
        "HSC":     find("HSC"),
        "NAME":    find("NAME", "CONSUMER", "CUSTOMER", "CUST"),
        "VILLAGE": find("VILLAGE", "TOWN", "PANCHAYAT", "GRAM"),
        "ADDRESS": find("ADDRESS", "ADDR", "DOOR", "FLAT", "HOUSE"),
        "AGL":     find("AGL", "RELATED", "LINKED"),
        "PHONE":   find("PHONE", "MOBILE", "CONTACT", "MOB", "PH"),
        "CAST":    find("CAST", "CASTE", "CATEGORY", "CAT"),
        "PRONOUNCE": find("PRONOUNCE", "AUDIO", "VOICE"),
        "REMARKS": find("REMARK", "NOTE", "COMMENT", "REASON"),
    }


def import_excel(file_path: str, header_row: int = None):
    if not os.path.exists(file_path):
        print(f"[ERROR] File not found: {file_path}")
        sys.exit(1)

    print(f"\n[INFO] Reading Excel file: {file_path}")

    if header_row is None:
        print("[INFO] Auto-detecting header row...")
        header_row = find_best_header_row(file_path)
        print(f"[INFO] Best header row detected: row {header_row} (0-indexed)")
    else:
        print(f"[INFO] Using header row: {header_row} (0-indexed)")

    df = pd.read_excel(file_path, header=header_row, dtype=str)
    df.columns = [str(c).strip() for c in df.columns]

    print(f"\n[INFO] Columns found: {list(df.columns)}")
    print(f"[INFO] Total rows: {len(df)}")

    col_map = build_col_map(df.columns)
    print("\n[INFO] Column mapping:")
    for k, v in col_map.items():
        status = "=> '" + str(v) + "'" if v else "=> (not found)"
        print(f"  {k:10s} {status}")

    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    create_table(conn)

    inserted = 0
    skipped  = 0

    for _, row in df.iterrows():
        def get(key):
            col = col_map.get(key)
            if col and col in row and pd.notna(row[col]):
                val = str(row[col]).strip()
                return val if val not in ("", "nan", "None") else ""
            return ""

        hsc     = get("HSC")
        name    = get("NAME")
        village = get("VILLAGE")
        address = get("ADDRESS")
        agl     = get("AGL")
        phone   = get("PHONE")
        cast    = get("CAST")
        pronounce = get("PRONOUNCE")
        remarks = get("REMARKS")

        # Skip completely empty rows
        if not any([hsc, name, village, address]):
            skipped += 1
            continue

        conn.execute(
            """INSERT INTO hsc_records
               (hsc, name, village, address, agl, phone, cast, pronounce, remarks)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (hsc, name, village, address, agl, phone, cast, pronounce, remarks)
        )
        inserted += 1

    conn.commit()
    conn.close()

    print(f"\n[SUCCESS] Inserted {inserted} records. Skipped {skipped} empty rows.")
    print(f"[INFO] Database saved at: {DB_PATH}")

    if inserted == 0:
        print("\n[HINT] Try: python import_excel.py yourfile.xlsx --header 0  (or 1, 2...)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import Excel into HSC SQLite DB")
    parser.add_argument("file", nargs="?", help="Path to Excel file")
    parser.add_argument("--header", type=int, default=None,
                        help="Row index (0-based) containing column headers")
    args = parser.parse_args()

    if args.file:
        excel_file = args.file.strip('"')
    else:
        excel_file = input("Enter path to Excel file: ").strip().strip('"')

    import_excel(excel_file, header_row=args.header)
