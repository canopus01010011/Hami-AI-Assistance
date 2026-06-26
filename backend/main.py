from fastapi import FastAPI
from pydantic import BaseModel
try:
    from backend.ai import get_hami_response
except ImportError:
    from ai import get_hami_response
from fastapi.middleware.cors import CORSMiddleware
try:
    from backend.database import add_task, get_tasks, delete_task, get_tasks_for_date, get_tasks_by_type, search_tasks, get_all_task_dates, update_task_date, update_task
    from backend.database import add_reminder, get_due_reminders, mark_reminder_sent, get_all_reminders, delete_reminder
except ImportError:
    from database import add_task, get_tasks, delete_task, get_tasks_for_date, get_tasks_by_type, search_tasks, get_all_task_dates, update_task_date
    from database import add_reminder, get_due_reminders, mark_reminder_sent, get_all_reminders, delete_reminder
import threading
from datetime import datetime, timezone
from fastapi.staticfiles import StaticFiles
import os

# In-memory recent notifications queue (cleared on read)
recent_notifications: list[dict] = []

app = FastAPI()

os.makedirs("audio", exist_ok=True)

app.mount("/audio", StaticFiles(directory="audio"), name="audio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class TaskRequest(BaseModel):
    title: str
    type: str
    due_date: str


class UpdateDateRequest(BaseModel):
    task_id: int
    new_date: str


class ReminderRequest(BaseModel):
    task_id: int
    remind_at: str


# ── AI CHAT ───────────────────────────────────────────────────────

@app.post("/chat")
def chat(req: ChatRequest):
    return get_hami_response(req.message)


# ── TASKS ─────────────────────────────────────────────────────────

@app.get("/tasks")
def get_all_tasks():
    tasks = get_tasks()
    return [{"id": t[0], "title": t[1], "type": t[2], "due_date": t[3]} for t in tasks]


@app.get("/tasks/dates")
def get_task_dates():
    """Returns all dates that have at least one task — for calendar highlighting"""
    return get_all_task_dates()


@app.get("/tasks/date/{date_str}")
def get_tasks_on_date(date_str: str):
    tasks = get_tasks_for_date(date_str)
    return [{"id": t[0], "title": t[1], "type": t[2], "due_date": t[3]} for t in tasks]


@app.get("/tasks/type/{task_type}")
def get_tasks_by_type_route(task_type: str):
    tasks = get_tasks_by_type(task_type)
    return [{"id": t[0], "title": t[1], "type": t[2], "due_date": t[3]} for t in tasks]


@app.get("/tasks/search")
def get_tasks_search(q: str):
    tasks = search_tasks(q)
    return [{"id": t[0], "title": t[1], "type": t[2], "due_date": t[3]} for t in tasks]


@app.post("/task")
def create_task(task: TaskRequest):
    tid = add_task(task.title, task.type, task.due_date)
    return {"success": True, "id": tid}


@app.delete("/task/{task_id}")
def remove_task(task_id: int):
    delete_task(task_id)
    return {"success": True}


@app.patch("/task/date")
def reschedule_task(req: UpdateDateRequest):
    update_task_date(req.task_id, req.new_date)
    return {"success": True}


@app.patch("/task/{task_id}")
def edit_task(task_id: int, task: TaskRequest):
    update_task(task_id, task.title, task.type, task.due_date)
    return {"success": True}


@app.post("/reminder")
def create_reminder(r: ReminderRequest):
    add_reminder(r.task_id, r.remind_at)
    return {"success": True}


@app.get("/reminders")
def list_reminders():
    items = get_all_reminders()
    return [{"id": r[0], "task_id": r[1], "remind_at": r[2], "sent": bool(r[3]), "title": r[4]} for r in items]


@app.delete("/reminder/{reminder_id}")
def remove_reminder(reminder_id: int):
    delete_reminder(reminder_id)
    return {"success": True}


@app.get("/notifications")
def get_notifications():
    # return and clear
    global recent_notifications
    out = recent_notifications.copy()
    recent_notifications = []
    return out


def reminder_worker(poll_interval: int = 30):
    """Background thread that checks for due reminders and pushes notifications."""
    while True:
        now_iso = datetime.now(timezone.utc).astimezone().isoformat()
        due = get_due_reminders(now_iso)
        if due:
            for r in due:
                rid, task_id, remind_at, sent, title = r
                # mark sent
                mark_reminder_sent(rid)
                recent_notifications.append({
                    "reminder_id": rid,
                    "task_id": task_id,
                    "title": title,
                    "remind_at": remind_at,
                })
        try:
            import time
            time.sleep(poll_interval)
        except KeyboardInterrupt:
            break


# Start background reminder worker thread
thread = threading.Thread(target=reminder_worker, daemon=True)
thread.start()