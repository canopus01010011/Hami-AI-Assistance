import os
import requests
from dotenv import load_dotenv
from pathlib import Path

from database import add_task, get_tasks

load_dotenv(Path(__file__).resolve().parent / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")


def extract_task(message: str):

    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key={API_KEY}"

    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"""
Extract task information.

Return ONLY JSON.

Example:

User:
I have Hami project deadline on 30 June 2026

Output:

{{
    "title":"Hami project",
    "type":"project",
    "due_date":"30 June 2026"
}}

User:
{message}
"""
                    }
                ]
            }
        ]
    }

    try:

        res = requests.post(
            url,
            json=data,
            headers=headers,
            timeout=20
        )

        return res.json()

    except:
        return None

def detect_intent(message: str):

    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key={API_KEY}"

    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"""
You are an intent classifier.

Possible intents:

ADD_TASK
GET_TASKS
DELETE_TASK
NORMAL_CHAT

Examples:

"I have an exam next week"
-> ADD_TASK

"My project deadline is June 30"
-> ADD_TASK

"What deadlines do I have?"
-> GET_TASKS

"Show my tasks"
-> GET_TASKS

"Delete my math exam"
-> DELETE_TASK

"What is the capital of Japan?"
-> NORMAL_CHAT

User:
{message}

Return ONLY the intent.
"""
                    }
                ]
            }
        ]
    }

    try:
        res = requests.post(
            url,
            json=data,
            headers=headers
        )

        result = res.json()

        intent = result["candidates"][0]["content"]["parts"][0]["text"]

        return intent.strip()

    except Exception:
        return "NORMAL_CHAT"


def get_hami_response(message: str):

    intent = detect_intent(message)

    print("Intent:", intent)

    # -------------------------
    # GET TASKS
    # -------------------------
    if intent == "GET_TASKS":

        tasks = get_tasks()

        if len(tasks) == 0:
            return {
                "reply": "🐹 You don't have any tasks yet!",
                "mood": "idle"
            }

        text = "🐹 Here are your tasks:\n\n"

        for task in tasks:
            text += f"• {task}\n"

        return {
            "reply": text,
            "mood": "working"
        }

    # -------------------------
    # ADD TASK
    # -------------------------
    if intent == "ADD_TASK":

        task_data = extract_task(message)

        print(task_data)

        return {
            "reply": "🐹 Task detected!",
            "mood": "working"
        }

    # -------------------------
    # DELETE TASK
    # -------------------------
    if intent == "DELETE_TASK":

        return {
            "reply": "🐹 Delete task feature coming soon!",
            "mood": "warning"
        }

    # -------------------------
    # NORMAL CHAT
    # -------------------------
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={API_KEY}"

    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"""
You are Hami 🐹, a cute hamster AI assistant.

Be friendly, helpful, and slightly cute.

User: {message}
"""
                    }
                ]
            }
        ]
    }

    try:

        res = requests.post(
            url,
            json=data,
            headers=headers
        )

        result = res.json()

        reply = result["candidates"][0]["content"]["parts"][0]["text"]

        return {
            "reply": reply,
            "mood": "idle"
        }

    except Exception:

        return {
            "reply": f"🐹 Error: {res.text}",
            "mood": "warning"
        }