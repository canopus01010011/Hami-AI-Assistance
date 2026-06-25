from fastapi import FastAPI
from pydantic import BaseModel
from ai import get_hami_response
from fastapi.middleware.cors import CORSMiddleware
from database import add_task, get_tasks, delete_task

app = FastAPI()

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


# =====================
# AI CHAT
# =====================

@app.post("/chat")
def chat(req: ChatRequest):
    response = get_hami_response(req.message)
    return response


# =====================
# TASKS
# =====================

@app.get("/tasks")
def get_all_tasks():
    return get_tasks()


@app.post("/task")
def create_task(task: TaskRequest):

    add_task(
        task.title,
        task.type,
        task.due_date
    )

    return {
        "success": True
    }