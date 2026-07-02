import { useState, useEffect, useMemo } from "react";

const COLORS = ["#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#10b981","#14b8a6","#06b6d4","#3b82f6","#60a5fa","#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#f43f5e"];

const today = new Date();
const todayKey = today.getFullYear() + "-" + String(today.getMonth()+1).padStart(2,"0") + "-" + String(today.getDate()).padStart(2,"0");
const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
const yesterdayKey = yesterday.getFullYear() + "-" + String(yesterday.getMonth()+1).padStart(2,"0") + "-" + String(yesterday.getDate()).padStart(2,"0");

function dateKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function getDaysAgo(n) {
  const d = new Date(today); d.setDate(d.getDate() - n); return d;
}

const DEFAULT_HABITS = [
  { id: 1, name: "Sleeping", color: "#ef4444", completions: { [yesterdayKey]: true, [todayKey]: true } },
  { id: 2, name: "Prayer", color: "#eab308", completions: { [yesterdayKey]: true, [todayKey]: true } },
  { id: 3, name: "Meditation 10 min", color: "#84cc16", completions: {} },
];

function loadHabits() { try { const r = localStorage.getItem("ritual-habits"); if (r) return JSON.parse(r); } catch(e) {} return null; }
function saveHabits(h) { try { localStorage.setItem("ritual-habits", JSON.stringify(h)); } catch(e) {} }
function loadDark() { try { const r = localStorage.getItem("ritual-dark"); if (r !== null) return JSON.parse(r); } catch(e) {} return true; }
function loadReminder() { try { const r = localStorage.getItem("ritual-reminder"); if (r !== null) return JSON.parse(r); } catch(e) {} return { enabled: false, time: "08:00" }; }

function getStreak(habit) {
  let s = 0, d = new Date(today);
  while (habit.completions[dateKey(d)]) { s++; d.setDate(d.getDate()-1); }
  return s;
}
function getLongestStreak(habit) {
  const keys = Object.keys(habit.completions).filter(k => habit.completions[k]).sort();
  if (!keys.length) return 0;
  let max = 0, cur = 0, prev = null;
  for (const k of keys) {
    if (prev) { const diff = (new Date(k) - new Date(prev)) / 86400000; cur = diff === 1 ? cur + 1 : 1; } else cur = 1;
    if (cur > max) max = cur; prev = k;
  }
  return max;
}
function getRate(habit, days) {
  let count = 0;
  for (let i = 0; i < days; i++) { if (habit.completions[dateKey(getDaysAgo(i))]) count++; }
  return Math.round((count / days) * 100);
}

function makeTheme(dark) {
  if (dark) return { bg: "#111711", sidebar: "#141a13", card: "#1a2219", card2: "#242e23", border: "#1e2a1d", border2: "#2e3e2c", text: "#e8e0d4", muted: "#6b7a6a", subtle: "#a0a89e", faint: "#4a5a49", accent: "#c47a5a", accentBtn: "#8b6a4a", navOn: "#2a3828", navOnTxt: "#c8d4b8", navTxt: "#7a8a78", bottomNav: "#141a13" };
  return { bg: "#f5f5f0", sidebar: "#ebebe4", card: "#ffffff", card2: "#f0f0ea", border: "#deded8", border2: "#d0d0ca", text: "#1a2219", muted: "#6b7060", subtle: "#5a5a50", faint: "#9a9a90", accent: "#c47a5a", accentBtn: "#8b6a4a", navOn: "#deded8", navOnTxt: "#1a2219", navTxt: "#6b7060", bottomNav: "#ffffff" };
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}

function Ring({ pct, color, t }) {
  const r = 32, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke={t.card2} strokeWidth="6" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={dash + " " + (circ - dash)} strokeDashoffset={circ / 4} strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={t.text} fontSize="13" fontWeight="700">{pct}%</text>
    </svg>
  );
}

function Toggle({ on, onToggle, t }) {
  return (
    <div onClick={onToggle} style={{ width: 44, height: 24, background: on ? t.accent : t.navOn, borderRadius: 12, cursor: "pointer", position: "relative", transition: "background 0.25s", flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, background: on ? "#fff" : t.faint, borderRadius: "50%", position: "absolute", top: 3, left: on ? 23 : 3, transition: "left 0.25s" }} />
    </div>
  );
}

function TopBar({ title, dark, setDark, t }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 0", flexShrink: 0 }}>
      <span style={{ fontFamily: "Georgia, serif", fontSize: 20, color: t.text, fontWeight: 700 }}>Ritual</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: t.muted, fontSize: 14 }}>{title}</span>
        <button onClick={() => setDark(d => !d)} style={{ background: t.card2, border: "none", cursor: "pointer", fontSize: 12, color: t.muted, padding: "5px 10px", borderRadius: 8 }}>
          {dark ? "Light" : "Dark"}
        </button>
      </div>
    </div>
  );
}

function BottomNav({ active, setActive, t }) {
  const nav = [
    { id: "dashboard", label: "Today" },
    { id: "habits", label: "Habits" },
    { id: "statistics", label: "Stats" },
    { id: "calendar", label: "Calendar" },
  ];
  return (
    <div style={{ display: "flex", background: t.bottomNav, borderTop: "1px solid " + t.border, flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {nav.map(item => (
        <button key={item.id} onClick={() => setActive(item.id)} style={{ flex: 1, background: "none", border: "none", padding: "10px 4px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: active === item.id ? t.accent : "transparent", marginBottom: 2 }} />
          <span style={{ fontSize: 11, color: active === item.id ? t.accent : t.faint, fontWeight: active === item.id ? 600 : 400 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function Sidebar({ active, setActive, dark, setDark, t }) {
  const nav = [
    { id: "dashboard", label: "Dashboard" },
    { id: "habits", label: "Habits" },
    { id: "statistics", label: "Statistics" },
    { id: "calendar", label: "Calendar" },
  ];
  return (
    <div style={{ width: 190, background: t.sidebar, padding: "20px 10px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, borderRight: "1px solid " + t.border }}>
      <div style={{ padding: "8px 12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 22, color: t.text, fontWeight: 700 }}>Ritual</span>
        <button onClick={() => setDark(d => !d)} style={{ background: "none", border: "1px solid " + t.border, cursor: "pointer", fontSize: 12, color: t.muted, padding: "4px 8px", borderRadius: 6 }}>
          {dark ? "Light" : "Dark"}
        </button>
      </div>
      {nav.map(item => (
        <button key={item.id} onClick={() => setActive(item.id)} style={{ background: active === item.id ? t.navOn : "transparent", border: "none", borderRadius: 10, padding: "10px 14px", color: active === item.id ? t.navOnTxt : t.navTxt, display: "flex", alignItems: "center", cursor: "pointer", fontSize: 14, textAlign: "left" }}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function scheduleNotification(time, habits) {
  const id = parseInt(localStorage.getItem("ritual-notif-id") || "0");
  if (id) clearTimeout(id);
  const [h, m] = time.split(":").map(Number);
  const next = new Date(); next.setHours(h, m, 0, 0);
  if (next <= new Date()) next.setDate(next.getDate() + 1);
  const newId = setTimeout(() => {
    const incomplete = habits.filter(hb => !hb.completions[todayKey]);
    if (incomplete.length > 0 && Notification.permission === "granted") {
      new Notification("Ritual - Daily Reminder", { body: incomplete.length + " habit(s) left: " + incomplete.map(hb => hb.name).join(", ") });
    }
    scheduleNotification(time, habits);
  }, next - new Date());
  localStorage.setItem("ritual-notif-id", String(newId));
}
function cancelNotification() {
  const id = parseInt(localStorage.getItem("ritual-notif-id") || "0");
  if (id) { clearTimeout(id); localStorage.removeItem("ritual-notif-id"); }
}

function Dashboard({ habits, setHabits, reminder, setReminder, t, mobile, dark, setDark }) {
  const days = Array.from({ length: 7 }, (_, i) => getDaysAgo(6 - i));
  const doneToday = habits.filter(h => h.completions[todayKey]).length;
  const pct = habits.length ? Math.round((doneToday / habits.length) * 100) : 0;

  function toggle(id) {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const c = { ...h.completions };
      if (c[todayKey]) delete c[todayKey]; else c[todayKey] = true;
      return { ...h, completions: c };
    }));
  }

  async function handleReminderToggle() {
    if (!reminder.enabled) {
      if (!("Notification" in window)) { alert("Notifications not supported."); return; }
      const perm = await Notification.requestPermission();
      if (perm === "granted") { const u = { ...reminder, enabled: true }; setReminder(u); scheduleNotification(u.time, habits); }
      else alert("Notifications blocked. Enable in device Settings.");
    } else { cancelNotification(); setReminder(r => ({ ...r, enabled: false })); }
  }

  function handleTimeChange(e) {
    const t2 = e.target.value;
    setReminder(r => ({ ...r, time: t2 }));
    if (reminder.enabled) scheduleNotification(t2, habits);
  }

  const pad = mobile ? "16px" : "32px";

  return (
    <div style={{ flex: 1, overflowY: "auto", background: t.bg }}>
      {mobile && <TopBar title="Today" dark={dark} setDark={setDark} t={t} />}
      <div style={{ padding: pad }}>
        {!mobile && (
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, color: t.text, margin: 0, fontWeight: 400 }}>Today</h1>
            <p style={{ color: t.muted, margin: "4px 0 0", fontSize: 14 }}>{today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        )}
        <div style={{ background: t.card, borderRadius: 16, padding: "16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <Ring pct={pct} color={t.accent} t={t} />
          <div>
            <div style={{ color: t.text, fontWeight: 600, fontSize: 15 }}>Daily Progress</div>
            <div style={{ color: t.muted, fontSize: 13, marginTop: 2 }}>{doneToday} of {habits.length} completed</div>
            <div style={{ color: t.faint, fontSize: 12, marginTop: 2 }}>{today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {habits.map(h => {
            const done = !!h.completions[todayKey];
            const s = getStreak(h);
            return (
              <div key={h.id} style={{ background: t.card, borderRadius: 14, borderLeft: "3px solid " + h.color, padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <button onClick={() => toggle(h.id)} style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: done ? h.color : t.card2, color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                    {done ? "v" : ""}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: h.color, fontWeight: 600, fontSize: 15 }}>{h.name}</div>
                    <div style={{ color: t.muted, fontSize: 12, marginTop: 2 }}>{s} day streak</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {days.map((d, i) => {
                    const k = dateKey(d);
                    const filled = !!h.completions[k];
                    const isToday = k === todayKey;
                    return (
                      <div key={i} style={{ flex: 1, height: 32, borderRadius: 7, background: filled ? h.color : t.card2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: filled ? "white" : t.faint, border: isToday ? "1.5px solid " + h.color : "none", fontWeight: isToday ? 700 : 400 }}>
                        {d.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ textAlign: "center", color: t.faint, fontSize: 11, margin: "16px 0 12px" }}>Made by Harkirat Singh Pawar</p>
        <div style={{ background: t.card, borderRadius: 14, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: t.text, fontWeight: 500, fontSize: 14 }}>Daily Reminder</div>
              <div style={{ color: t.muted, fontSize: 12 }}>{reminder.enabled ? "Enabled" : "Get nudged to complete habits"}</div>
            </div>
            <Toggle on={reminder.enabled} onToggle={handleReminderToggle} t={t} />
          </div>
          {reminder.enabled && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: t.subtle, fontSize: 13 }}>Remind me at</span>
              <input type="time" value={reminder.time} onChange={handleTimeChange} style={{ background: t.card2, border: "1px solid " + t.border2, borderRadius: 8, padding: "6px 10px", color: t.text, fontSize: 14, outline: "none" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HabitsPage({ habits, setHabits, t, mobile, dark, setDark }) {
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const pad = mobile ? "16px" : "32px";

  function create() {
    if (!name.trim()) return;
    setHabits(prev => [...prev, { id: Date.now(), name: name.trim(), color, completions: {} }]);
    setName(""); setColor(COLORS[0]); setModal(false);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: t.bg }}>
      {mobile && <TopBar title="Habits" dark={dark} setDark={setDark} t={t} />}
      <div style={{ padding: pad }}>
        {!mobile && (
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, color: t.text, margin: 0, fontWeight: 400 }}>Habits</h1>
            <p style={{ color: t.muted, margin: "4px 0 0", fontSize: 14 }}>Design your identity.</p>
          </div>
        )}
        <button onClick={() => setModal(true)} style={{ width: "100%", background: t.accent, border: "none", borderRadius: 12, color: "white", padding: "14px", cursor: "pointer", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>+ New Habit</button>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {habits.map(h => (
            <div key={h.id} style={{ background: t.card, borderRadius: 14, borderLeft: "3px solid " + h.color, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: h.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: t.text, fontWeight: 500, fontSize: 14 }}>{h.name}</div>
                <div style={{ color: t.muted, fontSize: 12, marginTop: 2 }}>{getStreak(h)} day streak</div>
              </div>
              <button onClick={() => setHabits(prev => prev.filter(x => x.id !== h.id))} style={{ background: t.card2, border: "none", color: t.faint, cursor: "pointer", fontSize: 13, padding: "6px 10px", borderRadius: 8 }}>Del</button>
            </div>
          ))}
          {habits.length === 0 && <div style={{ color: t.faint, fontSize: 14, padding: "40px 0", textAlign: "center" }}>No habits yet. Create one!</div>}
        </div>
      </div>
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: t.card, borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 480 }}>
            <div style={{ width: 36, height: 4, background: t.border2, borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ color: t.text, margin: 0, fontSize: 18, fontWeight: 600 }}>New Habit</h2>
              <button onClick={() => setModal(false)} style={{ background: t.card2, border: "none", color: t.muted, cursor: "pointer", fontSize: 14, padding: "6px 12px", borderRadius: 8 }}>Cancel</button>
            </div>
            <label style={{ color: t.subtle, fontSize: 13 }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Read 10 pages" onKeyDown={e => e.key === "Enter" && create()}
              style={{ width: "100%", marginTop: 6, marginBottom: 18, background: t.card2, border: "1px solid " + t.border2, borderRadius: 10, padding: "12px 14px", color: t.text, fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            <label style={{ color: t.subtle, fontSize: 13 }}>Color</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10, marginBottom: 24 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 36, height: 36, borderRadius: "50%", background: c, border: "none", cursor: "pointer", outline: color === c ? "3px solid " + t.text : "none", outlineOffset: 2 }} />
              ))}
            </div>
            <button onClick={create} style={{ width: "100%", background: t.accentBtn, border: "none", borderRadius: 12, color: "#e8e0d4", padding: "14px", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Create Habit</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Statistics({ habits, t, mobile, dark, setDark }) {
  const last90 = useMemo(() => Array.from({ length: 90 }, (_, i) => getDaysAgo(89 - i)), []);
  const pad = mobile ? "16px" : "32px";
  return (
    <div style={{ flex: 1, overflowY: "auto", background: t.bg }}>
      {mobile && <TopBar title="Statistics" dark={dark} setDark={setDark} t={t} />}
      <div style={{ padding: pad }}>
        {!mobile && <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, color: t.text, margin: "0 0 28px", fontWeight: 400 }}>Statistics</h1>}
        {habits.length === 0 && <div style={{ color: t.faint, fontSize: 14, textAlign: "center", paddingTop: 40 }}>No habits yet.</div>}
        {habits.map(h => {
          const total = Object.values(h.completions).filter(Boolean).length;
          return (
            <div key={h.id} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: h.color }} />
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: t.text, margin: 0, fontWeight: 400 }}>{h.name}</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[["Current Streak", getStreak(h) + " days"], ["Longest Streak", getLongestStreak(h) + " days"], ["7-Day Rate", getRate(h, 7) + "%"], ["30-Day Rate", getRate(h, 30) + "%"]].map(([label, val]) => (
                  <div key={label} style={{ background: t.card, borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ color: t.muted, fontSize: 11, marginBottom: 6 }}>{label}</div>
                    <div style={{ color: t.text, fontSize: 20, fontWeight: 700 }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: t.card, borderRadius: 12, padding: "16px" }}>
                <div style={{ color: t.subtle, fontSize: 12, marginBottom: 10 }}>Last 90 Days</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {last90.map((d, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: h.completions[dateKey(d)] ? h.color : t.card2 }} />)}
                </div>
                <div style={{ color: t.faint, fontSize: 11, marginTop: 10 }}>{total} total completions</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Calendar({ habits, t, mobile, dark, setDark }) {
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: prevDays - firstDay + i + 1, cur: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, cur: true });
  for (let i = 1; i <= 42 - cells.length; i++) cells.push({ day: i, cur: false });

  function nav(dir) { let m = month + dir, y = year; if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; } setMonth(m); setYear(y); }
  function getCells(d) { const k = year + "-" + String(month+1).padStart(2,"0") + "-" + String(d).padStart(2,"0"); return habits.filter(h => h.completions[k]); }

  const selKey = selected ? dateKey(selected) : null;
  const selDone = selKey ? habits.filter(h => h.completions[selKey]) : [];
  const pad = mobile ? "16px" : "32px";

  return (
    <div style={{ flex: 1, overflowY: "auto", background: t.bg }}>
      {mobile && <TopBar title="Calendar" dark={dark} setDark={setDark} t={t} />}
      <div style={{ padding: pad }}>
        {!mobile && (
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, color: t.text, margin: 0, fontWeight: 400 }}>Calendar</h1>
            <p style={{ color: t.muted, margin: "4px 0 0", fontSize: 14 }}>Your habit history at a glance.</p>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={() => nav(-1)} style={{ background: t.card2, border: "none", color: t.subtle, cursor: "pointer", fontSize: 18, width: 36, height: 36, borderRadius: 10 }}>&lt;</button>
          <span style={{ color: t.text, fontWeight: 600, fontSize: 16 }}>{months[month]} {year}</span>
          <button onClick={() => nav(1)} style={{ background: t.card2, border: "none", color: t.subtle, cursor: "pointer", fontSize: 18, width: 36, height: 36, borderRadius: 10 }}>&gt;</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {habits.map(h => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: t.subtle }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: h.color }} />{h.name}
            </div>
          ))}
        </div>
        <div style={{ background: t.card, borderRadius: 14, padding: "14px 10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center", marginBottom: 6 }}>
            {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} style={{ color: t.muted, fontSize: 11, fontWeight: 600, padding: "4px 0" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {cells.map((cell, i) => {
              if (!cell.cur) return <div key={i} style={{ padding: "6px 2px", textAlign: "center", color: t.border2, fontSize: 12 }}>{cell.day}</div>;
              const done = getCells(cell.day);
              const pct = habits.length ? Math.round((done.length / habits.length) * 100) : 0;
              const isToday = year === today.getFullYear() && month === today.getMonth() && cell.day === today.getDate();
              const isSel = selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === cell.day;
              return (
                <div key={i} onClick={() => setSelected(new Date(year, month, cell.day))} style={{ padding: "4px 2px", textAlign: "center", cursor: "pointer", borderRadius: 8, border: isSel ? "1.5px solid " + t.accent : "1.5px solid transparent", minHeight: 44 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", margin: "0 auto 2px", background: isToday ? t.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: isToday ? "white" : t.text, fontSize: 12, fontWeight: isToday ? 700 : 400 }}>{cell.day}</div>
                  {done.length > 0 && (
                    <>
                      <div style={{ display: "flex", justifyContent: "center", gap: 1, marginBottom: 1 }}>
                        {done.slice(0,3).map(h => <div key={h.id} style={{ width: 5, height: 5, borderRadius: "50%", background: h.color }} />)}
                      </div>
                      <div style={{ color: t.muted, fontSize: 8 }}>{pct}%</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {selected && (
          <div style={{ background: t.card, borderRadius: 14, padding: "14px 16px", marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ color: t.text, fontWeight: 600, fontSize: 14 }}>{selected.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
              <button onClick={() => setSelected(null)} style={{ background: t.card2, border: "none", color: t.muted, cursor: "pointer", fontSize: 12, padding: "4px 10px", borderRadius: 6 }}>Close</button>
            </div>
            <div style={{ color: t.muted, fontSize: 13 }}>{selDone.length} of {habits.length} habits completed</div>
            {selDone.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {selDone.map(h => (
                  <div key={h.id} style={{ background: t.card2, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: h.color, display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: h.color }} />{h.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [habits, setHabits] = useState(() => loadHabits() ?? DEFAULT_HABITS);
  const [dark, setDarkRaw] = useState(() => loadDark());
  const [reminder, setReminderRaw] = useState(() => loadReminder());
  const t = useMemo(() => makeTheme(dark), [dark]);
  const mobile = useIsMobile();

  function setDark(val) {
    const next = typeof val === "function" ? val(dark) : val;
    setDarkRaw(next);
    try { localStorage.setItem("ritual-dark", JSON.stringify(next)); } catch(e) {}
  }
  function setReminder(val) {
    setReminderRaw(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      try { localStorage.setItem("ritual-reminder", JSON.stringify(next)); } catch(e) {}
      return next;
    });
  }

  useEffect(() => { saveHabits(habits); }, [habits]);

  const shared = { habits, t, mobile, dark, setDark };

  if (mobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: t.bg, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: t.text, overflow: "hidden" }}>
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {active === "dashboard" && <Dashboard {...shared} setHabits={setHabits} reminder={reminder} setReminder={setReminder} />}
          {active === "habits" && <HabitsPage {...shared} setHabits={setHabits} />}
          {active === "statistics" && <Statistics {...shared} />}
          {active === "calendar" && <Calendar {...shared} />}
        </div>
        <BottomNav active={active} setActive={setActive} t={t} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: t.bg, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: t.text, overflow: "hidden" }}>
      <Sidebar active={active} setActive={setActive} dark={dark} setDark={setDark} t={t} />
      {active === "dashboard" && <Dashboard {...shared} setHabits={setHabits} reminder={reminder} setReminder={setReminder} />}
      {active === "habits" && <HabitsPage {...shared} setHabits={setHabits} />}
      {active === "statistics" && <Statistics {...shared} />}
      {active === "calendar" && <Calendar {...shared} />}
    </div>
  );
}
