"""Create demo accounts with realistic progress data."""

import random
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import db as store
from config import settings

FAKE_USERS = [
    {"username": "alina_tatar", "password": "tatar123", "display_name": "Алина"},
    {"username": "timur_kazan", "password": "kazan456", "display_name": "Тимур"},
    {"username": "dashulya", "password": "dashulya789", "display_name": "Дашуля"},
    {"username": "renat_bulat", "password": "bulat321", "display_name": "Ренат"},
    {"username": "kristina_tt", "password": "kristina654", "display_name": "Кристина"},
    {"username": "ilyas_tatar", "password": "ilyas987", "display_name": "Ильяс"},
    {"username": "nastya_kazan", "password": "nastya147", "display_name": "Настя"},
    {"username": "ruslan_tut", "password": "ruslan258", "display_name": "Руслан"},
]

# Correct lesson IDs from backend island data
ALL_LESSONS = [
    "salem-1", "salem-2",
    "ashamlyk-1",
    "sannar-1", "sannar-2",
    "gaila-1",
    "hayvannar-1",
    "shahar-1",
    "tabigat-1",
    "sayahet-1",
    "tosler-1",
    "vakyt-1",
]


def seed():
    store.init_db()
    print("Seeding fake accounts...")

    for u in FAKE_USERS:
        result = store.auth_register(u["username"], u["password"], u["display_name"])
        if result is None:
            print(f"  {u['username']}: already exists, skipping")
            continue
        tg_id = result["tg_id"]

        # Random realistic progress: 2-8 completed lessons
        num_lessons = random.randint(2, min(8, len(ALL_LESSONS)))
        chosen = random.sample(ALL_LESSONS, num_lessons)

        # Stagger creation times over past 2 weeks
        base_time = int(time.time()) - random.randint(86400, 14 * 86400)

        for i, lesson_id in enumerate(chosen):
            store.complete_lesson(tg_id, lesson_id)
            created = base_time + i * random.randint(3600, 86400)
            with store._lock, store._conn() as c:
                c.execute(
                    "UPDATE completions SET created_at=? WHERE tg_id=? AND lesson_id=?",
                    (created, tg_id, lesson_id),
                )

        # Set streak manually
        streak = random.randint(1, 12)
        days_ago = random.randint(0, 2)
        import datetime
        last_day = (datetime.date.today() - datetime.timedelta(days=days_ago)).isoformat()
        with store._lock, store._conn() as c:
            c.execute(
                "UPDATE users SET streak=?, last_day=? WHERE tg_id=?",
                (streak, last_day, tg_id),
            )

        profile = store.me(tg_id)
        print(f"  {u['username']}: {profile['xp']} XP, {len(profile['lessons'])} lessons, streak {profile['streak']}")

    print("\nDemo login credentials:")
    print("  Username: alina_tatar  Password: tatar123")
    print("  Username: timur_kazan  Password: kazan456")
    print("  Username: dashulya     Password: dashulya789")
    print("  Username: renat_bulat  Password: bulat321")


if __name__ == "__main__":
    seed()
