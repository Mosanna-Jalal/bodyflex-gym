"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  userId: string;
  goals: string[];
  referredBy: string | null;
  referralCount: number;
};

type WorkoutLog = {
  id: string;
  userId: string;
  date: string;
  exercise: string;
  minutes: number;
  createdAt: string;
};

type WeightLog = {
  date: string;
  weight: number;
  unit: string;
  notes?: string;
  constipation?: string;
};

const today = new Date().toISOString().slice(0, 10);

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("The app API is unavailable. Refresh the page or restart the local server.");
  }

  return response.json();
}

/* The 8 trackable muscle groups / exercise types. */
const CATEGORIES = [
  "chest",
  "biceps",
  "back",
  "shoulder",
  "triceps",
  "legs",
  "cardio",
  "mix",
] as const;
type Category = (typeof CATEGORIES)[number];

/* Distinct colour per category for chart segments + legends. */
const CATEGORY_COLOR: Record<Category, string> = {
  chest: "#38bdf8",
  biceps: "#818cf8",
  back: "#34d399",
  shoulder: "#fbbf24",
  triceps: "#f472b6",
  legs: "#fb923c",
  cardio: "#f87171",
  mix: "#a3a3a3",
};

type EntryRow = { category: Category; minutes: string };

/* Constipation severity for daily weight logs. */
const CONSTIPATION_LEVELS = ["none", "mild", "moderate", "severe"] as const;
type Constipation = (typeof CONSTIPATION_LEVELS)[number];
const CONSTIPATION_COLOR: Record<Constipation, string> = {
  none: "#34d399",
  mild: "#fbbf24",
  moderate: "#fb923c",
  severe: "#f87171",
};
const CONSTIPATION_LABEL: Record<Constipation, string> = {
  none: "No constipation",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
};

/* Map any stored exercise string into one of the 8 categories so older,
   free-text logs still render in the per-group charts. */
function categorize(exercise: string): Category {
  const e = exercise.toLowerCase();
  if (CATEGORIES.includes(e as Category)) return e as Category;
  if (e.includes("chest")) return "chest";
  if (e.includes("bicep")) return "biceps";
  if (e.includes("back")) return "back";
  if (e.includes("shoulder")) return "shoulder";
  if (e.includes("tricep")) return "triceps";
  if (e.includes("leg")) return "legs";
  if (e.includes("cardio") || e.includes("run") || e.includes("hiit")) return "cardio";
  return "mix";
}

function nextCategory(used: EntryRow[]): Category {
  const taken = new Set(used.map((r) => r.category));
  return CATEGORIES.find((c) => !taken.has(c)) ?? "mix";
}

export default function UserPortal() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [referredBy, setReferredBy] = useState("");
  const [goalsText, setGoalsText] = useState("");
  const [workoutDate, setWorkoutDate] = useState(today);
  const [entries, setEntries] = useState<EntryRow[]>([{ category: "chest", minutes: "45" }]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLog, setEditLog] = useState<{ date: string; category: Category; minutes: string }>({ date: today, category: "chest", minutes: "45" });
  const [confirmDeleteLog, setConfirmDeleteLog] = useState<string | null>(null);
  const [confirmDeleteWeight, setConfirmDeleteWeight] = useState<string | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [weightDate, setWeightDate] = useState(today);
  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [weightNotes, setWeightNotes] = useState("");
  const [weightConstipation, setWeightConstipation] = useState<Constipation>("none");
  const [rightTab, setRightTab] = useState<"workouts" | "weight">("workouts");
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [activeDay, setActiveDay] = useState<ChartDay | null>(null);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);

  const chartDays = useMemo(() => buildChartDays(logs, rangeStart, rangeEnd), [logs, rangeStart, rangeEnd]);
  const chartMinWidth = useMemo(() => Math.max(420, chartDays.length * 46), [chartDays.length]);
  const rangeLabel = useMemo(() => buildRangeLabel(chartDays, rangeStart, rangeEnd), [chartDays, rangeStart, rangeEnd]);
  const consistency = useMemo(() => {
    if (chartDays.length === 0) return 0;
    return Math.round((chartDays.filter((d) => d.minutes > 0).length / chartDays.length) * 100);
  }, [chartDays]);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await readJsonResponse(res);
        if (data.user) {
          setUser(data.user);
          setGoalsText(data.user.goals.join("\n"));
          await Promise.all([loadWorkouts(), loadWeight()]);
        }
      } catch {
        setMessage("Add your MongoDB URI in .env to enable user accounts.");
      }
    }
    loadUser();
  }, []);

  async function loadWorkouts() {
    const res = await fetch("/api/workouts");
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs || []);
    }
  }

  async function loadWeight() {
    const res = await fetch("/api/weight");
    if (res.ok) {
      const data = await res.json();
      setWeightLogs(data.logs || []);
    }
  }

  async function submitAuth(event: { preventDefault(): void }) {
    event.preventDefault();
    setIsBusy(true);
    setMessage("");
    try {
      const body: Record<string, string> = { userId, password };
      if (mode === "register" && referredBy.trim()) body.referredBy = referredBy.trim();

      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Could not continue.");

      setUser(data.user);
      setGoalsText(data.user.goals.join("\n"));
      setUserId("");
      setPassword("");
      setReferredBy("");
      setMessage(mode === "register" ? "Account created. Start logging your work." : "Welcome back.");
      await Promise.all([loadWorkouts(), loadWeight()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsBusy(false);
    }
  }

  async function saveGoals(event: { preventDefault(): void }) {
    event.preventDefault();
    setIsBusy(true);
    setMessage("");
    try {
      const goals = goalsText.split("\n").map((g) => g.trim()).filter(Boolean);
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save goals.");
      setUser((u) => u ? { ...u, goals: data.goals } : u);
      setGoalsText(data.goals.join("\n"));
      setMessage("Goals saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save goals.");
    } finally {
      setIsBusy(false);
    }
  }

  function addEntryRow() {
    setEntries((rows) => (rows.length >= CATEGORIES.length ? rows : [...rows, { category: nextCategory(rows), minutes: "30" }]));
  }

  function removeEntryRow(index: number) {
    setEntries((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));
  }

  function updateEntryRow(index: number, patch: Partial<EntryRow>) {
    setEntries((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function saveWorkout(event: { preventDefault(): void }) {
    event.preventDefault();
    const payload = entries
      .map((row) => ({ exercise: row.category, minutes: Number(row.minutes) }))
      .filter((row) => row.exercise && Number.isFinite(row.minutes) && row.minutes > 0);

    if (payload.length === 0) {
      setMessage("Add at least one exercise with minutes.");
      return;
    }

    setIsBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: workoutDate, entries: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save workout.");
      setLogs(data.logs || []);
      setEntries([{ category: "chest", minutes: "45" }]);
      setMessage(`Logged ${payload.length} exercise${payload.length > 1 ? "s" : ""}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save workout.");
    } finally {
      setIsBusy(false);
    }
  }

  function startEditLog(log: WorkoutLog) {
    setConfirmDeleteLog(null);
    setEditingLogId(log.id);
    setEditLog({ date: log.date, category: categorize(log.exercise), minutes: String(log.minutes) });
  }

  async function saveEditLog(id: string) {
    const minutes = Number(editLog.minutes);
    if (!editLog.date || !Number.isFinite(minutes) || minutes <= 0) {
      setMessage("Enter valid minutes for the workout.");
      return;
    }
    setIsBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/workouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: editLog.date, exercise: editLog.category, minutes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update workout.");
      setLogs(data.logs || []);
      setEditingLogId(null);
      setMessage("Workout updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update workout.");
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteWorkout(id: string) {
    if (confirmDeleteLog !== id) { setConfirmDeleteLog(id); return; }
    setIsBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete workout.");
      setLogs(data.logs || []);
      setConfirmDeleteLog(null);
      if (editingLogId === id) setEditingLogId(null);
      setMessage("Workout deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete workout.");
    } finally {
      setIsBusy(false);
    }
  }

  function editWeight(log: WeightLog) {
    setConfirmDeleteWeight(null);
    setWeightDate(log.date);
    setWeightValue(String(log.weight));
    setWeightUnit(log.unit === "lbs" ? "lbs" : "kg");
    setWeightNotes(log.notes || "");
    setWeightConstipation((CONSTIPATION_LEVELS as readonly string[]).includes(log.constipation || "") ? (log.constipation as Constipation) : "none");
    setMessage(`Editing ${formatDate(log.date)} — change values and tap Log Weight to update.`);
  }

  async function deleteWeight(date: string) {
    if (confirmDeleteWeight !== date) { setConfirmDeleteWeight(date); return; }
    setIsBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/weight/${date}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete weight log.");
      setWeightLogs(data.logs || []);
      setConfirmDeleteWeight(null);
      setMessage("Weight log deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete weight log.");
    } finally {
      setIsBusy(false);
    }
  }

  async function saveWeight(event: { preventDefault(): void }) {
    event.preventDefault();
    if (!weightValue) return;
    setIsBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: weightDate,
          weight: Number(weightValue),
          unit: weightUnit,
          notes: weightNotes,
          constipation: weightConstipation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save weight.");
      setWeightLogs(data.logs || []);
      setWeightValue("");
      setWeightNotes("");
      setWeightConstipation("none");
      setMessage("Weight logged.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save weight.");
    } finally {
      setIsBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setLogs([]);
    setWeightLogs([]);
    setGoalsText("");
    setMessage("Logged out.");
  }

  function copyReferral() {
    if (!user) return;
    navigator.clipboard.writeText(user.userId).then(() => {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    });
  }

  return (
    <section id="portal" style={{ background: "rgba(6,6,14,0.62)" }}>
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="section-label readable text-white/70">Member Tracker</p>
            <h2 className="font-oswald readable mt-3 text-5xl font-bold uppercase leading-none text-white sm:text-6xl">
              Register, Set Goals, Track Progress.
            </h2>
          </div>
          <p className="font-barlow readable max-w-2xl text-lg leading-7 text-white/85 lg:justify-self-end">
            Create your member ID, save training goals, log every gym day, and watch your progress grow.
          </p>
        </div>

        {message ? (
          <div className="mb-5 rounded-lg border border-yellow-400/30 bg-white/10 px-4 py-3 text-sm font-semibold text-yellow-100">
            {message}
          </div>
        ) : null}

        {!user ? (
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <form onSubmit={submitAuth} className="rounded-lg border border-white/10 bg-black/40 p-6">
              <div className="mb-6 flex rounded-lg border border-white/10 p-1">
                {(["register", "login"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={`min-h-10 flex-1 rounded-md text-sm font-bold capitalize transition ${
                      mode === item ? "bg-white text-black" : "text-white/40 hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-bold text-white" htmlFor="user-id">User ID</label>
              <input
                id="user-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="your_id"
                className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-white px-4 text-sm font-semibold text-black outline-none transition focus:border-white"
              />

              <label className="mt-5 block text-sm font-bold text-white" htmlFor="password">Password</label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="min-h-12 w-full rounded-lg border border-white/10 bg-white px-4 pr-12 text-sm font-semibold text-black outline-none transition focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-black/45 transition hover:text-black"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {mode === "register" && (
                <>
                  <label className="mt-5 block text-sm font-bold text-white/60" htmlFor="referral">
                    Referral Code <span className="font-normal text-white/30">(optional)</span>
                  </label>
                  <input
                    id="referral"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    placeholder="Friend's user ID"
                    className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none transition focus:border-white"
                  />
                </>
              )}

              <button
                type="submit"
                disabled={isBusy}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-white px-6 text-sm font-black text-black transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? "Working..." : mode === "register" ? "Create Account" : "Log In"}
              </button>
            </form>

            <div className="rounded-lg border border-white/10 bg-white/10 p-6 text-white">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/50">What you get</p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  ["Workout graph", "Log exercises and minutes to see consistency over time."],
                  ["Weight history", "Track your body weight and visualise your trend."],
                  ["Goal list", "Write targets like fat loss, strength, and endurance."],
                  ["Referral perks", "Share your member ID and earn community credit."],
                ].map(([title, desc]) => (
                  <div key={title} className="border-l-4 border-white/40 pl-4">
                    <h3 className="text-xl font-black text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/55">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
            {/* Left column */}
            <div className="min-w-0 space-y-5">
              {/* User info + referral */}
              <div className="rounded-lg border border-white/10 bg-black/40 p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Logged in as</p>
                    <h3 className="mt-2 text-3xl font-black text-white">{user.userId}</h3>
                    {user.referredBy && (
                      <p className="mt-1 text-xs text-white/35">Referred by: {user.referredBy}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/60 transition hover:border-white/60 hover:text-white"
                  >
                    Logout
                  </button>
                </div>

                {/* Referral code */}
                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40 mb-2">Your Referral Code</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-white/5 px-3 py-2 text-sm font-mono text-white/80 border border-white/10">
                      {user.userId}
                    </code>
                    <button
                      type="button"
                      onClick={copyReferral}
                      className="rounded border border-white/20 px-3 py-2 text-xs font-bold text-white/50 transition hover:border-white hover:text-white"
                    >
                      {referralCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-white/30">
                    {user.referralCount > 0
                      ? `${user.referralCount} member${user.referralCount > 1 ? "s" : ""} joined using your code.`
                      : "Share this code with friends to earn referral credit."}
                  </p>
                </div>
              </div>

              {/* Goals */}
              <form onSubmit={saveGoals} className="rounded-lg border border-white/10 bg-black/40 p-6">
                <label className="text-sm font-bold uppercase tracking-[0.2em] text-white/70" htmlFor="goals">
                  Your goals
                </label>
                <textarea
                  id="goals"
                  value={goalsText}
                  onChange={(e) => setGoalsText(e.target.value)}
                  rows={7}
                  placeholder={"Build strength\nLose 5 kg\nTrain 4 days per week"}
                  className="mt-4 w-full rounded-lg border border-white/10 bg-white p-4 text-sm font-semibold leading-6 text-black outline-none transition focus:border-white"
                />
                <button
                  type="submit"
                  disabled={isBusy}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-white px-6 text-sm font-black text-black transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save Goals
                </button>
              </form>
            </div>

            {/* Right column */}
            <div className="min-w-0 space-y-5">
              {/* Tab selector */}
              <div className="flex rounded-lg border border-white/10 bg-black/40 p-1">
                {(["workouts", "weight"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setRightTab(tab)}
                    className={`min-h-10 flex-1 rounded-md text-sm font-bold capitalize transition ${
                      rightTab === tab ? "bg-white text-black" : "text-white/40 hover:text-white"
                    }`}
                  >
                    {tab === "workouts" ? "Workout Tracker" : "Weight History"}
                  </button>
                ))}
              </div>

              {/* Workouts tab */}
              {rightTab === "workouts" && (
                <>
                  <form onSubmit={saveWorkout} className="rounded-lg border border-white/10 bg-white/10 p-6 text-white">
                    <div className="max-w-xs">
                      <label className="text-sm font-black" htmlFor="workout-date">Day</label>
                      <input
                        id="workout-date"
                        type="date"
                        value={workoutDate}
                        onChange={(e) => setWorkoutDate(e.target.value)}
                        className="mt-2 min-h-12 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-bold text-white outline-none focus:border-white"
                      />
                    </div>

                    <p className="mt-5 text-sm font-black">Exercises</p>
                    <p className="mt-1 text-xs text-white/40">Add every muscle group you trained today with its own minutes.</p>

                    <div className="mt-3 space-y-3">
                      {entries.map((row, i) => (
                        <div key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 sm:gap-3">
                          <select
                            aria-label="Exercise category"
                            value={row.category}
                            onChange={(e) => updateEntryRow(i, { category: e.target.value as Category })}
                            className="min-h-12 w-full min-w-0 rounded-lg border border-white/20 bg-white px-3 text-sm font-bold capitalize text-black outline-none focus:border-white"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c} className="capitalize">{c}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1.5">
                            <input
                              aria-label="Minutes"
                              type="number"
                              min="1"
                              max="600"
                              value={row.minutes}
                              onChange={(e) => updateEntryRow(i, { minutes: e.target.value })}
                              className="min-h-12 w-20 rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-bold text-white outline-none focus:border-white"
                            />
                            <span className="text-xs font-bold text-white/40">min</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEntryRow(i)}
                            disabled={entries.length === 1}
                            aria-label="Remove exercise"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-lg font-black text-white/50 transition hover:border-red-400/60 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            −
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addEntryRow}
                      disabled={entries.length >= CATEGORIES.length}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-white/60 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <span className="text-base leading-none">+</span> Add exercise
                    </button>

                    <button
                      type="submit"
                      disabled={isBusy}
                      className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-black px-6 text-sm font-black text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      Log Workout
                    </button>
                  </form>

                  <div className="rounded-lg border border-white/10 bg-black/40 p-6">
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Consistency</p>
                        <h3 className="mt-2 text-3xl font-black text-white">{consistency}%</h3>
                      </div>
                      <p className="text-sm text-white/40">{rangeLabel}</p>
                    </div>

                    <div className="mb-5 grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[1fr_1fr_auto]">
                      <div>
                        <label className="text-xs font-black uppercase tracking-[0.18em] text-white/40" htmlFor="range-start">From</label>
                        <input
                          id="range-start"
                          type="date"
                          value={rangeStart}
                          onChange={(e) => { setRangeStart(e.target.value); setActiveDay(null); }}
                          className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-black px-3 text-sm font-bold text-white outline-none focus:border-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase tracking-[0.18em] text-white/40" htmlFor="range-end">To</label>
                        <input
                          id="range-end"
                          type="date"
                          value={rangeEnd}
                          onChange={(e) => { setRangeEnd(e.target.value); setActiveDay(null); }}
                          className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-black px-3 text-sm font-bold text-white outline-none focus:border-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => { setRangeStart(""); setRangeEnd(""); setActiveDay(null); }}
                        className="min-h-11 self-end rounded-lg border border-white/30 px-4 text-sm font-black text-white/60 transition hover:bg-white hover:text-black"
                      >
                        All Time
                      </button>
                    </div>

                    {/* Attendance bar chart */}
                    <div
                      className="relative overflow-x-auto rounded-lg border border-white/[0.07]"
                      style={{ background: "rgba(8,8,18,0.80)" }}
                      onMouseLeave={() => setActiveDay(null)}
                    >
                      <div className="relative" style={{ minWidth: chartMinWidth, height: 220, padding: "16px 16px 0" }}>
                        {/* Y-axis grid lines */}
                        <div className="pointer-events-none absolute inset-x-4 top-4" style={{ bottom: 52 }}>
                          {[100, 75, 50, 25].map((pct) => (
                            <div
                              key={pct}
                              className="absolute w-full flex items-center gap-2"
                              style={{ bottom: `${pct}%` }}
                            >
                              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", width: 22, textAlign: "right", flexShrink: 0 }}>
                                {pct}%
                              </span>
                              <div style={{ flex: 1, height: 1, borderTop: "1px dashed rgba(255,255,255,0.06)" }} />
                            </div>
                          ))}
                        </div>

                        {/* Bars — stacked by muscle group */}
                        <div
                          className="absolute flex items-end gap-1.5"
                          style={{ left: 40, right: 16, top: 16, bottom: 52 }}
                        >
                          {chartDays.map((day) => {
                            const isActive = day.minutes > 0;
                            const isHovered = activeDay?.date === day.date;
                            const segTotal = day.breakdown.reduce((a, s) => a + s.pct, 0) || 1;
                            return (
                              <button
                                key={day.date}
                                type="button"
                                onMouseEnter={() => setActiveDay(day)}
                                onFocus={() => setActiveDay(day)}
                                onBlur={() => setActiveDay(null)}
                                className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
                              >
                                {/* Minute label on bar top */}
                                {isActive && (
                                  <span style={{
                                    fontSize: 8,
                                    fontWeight: 700,
                                    color: isHovered ? "#fff" : "rgba(255,255,255,0.5)",
                                    marginBottom: 3,
                                    transition: "color 0.15s",
                                  }}>
                                    {day.minutes}m
                                  </span>
                                )}
                                {/* Stacked bar */}
                                {isActive ? (
                                  <div
                                    style={{
                                      width: "100%",
                                      height: `${Math.max(6, day.percent)}%`,
                                      borderRadius: "3px 3px 0 0",
                                      overflow: "hidden",
                                      display: "flex",
                                      flexDirection: "column",
                                      justifyContent: "flex-end",
                                      boxShadow: isHovered ? "0 0 14px rgba(56,189,248,0.45)" : "none",
                                      filter: isHovered ? "brightness(1.12)" : "none",
                                      opacity: isHovered ? 1 : 0.9,
                                      transition: "box-shadow 0.15s, opacity 0.15s, filter 0.15s",
                                    }}
                                  >
                                    {day.breakdown.slice().reverse().map((seg, si) => (
                                      <div
                                        key={seg.category}
                                        title={`${seg.category}: ${seg.minutes}m`}
                                        style={{
                                          height: `${(seg.pct / segTotal) * 100}%`,
                                          background: CATEGORY_COLOR[seg.category],
                                          borderTop: si > 0 ? "1px solid rgba(8,8,18,0.55)" : "none",
                                        }}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "3%",
                                      borderRadius: "3px 3px 0 0",
                                      background: "rgba(255,255,255,0.05)",
                                      border: "1px solid rgba(255,255,255,0.07)",
                                    }}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* X-axis labels */}
                        <div
                          className="absolute flex items-start gap-1.5"
                          style={{ left: 40, right: 16, bottom: 0, height: 48 }}
                        >
                          {chartDays.map((day) => (
                            <div key={day.date} className="flex flex-1 flex-col items-center pt-2 gap-0.5">
                              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
                                {day.dayShort}
                              </span>
                              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)" }}>
                                {day.dateNum}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Hover tooltip — aligned to the hovered bar, scrolls with it */}
                        {activeDay && (() => {
                          const idx = chartDays.findIndex((d) => d.date === activeDay.date);
                          const n = chartDays.length || 1;
                          const centerPx = 40 + ((idx + 0.5) / n) * (chartMinWidth - 56);
                          const tipW = 180;
                          const left = Math.min(chartMinWidth - tipW / 2 - 6, Math.max(tipW / 2 + 6, centerPx));
                          return (
                            <div
                              className="pointer-events-none absolute z-40 -translate-x-1/2 rounded-lg border border-white/10 bg-black/95 p-3 shadow-2xl"
                              style={{ left, top: 8, width: tipW }}
                            >
                              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
                                {activeDay.dayShort} — {formatDate(activeDay.date)}
                              </p>
                              <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginTop: 4 }}>
                                {activeDay.minutes > 0 ? `${activeDay.minutes} min total` : "Rest day"}
                              </p>
                              {activeDay.breakdown.length > 0 && (
                                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                                  {activeDay.breakdown.map((seg) => (
                                    <div key={seg.category} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                      <span style={{ width: 9, height: 9, borderRadius: 2, background: CATEGORY_COLOR[seg.category], flexShrink: 0 }} />
                                      <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "capitalize" }}>
                                        {seg.category}
                                      </span>
                                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{seg.minutes}m</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Legend — one chip per muscle group */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        {CATEGORIES.map((c) => (
                          <div key={c} className="flex items-center gap-1.5">
                            <span style={{ width: 12, height: 8, borderRadius: 2, background: CATEGORY_COLOR[c] }} />
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>{c}</span>
                          </div>
                        ))}
                        <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{rangeLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Per-exercise breakdown — one graph, each day's exercises side by side */}
                  <div className="rounded-lg border border-white/10 bg-black/40 p-6">
                    <div className="mb-1 flex items-end justify-between gap-2">
                      <h3 className="text-xl font-black text-white">By muscle group</h3>
                      <p className="text-xs text-white/40">{rangeLabel}</p>
                    </div>
                    <p className="mb-5 text-sm text-white/40">Total minutes per muscle group over the selected range.</p>
                    <MuscleGroupCharts days={chartDays} />
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/40 p-6">
                    <h3 className="text-xl font-black text-white">Recent workouts</h3>
                    <div className="mt-5 space-y-3">
                      {logs.slice(0, 10).map((log) =>
                        editingLogId === log.id ? (
                          <div key={log.id} className="rounded-lg border border-white/15 bg-white/[0.07] p-4">
                            <div className="grid gap-2 sm:grid-cols-3">
                              <input
                                type="date"
                                aria-label="Workout date"
                                value={editLog.date}
                                onChange={(e) => setEditLog((p) => ({ ...p, date: e.target.value }))}
                                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-bold text-white outline-none focus:border-white"
                              />
                              <select
                                aria-label="Exercise category"
                                value={editLog.category}
                                onChange={(e) => setEditLog((p) => ({ ...p, category: e.target.value as Category }))}
                                className="min-h-11 w-full rounded-lg border border-white/20 bg-white px-3 text-sm font-bold capitalize text-black outline-none focus:border-white"
                              >
                                {CATEGORIES.map((c) => (
                                  <option key={c} value={c} className="capitalize">{c}</option>
                                ))}
                              </select>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  max="600"
                                  aria-label="Minutes"
                                  value={editLog.minutes}
                                  onChange={(e) => setEditLog((p) => ({ ...p, minutes: e.target.value }))}
                                  className="min-h-11 w-20 rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-bold text-white outline-none focus:border-white"
                                />
                                <span className="text-xs font-bold text-white/40">min</span>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() => saveEditLog(log.id)}
                                disabled={isBusy}
                                className="rounded-lg bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-black transition hover:bg-white/80 disabled:opacity-60"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingLogId(null)}
                                className="rounded-lg border border-white/20 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/60 transition hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/[0.04] p-4">
                            <div className="min-w-0">
                              <p className="font-bold capitalize text-white">{log.exercise}</p>
                              <p className="mt-1 text-sm text-white/40">{formatDate(log.date)}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <p className="text-lg font-black text-white/70">{log.minutes}m</p>
                              <button
                                type="button"
                                onClick={() => startEditLog(log)}
                                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white/60 transition hover:border-white/60 hover:text-white"
                              >
                                Edit
                              </button>
                              {confirmDeleteLog === log.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => deleteWorkout(log.id)}
                                    disabled={isBusy}
                                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-300 transition disabled:opacity-60"
                                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)" }}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteLog(null)}
                                    className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-white/40 transition hover:text-white"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => deleteWorkout(log.id)}
                                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/40 transition hover:border-red-400/60 hover:text-red-300"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                      {logs.length === 0 && (
                        <p className="rounded-lg bg-white/[0.04] p-4 text-sm text-white/40">
                          No workouts yet. Log today&apos;s training to start the graph.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Weight tab */}
              {rightTab === "weight" && (
                <>
                  <form onSubmit={saveWeight} className="rounded-lg border border-white/10 bg-white/10 p-6 text-white">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-sm font-black" htmlFor="weight-date">Date</label>
                        <input
                          id="weight-date"
                          type="date"
                          value={weightDate}
                          onChange={(e) => setWeightDate(e.target.value)}
                          className="mt-2 min-h-12 w-full rounded-lg border border-black/10 px-4 text-sm font-bold outline-none focus:border-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-black" htmlFor="weight-val">Weight</label>
                        <input
                          id="weight-val"
                          type="number"
                          step="0.1"
                          min="1"
                          max="999"
                          value={weightValue}
                          onChange={(e) => setWeightValue(e.target.value)}
                          placeholder="75.5"
                          className="mt-2 min-h-12 w-full rounded-lg border border-black/10 px-4 text-sm font-bold outline-none focus:border-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-black" htmlFor="weight-unit">Unit</label>
                        <select
                          id="weight-unit"
                          value={weightUnit}
                          onChange={(e) => setWeightUnit(e.target.value as "kg" | "lbs")}
                          className="mt-2 min-h-12 w-full rounded-lg border border-black/10 px-4 text-sm font-bold outline-none focus:border-white bg-white text-black"
                        >
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_200px]">
                      <div>
                        <label className="text-sm font-black" htmlFor="weight-notes">Notes</label>
                        <textarea
                          id="weight-notes"
                          value={weightNotes}
                          onChange={(e) => setWeightNotes(e.target.value)}
                          rows={2}
                          maxLength={500}
                          placeholder="What you ate, how you felt, sleep, water…"
                          className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white placeholder:text-white/30 outline-none focus:border-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-black" htmlFor="weight-constipation">Constipation</label>
                        <select
                          id="weight-constipation"
                          value={weightConstipation}
                          onChange={(e) => setWeightConstipation(e.target.value as Constipation)}
                          className="mt-2 min-h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-sm font-bold capitalize text-black outline-none focus:border-white"
                        >
                          {CONSTIPATION_LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>{CONSTIPATION_LABEL[lvl]}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isBusy || !weightValue}
                      className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg bg-black px-6 text-sm font-black text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Log Weight
                    </button>
                  </form>

                  {/* Weight chart */}
                  {weightLogs.length > 0 && (
                    <div className="rounded-lg border border-white/10 bg-black/40 p-6">
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70 mb-4">Weight Trend</p>
                      <WeightChart logs={weightLogs} />
                    </div>
                  )}

                  <div className="rounded-lg border border-white/10 bg-black/40 p-6">
                    <h3 className="text-xl font-black text-white">Weight History</h3>
                    <div className="mt-5 space-y-3">
                      {weightLogs.slice(0, 10).map((log) => {
                        const lvl = (CONSTIPATION_LEVELS as readonly string[]).includes(log.constipation || "")
                          ? (log.constipation as Constipation)
                          : "none";
                        return (
                          <div key={log.date} className="flex items-start justify-between gap-4 rounded-lg bg-white/[0.04] p-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm text-white/50">{formatDate(log.date)}</p>
                                {lvl !== "none" && (
                                  <span
                                    className="rounded px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide"
                                    style={{ background: `${CONSTIPATION_COLOR[lvl]}22`, color: CONSTIPATION_COLOR[lvl] }}
                                  >
                                    Constipation: {lvl}
                                  </span>
                                )}
                              </div>
                              {log.notes && (
                                <p className="mt-1.5 text-sm leading-5 text-white/45">{log.notes}</p>
                              )}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <p className="text-lg font-black text-white">
                                {log.weight} <span className="text-sm font-normal text-white/40">{log.unit}</span>
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => editWeight(log)}
                                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white/60 transition hover:border-white/60 hover:text-white"
                                >
                                  Edit
                                </button>
                                {confirmDeleteWeight === log.date ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => deleteWeight(log.date)}
                                      disabled={isBusy}
                                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-300 transition disabled:opacity-60"
                                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)" }}
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteWeight(null)}
                                      className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-white/40 transition hover:text-white"
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => deleteWeight(log.date)}
                                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/40 transition hover:border-red-400/60 hover:text-red-300"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {weightLogs.length === 0 && (
                        <p className="rounded-lg bg-white/[0.04] p-4 text-sm text-white/40">
                          No weight entries yet. Log your first entry above.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Weight Chart ─────────────────────────────────────────────────────── */
function normalizeConstipation(value?: string): Constipation {
  return (CONSTIPATION_LEVELS as readonly string[]).includes(value || "")
    ? (value as Constipation)
    : "none";
}

function WeightChart({ logs }: { logs: WeightLog[] }) {
  const [active, setActive] = useState<number | null>(null);

  const sorted = useMemo(
    () => [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-30),
    [logs],
  );

  if (sorted.length < 2) return null;

  const weights = sorted.map((l) => l.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const points = sorted.map((l, i) => ({
    x: sorted.length === 1 ? 50 : (i / (sorted.length - 1)) * 100,
    y: 100 - ((l.weight - minW) / range) * 90,
    weight: l.weight,
    unit: l.unit,
    date: l.date,
    notes: l.notes || "",
    level: normalizeConstipation(l.constipation),
  }));

  const path = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, "");

  const act = active !== null ? points[active] : null;

  return (
    <div>
      <div style={{ height: 170, position: "relative" }} onMouseLeave={() => setActive(null)}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
          <path d={path} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Dots + hover targets (HTML overlay so tooltips aren't distorted by the stretched SVG) */}
        {points.map((p, i) => {
          const color = p.level === "none" ? "#facc15" : CONSTIPATION_COLOR[p.level];
          const isActive = active === i;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${p.date}: ${p.weight} ${p.unit}, ${CONSTIPATION_LABEL[p.level]}`}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: "translate(-50%, -50%)",
                width: 22,
                height: 22,
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span
                style={{
                  width: isActive ? 12 : 7,
                  height: isActive ? 12 : 7,
                  borderRadius: "50%",
                  background: color,
                  border: "2px solid rgba(8,8,18,0.9)",
                  boxShadow: isActive ? `0 0 10px ${color}` : "none",
                  transition: "width 0.12s, height 0.12s",
                }}
              />
            </button>
          );
        })}

        {/* Hover tooltip */}
        {act && (() => {
          const clampLeft = Math.min(82, Math.max(18, act.x));
          return (
            <div
              className="pointer-events-none absolute z-30 -translate-x-1/2 rounded-lg border border-white/10 bg-black/95 p-3 shadow-2xl"
              style={{ left: `${clampLeft}%`, top: 0, width: 190 }}
            >
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                {formatDate(act.date)}
              </p>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginTop: 2 }}>
                {act.weight} <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>{act.unit}</span>
              </p>
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: act.level === "none" ? "#34d399" : CONSTIPATION_COLOR[act.level], flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                  {act.level === "none" ? "No constipation" : `Constipation: ${act.level}`}
                </span>
              </div>
              {act.notes && (
                <p style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>{act.notes}</p>
              )}
            </div>
          );
        })()}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.30)" }}>{formatDate(sorted[0].date)}</span>
        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.30)" }}>{formatDate(sorted[sorted.length - 1].date)}</span>
      </div>
    </div>
  );
}

/* ── Chart types + helpers ────────────────────────────────────────────── */
type ChartSeg = { category: Category; minutes: number; pct: number };
type ChartDay = {
  date: string; minutes: number; percent: number;
  breakdown: ChartSeg[]; dayShort: string; dateNum: string;
};

function buildChartDays(logs: WorkoutLog[], rangeStart: string, rangeEnd: string): ChartDay[] {
  // date -> (category -> minutes)
  const byDate = new Map<string, Map<Category, number>>();

  logs.forEach((log) => {
    const cat = categorize(log.exercise);
    const dayMap = byDate.get(log.date) ?? new Map<Category, number>();
    dayMap.set(cat, (dayMap.get(cat) || 0) + log.minutes);
    byDate.set(log.date, dayMap);
  });

  const dates = logs.map((l) => l.date).sort();
  const startKey = rangeStart || dates[0] || today;
  const endKey = rangeEnd || dates[dates.length - 1] || today;
  const [safeStart, safeEnd] = startKey <= endKey ? [startKey, endKey] : [endKey, startKey];

  const days: { date: string; total: number; catMap?: Map<Category, number>; dayShort: string; dateNum: string }[] = [];
  const cursor = new Date(`${safeStart}T12:00:00`);
  const endDate = new Date(`${safeEnd}T12:00:00`);

  while (cursor <= endDate) {
    const key = cursor.toISOString().slice(0, 10);
    const d = new Date(`${key}T12:00:00`);
    const catMap = byDate.get(key);
    const total = catMap ? [...catMap.values()].reduce((a, b) => a + b, 0) : 0;
    days.push({
      date: key,
      total,
      catMap,
      dayShort: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateNum: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxMinutes = Math.max(60, ...days.map((d) => d.total));
  // Newest first: latest day on the left, scroll right for older logs.
  return days
    .map((day) => {
      const percent = Math.min(100, Math.round((day.total / maxMinutes) * 100));
      const breakdown: ChartSeg[] = CATEGORIES.filter((c) => day.catMap?.get(c)).map((c) => {
        const minutes = day.catMap!.get(c)!;
        return { category: c, minutes, pct: (minutes / maxMinutes) * 100 };
      });
      return { date: day.date, minutes: day.total, percent, breakdown, dayShort: day.dayShort, dateNum: day.dateNum };
    })
    .reverse();
}

function buildRangeLabel(days: ChartDay[], rangeStart: string, rangeEnd: string) {
  if (days.length === 0) return "All time";
  const prefix = rangeStart || rangeEnd ? "Filtered" : "All time";
  const dates = days.map((d) => d.date);
  const lo = dates.reduce((a, b) => (a < b ? a : b));
  const hi = dates.reduce((a, b) => (a > b ? a : b));
  return `${prefix}: ${formatDate(lo)} to ${formatDate(hi)}`;
}

/* Render an ISO yyyy-mm-dd date as dd/mm/yyyy. */
function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/* ── Muscle-group totals chart ────────────────────────────────────────── */
/* One bar per muscle group; height = summed minutes for that group over the
   selected range. */
function MuscleGroupCharts({ days }: { days: ChartDay[] }) {
  const totals = new Map<Category, number>();
  days.forEach((d) =>
    d.breakdown.forEach((s) => totals.set(s.category, (totals.get(s.category) || 0) + s.minutes)),
  );

  const data = CATEGORIES.filter((c) => (totals.get(c) || 0) > 0).map((c) => ({
    category: c,
    minutes: totals.get(c)!,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-white/40">No exercises logged in this range yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.minutes));

  return (
    <div className="rounded-lg border border-white/[0.07] p-5" style={{ background: "rgba(8,8,18,0.80)" }}>
      <div className="flex items-end justify-around gap-3" style={{ height: 260 }}>
        {data.map((d) => (
          <div key={d.category} className="flex h-full flex-1 flex-col items-center" style={{ maxWidth: 96 }}>
            {/* bar + value sit at the bottom of a growing area */}
            <div className="flex w-full flex-col items-center justify-end" style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 6, whiteSpace: "nowrap" }}>
                {d.minutes} min
              </span>
              <div
                title={`${d.category}: ${d.minutes} min total`}
                style={{
                  width: "72%",
                  maxWidth: 60,
                  height: `${Math.max(4, (d.minutes / max) * 85)}%`,
                  background: `linear-gradient(to top, ${CATEGORY_COLOR[d.category]}, ${CATEGORY_COLOR[d.category]}bb)`,
                  borderRadius: "4px 4px 0 0",
                  boxShadow: `0 0 18px ${CATEGORY_COLOR[d.category]}33`,
                }}
              />
            </div>
            <span
              className="capitalize"
              style={{ marginTop: 10, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.65)" }}
            >
              {d.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
