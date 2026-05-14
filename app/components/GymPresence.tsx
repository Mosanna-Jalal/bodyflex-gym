"use client";

import { useEffect, useState } from "react";

type Presence = {
  current: number;
  capacity: number;
  updatedAt: string;
};

export default function GymPresence() {
  const [data, setData] = useState<Presence | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/presence")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  const pct = data.capacity > 0 ? Math.min(100, Math.round((data.current / data.capacity) * 100)) : 0;
  const color =
    pct >= 85
      ? "rgba(239,68,68,0.92)"
      : pct >= 60
        ? "rgba(251,191,36,0.92)"
        : "rgba(74,222,128,0.92)";

  const statusLabel = pct >= 85 ? "Busy" : pct >= 60 ? "Moderate" : "Quiet";

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(6,6,6,0.84)",
        padding: "1.6rem 2rem",
        minWidth: 200,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
        <p
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.26em",
            color: "rgba(255,255,255,0.30)",
            textTransform: "uppercase",
          }}
        >
          Live Occupancy
        </p>
        <span
          style={{
            fontSize: "0.58rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color,
            fontWeight: 700,
          }}
        >
          ● {statusLabel}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", marginBottom: "0.75rem" }}>
        <span
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "2.6rem",
            letterSpacing: "0.04em",
            color,
            lineHeight: 1,
          }}
        >
          {data.current}
        </span>
        <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.30)" }}>
          / {data.capacity} members
        </span>
      </div>

      <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 2,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}
