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
        "INSERT INTO tasks(title,type,due_date) VALUES (?,?,?)",
        (title, task_type, due_date)
    )
    conn.commit()


def get_tasks():
    cursor.execute(
        "SELECT * FROM tasks"
    )
    return cursor.fetchall()


def delete_task(task_id):

    cursor.execute(
        "DELETE FROM tasks WHERE id=?",
        (task_id,)
    )

    conn.commit()