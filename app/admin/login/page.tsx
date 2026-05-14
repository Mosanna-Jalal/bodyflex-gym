"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password.");
      }
    } catch {
      setError("Could not connect. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080808",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
          <span
            style={{
              background: "#fff",
              color: "#000",
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: "0.85rem",
              letterSpacing: "0.06em",
            }}
          >
            AR
          </span>
          <div>
            <p style={{ fontWeight: 700, letterSpacing: "0.14em", fontSize: "1rem", color: "#fff" }}>
              AR FITNESS
            </p>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.22em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              Admin Panel
            </p>
          </div>
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "2rem" }}>
          <h1
            style={{
              fontSize: "0.72rem",
              letterSpacing: "0.25em",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            Owner Login
          </h1>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label
                htmlFor="pw"
                style={{
                  display: "block",
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem",
                }}
              >
                Password
              </label>
              <input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#fff",
                  padding: "0.65rem 0.85rem",
                  fontSize: "0.9rem",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <p style={{ fontSize: "0.8rem", color: "rgba(239,68,68,0.85)", letterSpacing: "0.05em" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#fff",
                color: "#000",
                border: "none",
                padding: "0.75rem",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.75 : 1,
                marginTop: "0.25rem",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.72rem", letterSpacing: "0.14em", color: "rgba(255,255,255,0.2)" }}>
          <a href="/" style={{ color: "inherit", textDecoration: "none" }}>← Back to site</a>
        </p>
      </div>
    </div>
  );
}
