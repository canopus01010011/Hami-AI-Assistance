import os
import re
import json
import requests
from datetime import date, datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path
from urllib.parse import quote_plus

try:
    from backend.database import add_task, get_tasks, delete_task, get_tasks_for_date, get_tasks_by_type, search_tasks, update_task_date
except ImportError:
    from database import add_task, get_tasks, delete_task, get_tasks_for_date, get_tasks_by_type, search_tasks, update_task_date

load_dotenv(Path(__file__).resolve().parent / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1/models"
IMAGE_MODEL = "image-bison-1"
RESEARCH_MODEL = "gemini-2.5-flash"
REQUESTS_SESSION = requests.Session()


def call_gemini(prompt: str, model: str = "gemini-2.5-flash-lite") -> str | None:
    url = f"{BASE_URL}/{model}:generateContent?key={API_KEY}"
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    try:
        res = REQUESTS_SESSION.post(url, json=data, headers={"Content-Type": "application/json"}, timeout=20)
        result = res.json()
        return result["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        return None


def call_gemini_image(prompt: str, model: str = IMAGE_MODEL) -> str | None:
    url = f"{BASE_URL}/{model}:generateImage?key={API_KEY}"
    data = {
        "prompt": prompt,
        "size": "1024x1024",
    }
    try:
        res = REQUESTS_SESSION.post(url, json=data, headers={"Content-Type": "application/json"}, timeout=40)
        result = res.json()
        if isinstance(result, dict):
            if "data" in result and result["data"]:
                image_item = result["data"][0]
                return image_item.get("imageUrl") or image_item.get("url")
            if "candidates" in result and result["candidates"]:
                return result["candidates"][0].get("content")
        return None
    except Exception:
        return None


def generate_image(message: str) -> str:
    prompt = f"A cute, colorful illustration of {message} in a playful cartoon style, perfect for a friendly virtual assistant."
    image_url = call_gemini_image(prompt)
    if image_url:
        return image_url
    fallback_text = quote_plus(message[:80] or "Hami image")
    return f"https://via.placeholder.com/680x400.png?text={fallback_text}"


def perform_research(message: str) -> str:
    prompt = f"""
You are a friendly research assistant.
Answer the user clearly and directly using your knowledge.
If you do not have access to live browsing, say that and provide the best answer you can.

Question: {message}
"""
    result = call_gemini(prompt, model=RESEARCH_MODEL)
    if result:
        return result
    return "I did my best to find the answer, but I can't search the live web right now."


def detect_intent(message: str) -> str:
    low = message.lower()
    image_keywords = ["generate image", "create an image", "draw", "picture of", "show me a picture", "show me a photo", "make an image", "image of", "photo of", "draw me", "create picture", "illustration", "visualize", "image", "picture", "photo"]
    research_keywords = ["research", "look up", "find out", "search for", "search the web", "search", "google", "latest", "who is", "what is", "how does", "how do", "how can"]

    if any(k in low for k in image_keywords):
        return "GENERATE_IMAGE"
    if any(k in low for k in research_keywords) and not any(k in low for k in ["show my tasks", "show tasks", "list tasks", "what do i have", "what is on"]):
        return "RESEARCH"

    quick_add = ["remind me", "reminder", "remind", "alert me", "due", "deadline", "exam", "project", "homework", "meeting", "hangout", "competition"]
    if any(k in low for k in quick_add) and not any(k in low for k in ["show", "what", "list", "my tasks", "do i have", "what's next"]):
        return "ADD_TASK"
    if any(k in low for k in ["what do i have", "show my tasks", "what do i have on", "what is on", "list tasks", "show events", "what's next", "show deadlines", "show competitions", "show hangouts"]):
        return "GET_TASKS"
    if any(k in low for k in ["delete", "remove", "cancel"]):
        return "DELETE_TASK"
    if any(k in low for k in ["reschedule", "change", "move", "update", "postpone"]):
        return "UPDATE_TASK_DATE"

    prompt = f"""
You are an intent classifier for a personal assistant app.

Possible intents:
ADD_TASK
GET_TASKS
DELETE_TASK
UPDATE_TASK_DATE
GENERATE_IMAGE
RESEARCH
NORMAL_CHAT

User: {message}

Return ONLY the intent, nothing else.
"""
    result = call_gemini(prompt)
    return result.strip() if result else "NORMAL_CHAT"


def parse_date_text(date_text: str) -> str | None:
    low = date_text.lower().strip()
    today = date.today()

    if low in ["today", "tonight"]:
        return today.isoformat()
    if low == "tomorrow":
        return (today + timedelta(days=1)).isoformat()
    if low == "day after tomorrow":
        return (today + timedelta(days=2)).isoformat()
    if low.startswith("next "):
        weekday = low.replace("next ", "").strip()
        weekdays = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
        if weekday in weekdays:
            target = weekdays.index(weekday)
            delta = (target - today.weekday() + 7) % 7
            if delta == 0:
                delta = 7
            return (today + timedelta(days=delta)).isoformat()

    if low.startswith("this "):
        weekday = low.replace("this ", "").strip()
        weekdays = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
        if weekday in weekdays:
            target = weekdays.index(weekday)
            delta = (target - today.weekday() + 7) % 7
            if delta == 0:
                delta = 7
            return (today + timedelta(days=delta)).isoformat()

    weekdays = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
    if low in weekdays:
        target = weekdays.index(low)
        delta = (target - today.weekday() + 7) % 7
        if delta == 0:
            delta = 7
        return (today + timedelta(days=delta)).isoformat()

    for fmt in ["%Y-%m-%d", "%B %d", "%d %B", "%B %d, %Y", "%d %B, %Y", "%B %d %Y", "%d %B %Y", "%m/%d/%Y", "%d/%m/%Y"]:
        try:
            parsed = datetime.strptime(low, fmt)
            if fmt in ["%B %d", "%d %B"]:
                parsed = parsed.replace(year=today.year)
            return parsed.date().isoformat()
        except Exception:
            continue

    return None


def infer_task_type(message: str) -> str:
    low = message.lower()
    mapping = {
        "exam": ["exam", "test", "quiz"],
        "deadline": ["deadline", "due"],
        "homework": ["homework", "hw", "assignment"],
        "meeting": ["meeting", "hangout", "call", "meet"],
        "project": ["project", "presentation", "report"],
        "appointment": ["appointment", "doctor", "dentist", "interview"],
        "reminder": ["remind", "reminder", "alert"]
    }
    for ttype, words in mapping.items():
        if any(word in low for word in words):
            return ttype
    return "other"


def get_query_type(message: str) -> str | None:
    low = message.lower()
    mapping = {
        "exam": ["exam", "test", "quiz"],
        "deadline": ["deadline", "due"],
        "homework": ["homework", "hw", "assignment"],
        "meeting": ["meeting", "hangout", "call", "meet"],
        "project": ["project", "presentation", "report"],
        "appointment": ["appointment", "doctor", "dentist", "interview"],
        "reminder": ["reminder", "remind", "alert"],
    }
    for ttype, words in mapping.items():
        if any(word in low for word in words):
            return ttype
    return None


def get_query_date(message: str) -> str | None:
    date_phrases = re.findall(
        r"\b(today|tomorrow|day after tomorrow|next \w+|this \w+|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\w+ \d{1,2}(?:, \d{4})?)\b",
        message,
        flags=re.IGNORECASE
    )
    for phrase in date_phrases:
        parsed = parse_date_text(phrase)
        if parsed:
            return parsed
    return None


def extract_task(message: str) -> dict | None:
    prompt = f"""
Extract task information from the user message.
Return ONLY valid JSON, no markdown, no explanation.

Format:
{{
    "title": "task name",
    "type": "exam|meeting|deadline|homework|appointment|reminder|project|other",
    "due_date": "YYYY-MM-DD or natural date like '30 June 2026'"
}}

If date is relative (next week, tomorrow, Friday), describe it as-is and I will parse it.

User message: {message}
"""
    # Try quick local parsing before calling Gemini
    local_date = None
    m = re.search(r"(\d{4}-\d{2}-\d{2})", message)
    if m:
        local_date = m.group(1)
    else:
        date_phrases = re.findall(r"\b(today|tomorrow|day after tomorrow|next \w+|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\w+ \d{1,2}(?:, \d{4})?)\b", message, flags=re.IGNORECASE)
        for phrase in date_phrases:
            parsed = parse_date_text(phrase)
            if parsed:
                local_date = parsed
                break

    if local_date:
        title = message
        if m:
            title = title.replace(local_date, "")
        else:
            for phrase in date_phrases:
                if phrase.lower() in title.lower():
                    title = re.sub(re.escape(phrase), "", title, flags=re.IGNORECASE)
                    break
        title = re.sub(r"\b(on|for|due|at)\b", "", title, flags=re.IGNORECASE).strip()
        return {
            "title": title or "Untitled task",
            "type": infer_task_type(message),
            "due_date": local_date,
        }

    result = call_gemini(prompt)
    if not result:
        return None
    try:
        clean = result.replace("```json", "").replace("```", "").strip()
        task = json.loads(clean)
        if not task.get("type"):
            task["type"] = infer_task_type(message)
        if task.get("due_date"):
            normalized = normalize_date(task["due_date"])
            task["due_date"] = normalized
        return task
    except Exception:
        return None


def extract_delete_target(message: str) -> str | None:
    prompt = f"""
The user wants to delete a task. Extract the task name or keyword they want to delete.
Return ONLY the task name/keyword, nothing else.

User: {message}
"""
    return call_gemini(prompt)


def extract_update_info(message: str) -> dict | None:
    prompt = f"""
The user wants to reschedule or update a task's date.
Return ONLY valid JSON:
{{
    "task_keyword": "keyword to find the task",
    "new_date": "new date as described by user"
}}

User: {message}
"""
    result = call_gemini(prompt)
    if not result:
        return None
    try:
        clean = result.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except Exception:
        return None


def normalize_date(date_str: str) -> str:
    """Normalize a fuzzy date to YYYY-MM-DD."""
    local = parse_date_text(date_str)
    if local:
        return local

    from datetime import date
    today = date.today().isoformat()
    prompt = f"""
Today is {today}. Convert this date description to YYYY-MM-DD format.
Return ONLY the date in YYYY-MM-DD format, nothing else.
Date: {date_str}
"""
    result = call_gemini(prompt)
    return result.strip() if result else date_str


def get_hami_response(message: str) -> dict:
    intent = detect_intent(message)
    print("Intent:", intent)

    # ── RESEARCH ───────────────────────────────────────────────
    if intent == "RESEARCH":
        answer = perform_research(message)
        return {"reply": answer, "mood": "working"}

    # ── IMAGE GENERATION ───────────────────────────────────────
    if intent == "GENERATE_IMAGE":
        image_url = generate_image(message)
        return {
            "reply": "Here is a cute picture I made for you! 🐹",
            "mood": "happy",
            "image_url": image_url,
            "imageUrl": image_url,
        }

    # ── GET TASKS ──────────────────────────────────────────────
    if intent == "GET_TASKS":
        query_type = get_query_type(message)
        query_date = get_query_date(message)

        if query_type and "show" in message.lower():
            tasks = get_tasks_by_type(query_type)
            if not tasks:
                return {"reply": f"I couldn't find any {query_type} tasks right now.", "mood": "idle"}
        elif query_date and "show" in message.lower():
            tasks = get_tasks_for_date(query_date)
            if not tasks:
                return {"reply": f"No tasks are scheduled for {query_date}.", "mood": "idle"}
        else:
            tasks = get_tasks()
            if not tasks:
                return {"reply": "You have no tasks yet! Tell me about something coming up and I'll remember it for you.", "mood": "idle"}

        lines = []
        for t in tasks:
            tid, title, ttype, due = t
            lines.append(f"• **{title}** ({ttype}) — {due} `[id:{tid}]`")
        text = "Here are your upcoming tasks:\n\n" + "\n".join(lines)
        return {"reply": text, "mood": "working"}

    # ── ADD TASK ───────────────────────────────────────────────
    if intent == "ADD_TASK":
        task_data = extract_task(message)
        if not task_data:
            return {"reply": "I heard you have something coming up but couldn't quite catch the details. Could you say it again with the date?", "mood": "warning"}

        title = task_data.get("title", "Untitled task")
        ttype = task_data.get("type", "other")
        due_raw = task_data.get("due_date", "")
        due = normalize_date(due_raw) if due_raw else "Unknown"

        add_task(title, ttype, due)
        return {
            "reply": f"Got it! I've added **{title}** ({ttype}) on {due} to your schedule.",
            "mood": "happy"
        }

    # ── DELETE TASK ────────────────────────────────────────────
    if intent == "DELETE_TASK":
        keyword = extract_delete_target(message)
        if not keyword:
            return {"reply": "Which task do you want to remove? I want to make sure I delete the right one!", "mood": "warning"}

        tasks = get_tasks()
        match = None
        for t in tasks:
            if keyword.lower() in t[1].lower():
                match = t
                break

        if not match:
            return {"reply": f"I couldn't find a task matching \"{keyword}\". Use \"show my tasks\" to see what I have.", "mood": "warning"}

        delete_task(match[0])
        return {"reply": f"Deleted **{match[1]}** from your schedule!", "mood": "happy"}

    # ── UPDATE TASK DATE ───────────────────────────────────────
    if intent == "UPDATE_TASK_DATE":
        info = extract_update_info(message)
        if not info:
            return {"reply": "Tell me which task to reschedule and the new date!", "mood": "warning"}

        keyword = info.get("task_keyword", "")
        new_date_raw = info.get("new_date", "")
        new_date = normalize_date(new_date_raw)

        tasks = get_tasks()
        match = None
        for t in tasks:
            if keyword.lower() in t[1].lower():
                match = t
                break

        if not match:
            return {"reply": f"Couldn't find a task matching \"{keyword}\". Try \"show tasks\" first.", "mood": "warning"}

        update_task_date(match[0], new_date)
        return {"reply": f"Done! **{match[1]}** has been rescheduled to {new_date}.", "mood": "happy"}

    # ── NORMAL CHAT ────────────────────────────────────────────
    prompt = f"""
You are Hami, a cute and friendly hamster AI assistant.
Be warm, helpful, slightly playful, and concise.
You help users manage their schedule and chat with them.
Keep responses under 3 sentences unless explaining something complex.

User: {message}
"""
    reply = call_gemini(prompt, model="gemini-2.5-flash")
    if reply:
        return {"reply": reply, "mood": "idle"}
    return {"reply": "Oops, I got a bit confused there! Could you try again?", "mood": "warning"}