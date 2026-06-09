"use client";

import { useEffect, useState } from "react";

/**
 * Full-screen gate shown until the background gym 3D model (#bg-gym-model)
 * finishes loading. It is server-rendered opaque (no content flash), shows real
 * download progress from model-viewer, locks scroll while loading, then fades
 * out to reveal the whole site at once.
 */
export default function Preloader() {
  const [ready, setReady] = useState(false); // model loaded -> start fade out
  const [hidden, setHidden] = useState(false); // fade finished -> unmount
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      setProgress(1);
      setReady(true);
    };

    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ totalProgress?: number }>).detail;
      if (detail && typeof detail.totalProgress === "number") {
        setProgress((p) => Math.max(p, detail.totalProgress!));
        if (detail.totalProgress >= 1) finish();
      }
    };

    let model: HTMLElement | null = null;
    const attach = () => {
      model = document.getElementById("bg-gym-model");
      if (!model) return false;
      if ((model as { loaded?: boolean }).loaded) {
        finish();
        return true;
      }
      model.addEventListener("load", finish, { once: true });
      model.addEventListener("error", finish, { once: true });
      model.addEventListener("progress", onProgress);
      return true;
    };

    // model-viewer is a custom element loaded via a deferred script, so the
    // node may not exist / be upgraded yet — keep polling until it is.
    let attached = attach();
    const poll = window.setInterval(() => {
      if (!attached) attached = attach();
      const m = document.getElementById("bg-gym-model") as { loaded?: boolean } | null;
      if (m?.loaded) finish();
    }, 250);

    // Safety net: never trap the user if the model fails or stalls.
    const timeout = window.setTimeout(finish, 20000);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(timeout);
      model?.removeEventListener("load", finish);
      model?.removeEventListener("error", finish);
      model?.removeEventListener("progress", onProgress);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Once loaded, release scroll and unmount after the fade-out transition.
  useEffect(() => {
    if (!ready) return;
    document.body.style.overflow = "";
    const t = window.setTimeout(() => setHidden(true), 700);
    return () => window.clearTimeout(t);
  }, [ready]);

  if (hidden) return null;

  const pct = Math.round(progress * 100);

  return (
    <div
      aria-hidden={ready}
      role="status"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#050505",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.75rem",
        opacity: ready ? 0 : 1,
        transition: "opacity 0.7s ease",
        pointerEvents: ready ? "none" : "auto",
      }}
    >
      {/* Spinning ring around the wordmark */}
      <div style={{ position: "relative", display: "grid", placeItems: "center", width: 132, height: 132 }}>
        <div
          className="spin-ring"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.08)",
            borderTopColor: "#b91c1c",
          }}
        />
        <span
          className="font-bebas"
          style={{ fontSize: "1.6rem", letterSpacing: "0.16em", color: "#fff", lineHeight: 1 }}
        >
          AR
        </span>
      </div>

      <div style={{ textAlign: "center" }}>
        <p
          className="font-bebas"
          style={{ fontSize: "1.5rem", letterSpacing: "0.34em", color: "#fff", lineHeight: 1 }}
        >
          AR FITNESS
        </p>
        <p
          style={{
            marginTop: "0.6rem",
            fontSize: "0.62rem",
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Loading the floor… {pct}%
        </p>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "min(280px, 70vw)",
          height: 2,
          background: "rgba(255,255,255,0.12)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "#b91c1c",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
