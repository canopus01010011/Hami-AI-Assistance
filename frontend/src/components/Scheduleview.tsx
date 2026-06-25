import { useState, useEffect } from "react";
import type { Task } from "../types";

const API = "http://127.0.0.1:8000";

const TYPE_COLORS: Record<string, string> = {
  exam: "#E57373",
  meeting: "#64B5F6",
  deadline: "#FF8C42",
  homework: "#81C784",
  appointment: "#BA68C8",
  reminder: "#FFB74D",
  project: "#4DB6AC",
  other: "#90A4AE",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function ScheduleView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [taskDates, setTaskDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayTasks, setDayTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formTaskId, setFormTaskId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("other");
  const [formDueDate, setFormDueDate] = useState<string>(selectedDate || "");
  const [formReminderTime, setFormReminderTime] = useState("");

  useEffect(() => {
    fetch(`${API}/tasks/dates`)
      .then(r => r.json())
      .then(setTaskDates)
      .catch(() => {});

    fetch(`${API}/tasks`)
      .then(r => r.json())
      .then(setAllTasks)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    fetch(`${API}/tasks/date/${selectedDate}`)
      .then(r => r.json())
      .then(setDayTasks)
      .catch(() => {});
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    // reset temporary state when selected day changes
    setShowForm(false);
    setFormTaskId(null);
    setFormTitle("");
    setFormType("other");
    setFormDueDate(selectedDate);
    setFormReminderTime("");
  }, [selectedDate]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pad = (n: number) => String(n).padStart(2, "0");

  const handleDelete = async (id: number) => {
    await fetch(`${API}/task/${id}`, { method: "DELETE" });
    setDayTasks(t => t.filter(x => x.id !== id));
    setAllTasks(t => t.filter(x => x.id !== id));
    const dates = await fetch(`${API}/tasks/dates`).then(r => r.json());
    setTaskDates(dates);
    if (formTaskId === id) {
      setShowForm(false);
      setFormTaskId(null);
    }
  };

  const openAddForm = () => {
    setFormTaskId(null);
    setFormTitle("");
    setFormType("other");
    setFormDueDate(selectedDate || "");
    setFormReminderTime("");
    setShowForm(true);
  };

  const openEditForm = (task: Task) => {
    setFormTaskId(task.id);
    setFormTitle(task.title);
    setFormType(task.type);
    setFormDueDate(task.due_date);
    setFormReminderTime("");
    setShowForm(true);
  };

  const refreshTasks = async (day?: string) => {
    const dates = await fetch(`${API}/tasks/dates`).then(r => r.json());
    setTaskDates(dates);
    const all = await fetch(`${API}/tasks`).then(r => r.json());
    setAllTasks(all);
    if (day) {
      const dayList = await fetch(`${API}/tasks/date/${day}`).then(r => r.json());
      setDayTasks(dayList);
    }
  };

  const saveForm = async () => {
    if (!formTitle.trim() || !formDueDate) return;
    if (formTaskId) {
      await fetch(`${API}/task/${formTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formTitle.trim(), type: formType, due_date: formDueDate }),
      });
    } else {
      const res = await fetch(`${API}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formTitle.trim(), type: formType, due_date: formDueDate }),
      });
      const data = await res.json();
      if (formReminderTime && data?.id) {
        const remind_at = `${formDueDate}T${formReminderTime}:00`;
        await fetch(`${API}/reminder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: data.id, remind_at }) });
      }
    }

    await refreshTasks(formDueDate);
    setSelectedDate(formDueDate);
    setShowForm(false);
    setFormTaskId(null);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
      background: "var(--cream)",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px 12px",
        borderBottom: "1.5px solid var(--border)",
        background: "white",
        flexShrink: 0,
      }}>
        <h2 style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "20px",
          color: "var(--text)",
          marginBottom: "14px",
        }}>📅 Your Schedule</h2>

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
            style={{ background: "var(--orange-pale)", border: "1.5px solid var(--border)", borderRadius: "8px", width: "32px", height: "32px", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >‹</button>
          <span style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: "16px", color: "var(--text)", minWidth: "140px", textAlign: "center" }}>
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
            style={{ background: "var(--orange-pale)", border: "1.5px solid var(--border)", borderRadius: "8px", width: "32px", height: "32px", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >›</button>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
            style={{ background: "var(--orange)", color: "white", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, marginLeft: "auto" }}
          >Today</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Calendar grid */}
        <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "6px" }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", fontFamily: "Nunito", padding: "4px 0" }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
              const hasTask = taskDates.includes(dateStr);
              const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
              const isSelected = selectedDate === dateStr;

              // Count tasks per day for dot count
              const taskCount = allTasks.filter(t => t.due_date === dateStr).length;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    aspectRatio: "1",
                    background: isSelected ? "var(--orange)" : isToday ? "var(--orange-pale)" : "white",
                    border: isToday ? "2px solid var(--orange)" : isSelected ? "2px solid var(--orange-dark)" : "1.5px solid var(--border)",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px",
                    cursor: "pointer",
                    padding: "4px 2px",
                    transition: "all 0.15s",
                    minHeight: "44px",
                  }}
                >
                  <span style={{
                    fontFamily: "Nunito",
                    fontWeight: isToday || isSelected ? 800 : 600,
                    fontSize: "13px",
                    color: isSelected ? "white" : isToday ? "var(--orange-dark)" : "var(--text)",
                  }}>{day}</span>
                  {hasTask && (
                    <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", justifyContent: "center" }}>
                      {Array.from({ length: Math.min(taskCount, 3) }).map((_, dotI) => {
                        const t = allTasks.find(t => t.due_date === dateStr);
                        const color = t ? (TYPE_COLORS[t.type] || "#FF8C42") : "#FF8C42";
                        return (
                          <div key={dotI} style={{
                            width: "5px", height: "5px", borderRadius: "50%",
                            background: isSelected ? "rgba(255,255,255,0.8)" : color,
                          }} />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div style={{
          width: "240px",
          borderLeft: "1.5px solid var(--border)",
          background: "white",
          padding: "16px",
          overflowY: "auto",
          flexShrink: 0,
        }}>
          {selectedDate ? (
            <>
              <div style={{
                fontFamily: "Nunito",
                fontWeight: 800,
                fontSize: "14px",
                color: "var(--text)",
                marginBottom: "12px",
              }}>
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 700 }}>Events</div>
                <button onClick={openAddForm} style={{ background: "var(--orange)", color: "white", border: "none", padding: "6px 10px", borderRadius: 8, fontWeight: 700, fontSize: 12 }}>Add event</button>
              </div>
              {dayTasks.length === 0 ? (
                <div style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", paddingTop: "24px" }}>
                  🌿 Nothing here.<br />Nice and free!
                </div>
              ) : (
                dayTasks.map(task => (
                  <div key={task.id} style={{
                    background: "var(--cream)",
                    border: "1.5px solid var(--border)",
                    borderLeft: `4px solid ${TYPE_COLORS[task.type] || "#FF8C42"}`,
                    borderRadius: "10px",
                    padding: "10px 12px",
                    marginBottom: "8px",
                    position: "relative",
                  }}>
                    <div style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: "13px", color: "var(--text)", paddingRight: "20px" }}>
                      {task.title}
                    </div>
                    <div style={{
                      display: "inline-block",
                      marginTop: "4px",
                      background: TYPE_COLORS[task.type] || "#FF8C42",
                      color: "white",
                      borderRadius: "var(--radius-pill)",
                      padding: "1px 8px",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}>
                      {task.type}
                    </div>
                    <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => openEditForm(task)}
                        style={{
                          background: "#fff",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          padding: "4px 6px",
                          fontSize: "11px",
                          color: "var(--text)",
                          cursor: "pointer",
                        }}
                      >✏️</button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "14px",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "2px",
                          lineHeight: 1,
                        }}
                      >✕</button>
                    </div>
                  </div>
                ))
              )}
              {showForm && (
                <div style={{ marginTop: 10, padding: 8, borderRadius: 8, background: "var(--o050)", border: "1px solid var(--border)" }}>
                  <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Event title" style={{ width: "100%", padding: "8px", marginBottom: 8, borderRadius: 6, border: "1px solid var(--border)" }} />
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <select value={formType} onChange={e => setFormType(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid var(--border)" }}>
                      {Object.keys(TYPE_COLORS).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} style={{ width: 140, padding: 8, borderRadius: 6, border: "1px solid var(--border)" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input type="time" value={formReminderTime} onChange={e => setFormReminderTime(e.target.value)} style={{ width: 120, padding: 8, borderRadius: 6, border: "1px solid var(--border)" }} />
                    <div style={{ flex: 1, fontSize: 11, color: "var(--text-muted)", alignSelf: "center" }}>
                      {formTaskId ? "Editing event details." : "Optionally set a reminder time."}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={saveForm} style={{ background: "var(--orange)", color: "white", border: "none", padding: "8px 12px", borderRadius: 8, fontWeight: 700 }}>{formTaskId ? "Save changes" : "Save event"}</button>
                    <button onClick={() => { setShowForm(false); setFormTaskId(null); }} style={{ background: "#eee", border: "none", padding: "8px 12px", borderRadius: 8 }}>Cancel</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: "40px", color: "var(--text-muted)", fontSize: "13px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🐹</div>
              Click a day to see its events!
            </div>
          )}
        </div>
      </div>

      {/* All upcoming tasks */}
      <div style={{ borderTop: "1.5px solid var(--border)", padding: "12px 24px", background: "white", flexShrink: 0 }}>
        <div style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
          Upcoming
        </div>
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
          {allTasks.slice(0, 8).map(task => (
            <div key={task.id} style={{
              background: "var(--orange-pale)",
              border: "1.5px solid var(--border)",
              borderRadius: "10px",
              padding: "6px 10px",
              flexShrink: 0,
              maxWidth: "160px",
            }}>
              <div style={{ fontFamily: "Nunito", fontWeight: 700, fontSize: "12px", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {task.title}
              </div>
              <div style={{ fontSize: "11px", color: "var(--orange-dark)", fontWeight: 600 }}>{task.due_date}</div>
            </div>
          ))}
          {allTasks.length === 0 && (
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No upcoming tasks yet</div>
          )}
        </div>
      </div>
    </div>
  );
}