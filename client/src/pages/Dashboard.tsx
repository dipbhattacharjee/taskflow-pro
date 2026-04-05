import { useState } from "react";
import type { CSSProperties } from "react";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

type Status = "todo" | "in-progress" | "done";

interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  desc: string;
  status: Status;
  checklist: SubTask[];
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
    style={{ transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
    <path d="M4 6L8 10L12 6" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const initialTasks: Task[] = [
  {
    id: uid(),
    title: "Coding",
    desc: "full stack dev study and build",
    status: "todo",
    checklist: [{ id: uid(), text: "create a ppp project", done: false }],
  },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [subInputs, setSubInputs] = useState<Record<string, string>>({});

  const addTask = () => {
    if (!titleInput.trim()) return;
    setTasks(prev => [...prev, { id: uid(), title: titleInput.trim(), desc: descInput.trim(), status: "todo", checklist: [] }]);
    setTitleInput("");
    setDescInput("");
  };

  const toggleExpand = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const changeStatus = (id: string, val: Status) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: val } : t));

  const addSub = (taskId: string) => {
    const text = (subInputs[taskId] || "").trim();
    if (!text) return;
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, checklist: [...t.checklist, { id: uid(), text, done: false }] } : t
    ));
    setSubInputs(prev => ({ ...prev, [taskId]: "" }));
  };

  const toggleCheck = (taskId: string, subId: string) =>
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, checklist: t.checklist.map(s => s.id === subId ? { ...s, done: !s.done } : s) }
        : t
    ));

  const delSub = (taskId: string, subId: string) =>
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, checklist: t.checklist.filter(s => s.id !== subId) } : t
    ));

  const delTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setExpanded(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const visible = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const totalInProgress = tasks.filter(t => t.status === "in-progress").length;
  const totalDone = tasks.filter(t => t.status === "done").length;

  const sc = (color: string): CSSProperties => ({ background: "#1e293b", borderRadius: 10, padding: "14px 18px", borderTop: `3px solid ${color}` });
  const scVal = (color: string): CSSProperties => ({ fontSize: 28, fontWeight: 700, color });
  const fb = (active: boolean): CSSProperties => ({ background: active ? "#6366f1" : "transparent", border: `1px solid ${active ? "#6366f1" : "rgba(255,255,255,0.1)"}`, color: active ? "#fff" : "#94a3b8", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 12 });
  const dot = (status: Status): CSSProperties => ({ width: 9, height: 9, borderRadius: "50%", background: status === "in-progress" ? "#f59e0b" : status === "done" ? "#10b981" : "#ef4444", flexShrink: 0 });
  const pfill = (pct: number): CSSProperties => ({ height: "100%", borderRadius: 2, background: "#10b981", width: `${pct}%`, transition: "width 0.3s" });
  const ciLabel = (done: boolean): CSSProperties => ({ fontSize: 13, color: done ? "#475569" : "#f1f5f9", flex: 1, cursor: "pointer", textDecoration: done ? "line-through" : "none" });

  const s: Record<string, CSSProperties> = {
    app: { background: "#0f172a", minHeight: "100vh", fontFamily: "system-ui,sans-serif", color: "#f1f5f9" },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#0d1526" },
    logo: { display: "flex", alignItems: "center", gap: 10 },
    logoIcon: { fontSize: 32, lineHeight: 1 },
    logoText: { fontSize: 16, fontWeight: 600 },
    navActions: { display: "flex", alignItems: "center", gap: 10 },
    navTag: { fontSize: 12, color: "#94a3b8" },
    navBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9", padding: "5px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12 },
    body: { padding: 24, maxWidth: 820, margin: "0 auto" },
    stats: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 },
    scLabel: { fontSize: 11, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" },
    addBox: { background: "#1e293b", borderRadius: 10, padding: "16px 18px", marginBottom: 18 },
    addLabel: { fontSize: 12, color: "#818cf8", fontWeight: 500, marginBottom: 10 },
    addRow: { display: "flex", gap: 8 },
    input: { flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "8px 12px", color: "#f1f5f9", fontSize: 13, outline: "none", minWidth: 0 },
    btnPrimary: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 7, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 },
    filters: { display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" },
    tasks: { display: "flex", flexDirection: "column", gap: 8 },
    task: { background: "#1e293b", borderRadius: 10, overflow: "hidden" },
    taskHead: { display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", cursor: "pointer", userSelect: "none" },
    ti: { flex: 1, minWidth: 0 },
    tn: { fontSize: 14, fontWeight: 500, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    td: { fontSize: 12, color: "#475569", marginTop: 2 },
    tmeta: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
    pbadge: { fontSize: 11, color: "#94a3b8", background: "rgba(255,255,255,0.06)", padding: "2px 9px", borderRadius: 20 },
    ssel: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 6, padding: "4px 6px", fontSize: 11, cursor: "pointer" },
    expBtn: { width: 30, height: 30, borderRadius: 7, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
    taskBody: { padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" },
    clHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 6px", fontSize: 11, color: "#94a3b8" },
    pbar: { height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, marginBottom: 10 },
    clItems: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 },
    ci: { display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6 },
    dx: { background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 0, flexShrink: 0 },
    subRow: { display: "flex", gap: 6, marginTop: 4 },
    btnSec: { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, flexShrink: 0 },
    btnDel: { background: "none", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, marginTop: 10 },
    empty: { textAlign: "center", padding: 32, color: "#475569", fontSize: 14 },
  };

  return (
    <div style={s.app}>
      <div style={s.nav}>
        <div style={s.logo}>
          <span style={s.logoIcon}>🚀</span>
          <div style={s.logoText}>
            <span style={{ color: "#818cf8" }}>Task</span>
            <span style={{ color: "#f1f5f9" }}>Flow Pro</span>
          </div>
        </div>
        <div style={s.navActions}>
          <span style={s.navTag}>{tasks.length} tasks total</span>
          <button style={s.navBtn}>Analytics</button>
          <button style={s.navBtn}>Logout</button>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.stats}>
          <div style={sc("#6366f1")}>
            <div style={s.scLabel}>Total Tasks</div>
            <div style={scVal("#818cf8")}>{tasks.length}</div>
          </div>
          <div style={sc("#f59e0b")}>
            <div style={s.scLabel}>In Progress</div>
            <div style={scVal("#f59e0b")}>{totalInProgress}</div>
          </div>
          <div style={sc("#10b981")}>
            <div style={s.scLabel}>Completed</div>
            <div style={scVal("#10b981")}>{totalDone}</div>
          </div>
        </div>

        <div style={s.addBox}>
          <div style={s.addLabel}>+ Add New Task</div>
          <div style={s.addRow}>
            <input style={s.input} placeholder="Task title..." value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTask()} />
            <input style={s.input} placeholder="Description..." value={descInput}
              onChange={e => setDescInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTask()} />
            <button style={s.btnPrimary} onClick={addTask}>Add Task</button>
          </div>
        </div>

        <div style={s.filters}>
          {(["all", "todo", "in-progress", "done"] as const).map(f => (
            <button key={f} style={fb(filter === f)} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div style={s.tasks}>
          {visible.length === 0 && <div style={s.empty}>No tasks here — add one above!</div>}
          {visible.map(t => {
            const doneCount = t.checklist.filter(s => s.done).length;
            const tot = t.checklist.length;
            const pct = tot ? Math.round(doneCount / tot * 100) : 0;
            const open = !!expanded[t.id];

            return (
              <div key={t.id} style={s.task}>
                <div style={s.taskHead} onClick={() => toggleExpand(t.id)}>
                  <div style={dot(t.status)} />
                  <div style={s.ti}>
                    <div style={s.tn}>{t.title}</div>
                    {t.desc && <div style={s.td}>{t.desc}</div>}
                  </div>
                  <div style={s.tmeta}>
                    {tot > 0 && <span style={s.pbadge}>{doneCount}/{tot}</span>}
                    <select
                      style={s.ssel}
                      value={t.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); changeStatus(t.id, e.target.value as Status); }}
                    >
                      <option value="todo">todo</option>
                      <option value="in-progress">in-progress</option>
                      <option value="done">done</option>
                    </select>
                    <div style={s.expBtn} onClick={e => { e.stopPropagation(); toggleExpand(t.id); }}>
                      <ChevronIcon open={open} />
                    </div>
                  </div>
                </div>

                {open && (
                  <div style={s.taskBody}>
                    <div style={s.clHeader}>
                      <span>Checklist{tot ? ` — ${doneCount}/${tot}` : ""}</span>
                      <span>{pct}%</span>
                    </div>
                    {tot > 0 && (
                      <div style={s.pbar}><div style={pfill(pct)} /></div>
                    )}
                    <div style={s.clItems}>
                      {t.checklist.map(sub => (
                        <div key={sub.id} style={s.ci}>
                          <input
                            type="checkbox"
                            checked={sub.done}
                            onChange={() => toggleCheck(t.id, sub.id)}
                            style={{ width: 15, height: 15, accentColor: "#10b981", cursor: "pointer", flexShrink: 0 }}
                          />
                          <label style={ciLabel(sub.done)} onClick={() => toggleCheck(t.id, sub.id)}>
                            {sub.text}
                          </label>
                          <button style={s.dx} onClick={() => delSub(t.id, sub.id)}>×</button>
                        </div>
                      ))}
                    </div>
                    <div style={s.subRow}>
                      <input
                        style={{ ...s.input, fontSize: 12, padding: "6px 10px" }}
                        placeholder="Add subtask..."
                        value={subInputs[t.id] || ""}
                        onChange={e => setSubInputs(prev => ({ ...prev, [t.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addSub(t.id)}
                      />
                      <button style={s.btnSec} onClick={() => addSub(t.id)}>+ Add</button>
                    </div>
                    <button style={s.btnDel} onClick={() => delTask(t.id)}>Delete task</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}