"""SQLite-хранилище: пользователи (TG ID), прогресс, сердца.

Таблицы:
  users(tg_id TEXT PK, first_name, username, xp, streak, last_day, hearts, hearts_at, created_at)
  completions(tg_id, lesson_id, created_at, PK(tg_id, lesson_id))
  auth_users(id INTEGER PK, username TEXT UNIQUE, password_hash, display_name, created_at)
"""

from __future__ import annotations

import bcrypt
import jwt
import sqlite3
import threading
import time
from pathlib import Path

from config import settings

MAX_HEARTS = 5
HEART_REGEN_SEC = 20 * 60  # +1 сердце раз в 20 минут
XP_PER_LESSON = 20

_lock = threading.Lock()


def _path() -> Path:
    p = Path(getattr(settings, "db_file", "data/app.db"))
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(str(_path()))
    c.row_factory = sqlite3.Row
    return c


def init_db() -> None:
    with _lock, _conn() as c:
        c.execute(
            """CREATE TABLE IF NOT EXISTS users(
              tg_id TEXT PRIMARY KEY, first_name TEXT DEFAULT '',
              username TEXT DEFAULT '', xp INTEGER DEFAULT 0,
              streak INTEGER DEFAULT 0, last_day TEXT DEFAULT '',
              hearts INTEGER DEFAULT 5, hearts_at INTEGER DEFAULT 0,
              created_at INTEGER DEFAULT 0)"""
        )
        c.execute(
            """CREATE TABLE IF NOT EXISTS completions(
              tg_id TEXT, lesson_id TEXT, created_at INTEGER DEFAULT 0,
              PRIMARY KEY (tg_id, lesson_id))"""
        )
        c.execute(
            """CREATE TABLE IF NOT EXISTS auth_users(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              display_name TEXT DEFAULT '',
              created_at INTEGER DEFAULT 0)"""
        )


def _today() -> str:
    import datetime

    return datetime.date.today().isoformat()


def _refill(row: dict) -> dict:
    """Пассивный реген сердец по времени."""
    hearts, hearts_at = row["hearts"], row["hearts_at"] or int(time.time())
    if hearts < MAX_HEARTS:
        gain = (int(time.time()) - hearts_at) // HEART_REGEN_SEC
        if gain > 0:
            hearts = min(MAX_HEARTS, hearts + gain)
            hearts_at = hearts_at + gain * HEART_REGEN_SEC if hearts < MAX_HEARTS else int(time.time())
            with _lock, _conn() as c:
                c.execute(
                    "UPDATE users SET hearts=?, hearts_at=? WHERE tg_id=?",
                    (hearts, hearts_at, row["tg_id"]),
                )
    row["hearts"] = hearts
    row["hearts_at"] = hearts_at
    return row


def register(tg_id: str, first_name: str = "", username: str = "") -> dict:
    now = int(time.time())
    with _lock, _conn() as c:
        c.execute(
            """INSERT INTO users(tg_id, first_name, username, hearts, hearts_at, created_at)
               VALUES(?,?,?,?,?,?)
               ON CONFLICT(tg_id) DO UPDATE SET
                 first_name=excluded.first_name, username=excluded.username""",
            (tg_id, first_name, username, MAX_HEARTS, now, now),
        )
    return me(tg_id)


def me(tg_id: str) -> dict:
    with _conn() as c:
        r = c.execute("SELECT * FROM users WHERE tg_id=?", (tg_id,)).fetchone()
        if r is None:
            return register(tg_id)
        row = dict(r)
        lessons = [
            x[0]
            for x in c.execute(
                "SELECT lesson_id FROM completions WHERE tg_id=? ORDER BY created_at", (tg_id,)
            ).fetchall()
        ]
    row = _refill(row)
    row["lessons"] = lessons
    return {
        "tg_id": row["tg_id"],
        "first_name": row["first_name"],
        "username": row["username"],
        "xp": row["xp"],
        "streak": row["streak"],
        "hearts": row["hearts"],
        "lessons": lessons,
    }


def _touch_day(tg_id: str) -> None:
    today = _today()
    with _lock, _conn() as c:
        r = c.execute("SELECT streak, last_day FROM users WHERE tg_id=?", (tg_id,)).fetchone()
        if r is None:
            return
        if r["last_day"] == today:
            return
        import datetime

        y = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
        streak = r["streak"] + 1 if r["last_day"] == y else 1
        c.execute(
            "UPDATE users SET streak=?, last_day=?, hearts=?, hearts_at=? WHERE tg_id=?",
            (streak, today, MAX_HEARTS, int(time.time()), tg_id),
        )


def complete_lesson(tg_id: str, lesson_id: str) -> dict:
    _touch_day(tg_id)
    now = int(time.time())
    with _lock, _conn() as c:
        c.execute(
            "INSERT INTO completions(tg_id, lesson_id, created_at) VALUES(?,?,?) ON CONFLICT DO NOTHING",
            (tg_id, lesson_id, now),
        )
        if c.total_changes:
            c.execute("UPDATE users SET xp = xp + ? WHERE tg_id=?", (XP_PER_LESSON, tg_id))
    return me(tg_id)


def spend_heart(tg_id: str) -> dict:
    profile = me(tg_id)
    if profile["hearts"] <= 0:
        return profile
    with _lock, _conn() as c:
        c.execute(
            "UPDATE users SET hearts = hearts - 1, hearts_at=? WHERE tg_id=? AND hearts>0",
            (int(time.time()), tg_id),
        )
    return me(tg_id)


def refill_hearts(tg_id: str) -> dict:
    with _lock, _conn() as c:
        c.execute(
            "UPDATE users SET hearts=?, hearts_at=? WHERE tg_id=?",
            (MAX_HEARTS, int(time.time()), tg_id),
        )
    return me(tg_id)


def leaderboard(limit: int = 20) -> list[dict]:
    with _conn() as c:
        rows = c.execute(
            """SELECT tg_id, first_name, username, xp, streak,
                      (SELECT COUNT(*) FROM completions WHERE completions.tg_id=users.tg_id) AS lessons
               FROM users ORDER BY xp DESC, streak DESC LIMIT ?""",
            (limit,),
        ).fetchall()
    return [
        {
            "tg_id": r["tg_id"],
            "name": r["first_name"] or (f"@{r['username']}" if r["username"] else "Ученик"),
            "xp": r["xp"],
            "streak": r["streak"],
            "lessons": r["lessons"],
        }
        for r in rows
    ]


# ── Auth helpers ──────────────────────────────────────────────


def _hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def _check_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


def create_token(tg_id: str) -> str:
    return jwt.encode(
        {"sub": tg_id, "exp": int(time.time()) + settings.jwt_expire_hours * 3600},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except Exception:
        return None


def auth_register(username: str, password: str, display_name: str = "") -> dict | None:
    """Register a local user. Returns {id, username, display_name, tg_id} or None on duplicate."""
    now = int(time.time())
    hashed = _hash_password(password)
    try:
        with _lock, _conn() as c:
            c.execute(
                "INSERT INTO auth_users(username, password_hash, display_name, created_at) VALUES(?,?,?,?)",
                (username, hashed, display_name or username, now),
            )
            auth_id = c.execute("SELECT last_insert_rowid()").fetchone()[0]
            # Auto-create a linked user profile with tg_id = "auth:{id}"
            tg_id = f"auth:{auth_id}"
            c.execute(
                """INSERT INTO users(tg_id, first_name, username, hearts, hearts_at, created_at)
                   VALUES(?,?,?,?,?,?)
                   ON CONFLICT(tg_id) DO UPDATE SET first_name=excluded.first_name""",
                (tg_id, display_name or username, username, MAX_HEARTS, now, now),
            )
        return {"id": auth_id, "username": username, "display_name": display_name or username, "tg_id": f"auth:{auth_id}"}
    except sqlite3.IntegrityError:
        return None


def auth_login(username: str, password: str) -> dict | None:
    """Login. Returns {id, username, display_name, tg_id, token} or None."""
    with _conn() as c:
        r = c.execute("SELECT * FROM auth_users WHERE username=?", (username,)).fetchone()
    if r is None:
        return None
    row = dict(r)
    if not _check_password(password, row["password_hash"]):
        return None
    tg_id = f"auth:{row['id']}"
    token = create_token(tg_id)
    return {"id": row["id"], "username": row["username"], "display_name": row["display_name"], "tg_id": tg_id, "token": token}


def stats() -> dict:
    """Aggregate platform statistics."""
    with _conn() as c:
        total_users = c.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        total_lessons = c.execute("SELECT COUNT(*) FROM completions").fetchone()[0]
        active_today = c.execute(
            "SELECT COUNT(*) FROM users WHERE last_day=?", (_today(),)
        ).fetchone()[0]
        active_week = c.execute(
            "SELECT COUNT(*) FROM users WHERE last_day>=?",
            ((__import__("datetime").date.today() - __import__("datetime").timedelta(days=7)).isoformat(),),
        ).fetchone()[0]
        avg_xp = c.execute("SELECT AVG(xp) FROM users").fetchone()[0] or 0
        top_xp = c.execute("SELECT MAX(xp) FROM users").fetchone()[0] or 0
    return {
        "total_users": total_users,
        "total_lessons_completed": total_lessons,
        "active_today": active_today,
        "active_this_week": active_week,
        "average_xp": round(avg_xp),
        "top_xp": top_xp,
    }


def user_stats(tg_id: str) -> dict:
    """Per-user statistics."""
    with _conn() as c:
        completions = c.execute(
            "SELECT lesson_id, created_at FROM completions WHERE tg_id=? ORDER BY created_at", (tg_id,)
        ).fetchall()
        rank_row = c.execute(
            "SELECT COUNT(*)+1 FROM users WHERE xp > (SELECT xp FROM users WHERE tg_id=?)",
            (tg_id,),
        ).fetchone()
    lessons = [x[0] for x in completions]
    total = len(completions)
    first = completions[0]["created_at"] if completions else 0
    last = completions[-1]["created_at"] if completions else 0
    return {
        "total_lessons": total,
        "first_lesson_at": first,
        "last_lesson_at": last,
        "rank": rank_row[0] if rank_row else 0,
        "lessons": lessons,
    }


init_db()
