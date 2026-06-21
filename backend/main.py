from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import sqlite3
import urllib.request
import urllib.parse

from database import get_db, init_db
from models import HSCRecord

app = FastAPI(title="HSC Records API", version="1.0.0")

# Allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
def root():
    return {"message": "HSC Records API is running"}


@app.get("/search", response_model=List[HSCRecord])
def search_hsc(
    q: str = Query(..., min_length=1, description="Last digits of number"),
    search_type: str = Query("hsc", description="Type of search: hsc or agl"),
    db: sqlite3.Connection = Depends(get_db),
):
    """
    Search HSC records where the number ends with the given digits.
    """
    q = q.strip()
    pattern = f"%{q}"  # ends-with pattern using LIKE
    
    if search_type == "agl":
        cursor = db.execute(
            "SELECT * FROM hsc_records WHERE agl LIKE ? ORDER BY id",
            (pattern,),
        )
    else:
        cursor = db.execute(
            "SELECT * FROM hsc_records WHERE hsc LIKE ? ORDER BY id",
            (pattern,),
        )
    rows = cursor.fetchall()
    return [dict(row) for row in rows]


@app.get("/record/{record_id}", response_model=HSCRecord)
def get_record(record_id: int, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute(
        "SELECT * FROM hsc_records WHERE id = ?", (record_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Record not found")
    return dict(row)


@app.get("/stats")
def get_stats(db: sqlite3.Connection = Depends(get_db)):
    total = db.execute("SELECT COUNT(*) FROM hsc_records").fetchone()[0]
    return {"total_records": total}

@app.get("/tts")
def get_tts(text: str = Query(..., description="Text to synthesize")):
    """
    Proxy Google TTS to bypass browser CORS restrictions.
    """
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={urllib.parse.quote(text)}&tl=te&client=tw-ob"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req) as response:
            audio_data = response.read()
        return Response(content=audio_data, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
