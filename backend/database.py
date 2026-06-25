import sqlite3

conn = sqlite3.connect("hami.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    type TEXT,
    due_date TEXT
)
""")
conn.commit()


def add_task(title, task_type, due_date):
    cursor.execute(
        "INSERT INTO tasks(title, type, due_date) VALUES (?, ?, ?)",
        (title, task_type, due_date)
    )
    conn.commit()
    return cursor.lastrowid


def get_tasks():
    cursor.execute("SELECT * FROM tasks ORDER BY due_date ASC")
    return cursor.fetchall()


def get_tasks_for_date(date_str: str):
    cursor.execute(
        "SELECT * FROM tasks WHERE due_date = ? ORDER BY id ASC",
        (date_str,)
    )
    return cursor.fetchall()


def get_tasks_by_type(task_type: str):
    cursor.execute(
        "SELECT * FROM tasks WHERE type = ? ORDER BY due_date ASC",
        (task_type,)
    )
    return cursor.fetchall()


def search_tasks(query: str):
    like = f"%{query}%"
    cursor.execute(
        "SELECT * FROM tasks WHERE title LIKE ? OR type LIKE ? OR due_date LIKE ? ORDER BY due_date ASC",
        (like, like, like)
    )
    return cursor.fetchall()


def delete_task(task_id):
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()


def update_task_date(task_id, new_date):
    cursor.execute(
        "UPDATE tasks SET due_date = ? WHERE id = ?",
        (new_date, task_id)
    )
    conn.commit()


def update_task(task_id, title, task_type, due_date):
    cursor.execute(
        "UPDATE tasks SET title = ?, type = ?, due_date = ? WHERE id = ?",
        (title, task_type, due_date, task_id)
    )
    conn.commit()


def get_all_task_dates():
    """Return list of all unique dates that have tasks"""
    cursor.execute("SELECT DISTINCT due_date FROM tasks")
    return [row[0] for row in cursor.fetchall()]


# ── Reminders table & helpers ─────────────────────────────────
cursor.execute("""
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    remind_at TEXT,
    sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
""")
conn.commit()


def add_reminder(task_id: int, remind_at: str):
    cursor.execute(
        "INSERT INTO reminders(task_id, remind_at) VALUES (?, ?)",
        (task_id, remind_at)
    )
    conn.commit()


def get_due_reminders(now_iso: str):
    cursor.execute(
        "SELECT r.id, r.task_id, r.remind_at, r.sent, t.title FROM reminders r LEFT JOIN tasks t ON r.task_id = t.id WHERE r.sent = 0 AND r.remind_at <= ? ORDER BY r.remind_at ASC",
        (now_iso,)
    )
    return cursor.fetchall()


def mark_reminder_sent(reminder_id: int):
    cursor.execute("UPDATE reminders SET sent = 1 WHERE id = ?", (reminder_id,))
    conn.commit()


def get_all_reminders():
    cursor.execute("SELECT r.id, r.task_id, r.remind_at, r.sent, t.title FROM reminders r LEFT JOIN tasks t ON r.task_id = t.id ORDER BY r.remind_at ASC")
    return cursor.fetchall()


def delete_reminder(reminder_id: int):
    cursor.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
    conn.commit()


def get_reminders_for_task(task_id: int):
    cursor.execute("SELECT * FROM reminders WHERE task_id = ? ORDER BY remind_at ASC", (task_id,))
    return cursor.fetchall()