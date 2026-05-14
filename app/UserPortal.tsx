"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  userId: string;
  goals: string[];
  referredBy: string | null;
  referralCount: number;
};

type WorkoutLog = {
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
};

const today = new Date().toISOString().slice(0, 10);

export default function UserPortal() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [goalsText, setGoalsText] = useState("");
  const [workoutDate, setWorkoutDate] = useState(today);
  const [exercise, setExercise] = useState("");
  const [minutes, setMinutes] = useState("45");
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [weightDate, setWeightDate] = useState(today);
  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
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
        const data = await res.json();
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
      const data = await res.json();
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

  async function saveWorkout(event: { preventDefault(): void }) {
    event.preventDefault();
    setIsBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: workoutDate, exercise, minutes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save workout.");
      setLogs(data.logs || []);
      setExercise("");
      setMinutes("45");
      setMessage("Workout logged.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save workout.");
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
        body: JSON.stringify({ date: weightDate, weight: Number(weightValue), unit: weightUnit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save weight.");
      setWeightLogs(data.logs || []);
      setWeightValue("");
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
    <section id="portal" style={{ background: "transparent" }}>
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="section-label text-white/60">Member Tracker</p>
            <h2 className="font-oswald mt-3 text-5xl font-bold uppercase leading-none text-white sm:text-6xl">
              Register, Set Goals, Track Progress.
            </h2>
          </div>
          <p className="font-barlow max-w-2xl text-lg leading-7 text-zinc-400 lg:justify-self-end">
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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-white px-4 text-sm font-semibold text-black outline-none transition focus:border-white"
              />

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
            <div className="space-y-5">
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
            <div className="space-y-5">
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
                    <div className="grid gap-4 lg:grid-cols-[0.7fr_1fr_0.45fr]">
                      <div className="min-w-0">
                        <label className="text-sm font-black" htmlFor="workout-date">Day</label>
                        <input
                          id="workout-date"
                          type="date"
                          value={workoutDate}
                          onChange={(e) => setWorkoutDate(e.target.value)}
                          className="mt-2 min-h-12 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-bold text-white outline-none focus:border-white"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="text-sm font-black" htmlFor="exercise">Exercise</label>
                        <input
                          id="exercise"
                          value={exercise}
                          onChange={(e) => setExercise(e.target.value)}
                          placeholder="Chest, cardio, yoga…"
                          className="mt-2 min-h-12 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-bold text-white placeholder:text-white/30 outline-none focus:border-white"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="text-sm font-black" htmlFor="minutes">Minutes</label>
                        <input
                          id="minutes"
                          type="number"
                          min="1"
                          max="600"
                          value={minutes}
                          onChange={(e) => setMinutes(e.target.value)}
                          className="mt-2 min-h-12 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-bold text-white outline-none focus:border-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg bg-black px-6 text-sm font-black text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
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

                        {/* Bars */}
                        <div
                          className="absolute flex items-end gap-1.5"
                          style={{ left: 40, right: 16, top: 16, bottom: 52 }}
                        >
                          {chartDays.map((day) => {
                            const isActive = day.minutes > 0;
                            const isHovered = activeDay?.date === day.date;
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
                                {/* Bar */}
                                <div
                                  style={{
                                    width: "100%",
                                    height: `${Math.max(isActive ? 6 : 3, day.percent)}%`,
                                    borderRadius: "3px 3px 0 0",
                                    background: isActive
                                      ? "linear-gradient(to top, #0369a1, #38bdf8, #818cf8)"
                                      : "rgba(255,255,255,0.05)",
                                    boxShadow: isActive && isHovered
                                      ? "0 0 14px rgba(56,189,248,0.45)"
                                      : "none",
                                    border: isActive ? "none" : "1px solid rgba(255,255,255,0.07)",
                                    transition: "box-shadow 0.15s, opacity 0.15s",
                                    opacity: !isActive ? 1 : (isHovered ? 1 : 0.85),
                                  }}
                                />
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

                        {/* Hover tooltip */}
                        {activeDay && (() => {
                          const idx = chartDays.findIndex(d => d.date === activeDay.date);
                          const leftPct = chartDays.length > 1 ? (idx / (chartDays.length - 1)) * 100 : 50;
                          const clampedLeft = Math.min(78, Math.max(10, leftPct));
                          return (
                            <div
                              className="pointer-events-none absolute z-40 -translate-x-1/2 rounded-lg border border-white/10 bg-black/95 p-3 shadow-2xl"
                              style={{ left: `calc(40px + ${clampedLeft}% * ((100% - 56px) / 100))`, top: 8, minWidth: 140 }}
                            >
                              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
                                {activeDay.dayShort} — {activeDay.date}
                              </p>
                              <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginTop: 4 }}>
                                {activeDay.minutes > 0 ? `${activeDay.minutes} min` : "Rest day"}
                              </p>
                              {activeDay.exercises.length > 0 && (
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginTop: 4, lineHeight: 1.5 }}>
                                  {activeDay.exercises.join(", ")}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-5 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="flex items-center gap-2">
                          <div style={{ width: 20, height: 8, borderRadius: 2, background: "linear-gradient(to right, #0369a1, #818cf8)" }} />
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Trained</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div style={{ width: 20, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} />
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Rest</span>
                        </div>
                        <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{rangeLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/40 p-6">
                    <h3 className="text-xl font-black text-white">Recent workouts</h3>
                    <div className="mt-5 space-y-3">
                      {logs.slice(0, 6).map((log) => (
                        <div key={`${log.date}-${log.exercise}-${log.createdAt}`} className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.04] p-4">
                          <div>
                            <p className="font-bold text-white">{log.exercise}</p>
                            <p className="mt-1 text-sm text-white/40">{log.date}</p>
                          </div>
                          <p className="text-lg font-black text-white/70">{log.minutes}m</p>
                        </div>
                      ))}
                      {logs.length === 0 && (
                        <p className="rounded-lg bg-white/[0.04] p-4 text-sm text-white/40">
                          No workouts yet. Log today's training to start the graph.
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
                      {weightLogs.slice(0, 10).map((log) => (
                        <div key={log.date} className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.04] p-4">
                          <p className="text-sm text-white/50">{log.date}</p>
                          <p className="text-lg font-black text-white">
                            {log.weight} <span className="text-sm font-normal text-white/40">{log.unit}</span>
                          </p>
                        </div>
                      ))}
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
function WeightChart({ logs }: { logs: WeightLog[] }) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  if (sorted.length < 2) return null;

  const weights = sorted.map((l) => l.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const points = sorted.map((l, i) => ({
    x: (i / (sorted.length - 1)) * 100,
    y: 100 - ((l.weight - minW) / range) * 90,
    weight: l.weight,
    unit: l.unit,
    date: l.date,
  }));

  const path = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, "");

  return (
    <div style={{ height: 140, position: "relative" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <path d={path} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="#facc15" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.30)" }}>{sorted[0].date}</span>
        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.30)" }}>{sorted[sorted.length - 1].date}</span>
      </div>
    </div>
  );
}

/* ── Chart types + helpers ────────────────────────────────────────────── */
type ChartDay = {
  date: string; minutes: number; label: string;
  exercises: string[]; percent: number; x: number; y: number;
  dayShort: string; dateNum: string;
};

function buildChartDays(logs: WorkoutLog[], rangeStart: string, rangeEnd: string): ChartDay[] {
  const minutesByDate = new Map<string, number>();
  const exercisesByDate = new Map<string, string[]>();

  logs.forEach((log) => {
    minutesByDate.set(log.date, (minutesByDate.get(log.date) || 0) + log.minutes);
    exercisesByDate.set(log.date, [...(exercisesByDate.get(log.date) || []), log.exercise]);
  });

  const dates = logs.map((l) => l.date).sort();
  const startKey = rangeStart || dates[0] || today;
  const endKey = rangeEnd || dates[dates.length - 1] || today;
  const [safeStart, safeEnd] = startKey <= endKey ? [startKey, endKey] : [endKey, startKey];
  const days: Omit<ChartDay, "percent" | "x" | "y">[] = [];
  const cursor = new Date(`${safeStart}T12:00:00`);
  const endDate = new Date(`${safeEnd}T12:00:00`);

  while (cursor <= endDate) {
    const key = cursor.toISOString().slice(0, 10);
    const d = new Date(`${key}T12:00:00`);
    const dayShort = d.toLocaleDateString("en-US", { weekday: "short" });
    const dateNum = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    days.push({ date: key, minutes: minutesByDate.get(key) || 0, label: formatChartLabel(key), exercises: exercisesByDate.get(key) || [], dayShort, dateNum });
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxMinutes = Math.max(60, ...days.map((d) => d.minutes));
  return days.map((day, i) => {
    const percent = Math.min(100, Math.round((day.minutes / maxMinutes) * 100));
    return { ...day, percent, x: days.length === 1 ? 50 : (i / (days.length - 1)) * 100, y: 100 - percent };
  });
}

function buildRangeLabel(days: ChartDay[], rangeStart: string, rangeEnd: string) {
  if (days.length === 0) return "All time";
  const prefix = rangeStart || rangeEnd ? "Filtered" : "All time";
  return `${prefix}: ${days[0].date} to ${days[days.length - 1].date}`;
}

function formatChartLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
