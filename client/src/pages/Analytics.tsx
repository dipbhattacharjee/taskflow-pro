import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

// ── Types ──────────────────────────────────────────────────────────────────
interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high";
  due_date?: string;
  created_at: string;
}

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: number) => void;
}

// ── Task Detail Modal ──────────────────────────────────────────────────────
function TaskDetailModal({ task, onClose, onUpdate, onDelete }: TaskDetailModalProps) {
  const [form, setForm] = useState<Task>({ ...task });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          due_date: form.due_date,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3001/tasks/${task.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    onDelete(task.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-2xl border p-6"
        style={{
          background: "#1a2340",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Edit Task</h2>
            <p className="text-xs" style={{ color: "#8892b0" }}>
              Created {new Date(task.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "#8892b0" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-xs mb-1.5 block" style={{ color: "#8892b0" }}>Title</label>
          <input
            className="w-full rounded-lg px-3 py-2 text-sm text-white border outline-none focus:border-indigo-500 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="text-xs mb-1.5 block" style={{ color: "#8892b0" }}>Description</label>
          <textarea
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm text-white border outline-none focus:border-indigo-500 transition-colors resize-none"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Status + Priority + Due Date */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "#8892b0" }}>Status</label>
            <select
              className="w-full rounded-lg px-2.5 py-2 text-sm text-white border outline-none focus:border-indigo-500"
              style={{ background: "#0f1729", borderColor: "rgba(255,255,255,0.1)" }}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Task["status"] })}
            >
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "#8892b0" }}>Priority</label>
            <select
              className="w-full rounded-lg px-2.5 py-2 text-sm text-white border outline-none focus:border-indigo-500"
              style={{ background: "#0f1729", borderColor: "rgba(255,255,255,0.1)" }}
              value={form.priority ?? "medium"}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "#8892b0" }}>Due Date</label>
            <input
              type="date"
              className="w-full rounded-lg px-2.5 py-2 text-sm text-white border outline-none focus:border-indigo-500"
              style={{ background: "#0f1729", borderColor: "rgba(255,255,255,0.1)" }}
              value={form.due_date ?? ""}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            Delete Task
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8892b0", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
            style={{ background: "#6366f1" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    todo: { bg: "rgba(99,102,241,0.12)", color: "#818cf8", border: "rgba(99,102,241,0.25)" },
    "in-progress": { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "rgba(251,191,36,0.25)" },
    done: { bg: "rgba(52,211,153,0.12)", color: "#34d399", border: "rgba(52,211,153,0.25)" },
  };
  const s = styles[status] ?? styles.todo;
  return (
    <span
      className="text-xs px-2.5 py-0.5 rounded-full border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {status}
    </span>
  );
}

// ── Priority Badge ─────────────────────────────────────────────────────────
function PriorityDot({ priority }: { priority?: string }) {
  const color = priority === "high" ? "#f87171" : priority === "medium" ? "#fbbf24" : "#8892b0";
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: color }}
      title={priority ?? "no priority"}
    />
  );
}

// ── Main Analytics Page ────────────────────────────────────────────────────
export default function Analytics() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "todo" | "in-progress" | "done">("all");
  const [range, setRange] = useState("7");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetch("http://localhost:3001/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { setTasks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ── Derived stats ──────────────────────────────────────────────────────
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in-progress").length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  // ── Chart: activity over last N days ──────────────────────────────────
  const days = parseInt(range);
  const labels: string[] = [];
  const createdData: number[] = [];
  const completedData: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    labels.push(d.toLocaleDateString("en", { weekday: "short", month: "numeric", day: "numeric" }));
    createdData.push(tasks.filter((t) => t.created_at?.startsWith(key)).length);
    // Approximate: tasks created on that day marked done
    completedData.push(tasks.filter((t) => t.status === "done" && t.created_at?.startsWith(key)).length);
  }

  const lineData = {
    labels,
    datasets: [
      {
        label: "Created",
        data: createdData,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#6366f1",
        pointRadius: 4,
      },
      {
        label: "Completed",
        data: completedData,
        borderColor: "#34d399",
        backgroundColor: "rgba(52,211,153,0.08)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#34d399",
        pointRadius: 4,
      },
    ],
  };

  const donutData = {
    labels: ["Todo", "In Progress", "Done"],
    datasets: [{
      data: [todo, inProgress, completed],
      backgroundColor: ["#6366f1", "#fbbf24", "#34d399"],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const barData = {
    labels: ["Todo", "In Progress", "Done"],
    datasets: [{
      data: [todo, inProgress, completed],
      backgroundColor: ["rgba(99,102,241,0.7)", "rgba(251,191,36,0.7)", "rgba(52,211,153,0.7)"],
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#8892b0", font: { size: 11 } } },
      y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#8892b0", font: { size: 11 } }, beginAtZero: true },
    },
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1729" }}>
        <div className="text-white opacity-60 text-sm animate-pulse">Loading analytics…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0f1729", color: "#e8eaf6" }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 border-b"
        style={{ background: "#1a2340", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tracking-tight">
            Task<span style={{ color: "#6366f1" }}>Flow</span> Pro
          </span>
          <span
            className="text-xs px-2.5 py-0.5 rounded-full border"
            style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", borderColor: "rgba(99,102,241,0.25)" }}
          >
            Analytics
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#8892b0", background: "rgba(255,255,255,0.04)" }}
          >
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
            style={{ color: "#e8eaf6", borderColor: "rgba(255,255,255,0.12)" }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Productivity Analytics</h1>
            <p className="text-sm" style={{ color: "#8892b0" }}>
              Track your task completion trends and performance
            </p>
          </div>
          <select
            className="text-sm px-3 py-2 rounded-lg border outline-none"
            style={{ background: "#1a2340", borderColor: "rgba(255,255,255,0.1)", color: "#e8eaf6" }}
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Tasks", value: total, color: "#6366f1", gradient: "linear-gradient(90deg,#6366f1,#818cf8)" },
            { label: "Completed", value: completed, color: "#34d399", gradient: "linear-gradient(90deg,#34d399,#6ee7b7)" },
            { label: "In Progress", value: inProgress, color: "#fbbf24", gradient: "linear-gradient(90deg,#fbbf24,#fde68a)" },
            { label: "Completion Rate", value: `${rate}%`, color: "#22d3ee", gradient: "linear-gradient(90deg,#22d3ee,#67e8f9)" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-5 border relative overflow-hidden"
              style={{ background: "#1a2340", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: card.gradient }}
              />
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8892b0" }}>
                {card.label}
              </div>
              <div className="text-3xl font-bold" style={{ color: card.color }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Line Chart */}
          <div
            className="col-span-2 rounded-xl border p-5"
            style={{ background: "#1a2340", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Task Activity</h3>
              <div className="flex gap-4 text-xs" style={{ color: "#8892b0" }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#6366f1" }} />
                  Created
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#34d399" }} />
                  Completed
                </span>
              </div>
            </div>
            <div style={{ height: 200 }}>
              <Line data={lineData} options={chartOptions as never} />
            </div>
          </div>

          {/* Donut */}
          <div
            className="rounded-xl border p-5 flex flex-col"
            style={{ background: "#1a2340", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <h3 className="text-sm font-medium mb-4">Status Split</h3>
            <div style={{ height: 140, marginBottom: 16 }}>
              <Doughnut
                data={donutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "72%",
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              {[
                { label: "Todo", val: todo, color: "#6366f1" },
                { label: "In Progress", val: inProgress, color: "#fbbf24" },
                { label: "Done", val: completed, color: "#34d399" },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2" style={{ color: "#8892b0" }}>
                    <span className="w-2 h-2 rounded-sm inline-block" style={{ background: r.color }} />
                    {r.label}
                  </span>
                  <span className="font-medium text-white">{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div
          className="rounded-xl border p-5 mb-8"
          style={{ background: "#1a2340", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <h3 className="text-sm font-medium mb-4">Tasks by Status</h3>
          <div style={{ height: 140 }}>
            <Bar data={barData} options={chartOptions as never} />
          </div>
        </div>

        {/* Task Table */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "#1a2340", borderColor: "rgba(255,255,255,0.07)" }}
        >
          {/* Table header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <h3 className="text-sm font-medium">All Tasks</h3>
            <div className="flex gap-2">
              {(["all", "todo", "in-progress", "done"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="text-xs px-3 py-1 rounded-lg transition-colors capitalize"
                  style={{
                    background: filter === f ? "#6366f1" : "rgba(255,255,255,0.05)",
                    color: filter === f ? "white" : "#8892b0",
                    border: filter === f ? "none" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: "#8892b0" }}>
              No tasks found
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Task", "Status", "Priority", "Created", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-medium"
                      style={{ color: "#8892b0" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onClick={() => setSelectedTask(task)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(99,102,241,0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-white">{task.title}</div>
                      {task.description && (
                        <div
                          className="text-xs mt-0.5 truncate max-w-xs"
                          style={{ color: "#8892b0" }}
                        >
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <PriorityDot priority={task.priority} />
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#8892b0" }}>
                      {new Date(task.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        className="text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
                        onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updated) =>
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          }
          onDelete={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
        />
      )}
    </div>
  );
}