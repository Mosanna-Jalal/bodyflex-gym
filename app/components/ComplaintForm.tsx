"use client";

import { useState } from "react";

const B = "1px solid rgba(255,255,255,0.07)";

export default function ComplaintForm() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 10) return;
    setStatus("sending");

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (res.ok) {
        setStatus("done");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{ border: B, background: "rgba(6,6,6,0.84)", padding: "2.5rem", maxWidth: 640 }}>
      <p
        style={{
          fontSize: "0.62rem",
          letterSpacing: "0.28em",
          color: "rgba(255,255,255,0.30)",
          textTransform: "uppercase",
          marginBottom: "0.5rem",
        }}
      >
        / Anonymous
      </p>
      <h3
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: "clamp(1.5rem,4vw,2.2rem)",
          letterSpacing: "0.06em",
          color: "#fff",
          lineHeight: 1.1,
          marginBottom: "1.5rem",
        }}
      >
        Submit a Complaint
      </h3>

      {status === "done" ? (
        <div
          style={{
            border: "1px solid rgba(74,222,128,0.25)",
            background: "rgba(74,222,128,0.05)",
            padding: "1.25rem",
            marginBottom: "1rem",
          }}
        >
          <p style={{ fontSize: "0.88rem", color: "rgba(74,222,128,0.9)", letterSpacing: "0.05em" }}>
            Your complaint has been received. Thank you for the feedback.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              htmlFor="complaint"
              style={{
                display: "block",
                fontSize: "0.62rem",
                letterSpacing: "0.22em",
                color: "rgba(255,255,255,0.38)",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}
            >
              Your message (no name required)
            </label>
            <textarea
              id="complaint"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue, suggestion, or concern…"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#fff",
                padding: "0.75rem 0.9rem",
                fontSize: "0.9rem",
                fontFamily: "inherit",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          {status === "error" && (
            <p style={{ fontSize: "0.8rem", color: "rgba(239,68,68,0.85)" }}>
              Could not submit. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "sending" || message.trim().length < 10}
            style={{
              alignSelf: "flex-start",
              background: "#fff",
              color: "#000",
              border: "none",
              padding: "0.75rem 2rem",
              fontSize: "0.76rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: status === "sending" ? "wait" : "pointer",
              opacity: message.trim().length < 10 ? 0.4 : 1,
            }}
          >
            {status === "sending" ? "Sending…" : "Send Anonymously"}
          </button>
        </form>
      )}
    </div>
  );
}
