"use client";

import { useEffect, useRef } from "react";
import type { ModelViewerInstance } from "./model-viewer";

// Radius in % of bounding-sphere.
// Model-viewer normally clamps the camera outside geometry — we override that
// with min-camera-orbit="auto auto 0%" so the camera can enter the building.
// Interior spots stay at 1% (just off center, well inside any gym-sized model).
// Exterior pull uses 110% (just outside the bounding sphere).
const JOURNEY = [
  // ── INTERIOR ──────────────────────────────────────────────────────────────
  { az:  30, el: 80, rad:   1, fov: 75 }, // Spot 1 — treadmills / entry (START)
  { az:  90, el: 80, rad:   1, fov: 72 }, // Spot 2 — bike / cardio corner
  { az: 150, el: 80, rad:   1, fov: 74 }, // Spot 3 — centre floor, racks
  { az: 210, el: 80, rad:   1, fov: 72 }, // Spot 4 — window wall / sunlight
  { az: 270, el: 80, rad:   1, fov: 75 }, // Spot 5 — weights / machines side
  { az: 330, el: 80, rad:   1, fov: 73 }, // Spot 6 — far corner overview

  // ── PULL OUTSIDE ──────────────────────────────────────────────────────────
  { az: 330, el: 68, rad:  80, fov: 52 }, // rising out through the roof
  { az:  30, el: 62, rad: 110, fov: 45 }, // wide exterior orbit shot

  // ── RETURN INSIDE ─────────────────────────────────────────────────────────
  { az:  30, el: 68, rad:  80, fov: 52 }, // descending back in
  { az:  30, el: 80, rad:   1, fov: 75 }, // Spot 1 again — seamless loop
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function BgGymAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const model = container.querySelector(
      "model-viewer"
    ) as ModelViewerInstance | null;
    if (!model) return;

    let rafId = 0;
    let cleanup: (() => void) | null = null;

    // Start smoothed state at Spot 1
    let cur = { az: 30, el: 80, rad: 1, fov: 75 };
    let tgt = { ...cur };

    const updateTarget = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const raw = Math.min(1, Math.max(0, window.scrollY / maxScroll));

      const n = JOURNEY.length - 1;
      const scaled = raw * n;
      const idx = Math.min(n - 1, Math.floor(scaled));
      const t = easeInOut(scaled - idx);

      const a = JOURNEY[idx];
      const b = JOURNEY[idx + 1];
      tgt.az  = lerp(a.az,  b.az,  t);
      tgt.el  = lerp(a.el,  b.el,  t);
      tgt.rad = lerp(a.rad, b.rad, t);
      tgt.fov = lerp(a.fov, b.fov, t);
    };

    const animate = () => {
      const s = 0.055;
      cur.az  += (tgt.az  - cur.az)  * s;
      cur.el  += (tgt.el  - cur.el)  * s;
      cur.rad += (tgt.rad - cur.rad) * s;
      cur.fov += (tgt.fov - cur.fov) * s;

      model.setAttribute(
        "camera-orbit",
        `${cur.az.toFixed(3)}deg ${cur.el.toFixed(3)}deg ${cur.rad.toFixed(3)}%`
      );
      model.setAttribute("field-of-view", `${cur.fov.toFixed(3)}deg`);
      rafId = requestAnimationFrame(animate);
    };

    const init = () => {
      // If the GLB has a built-in camera animation, scrub it with scroll
      const dur = model.duration;
      if (dur && dur > 0) {
        model.pause();
        const scrub = () => {
          const max = Math.max(
            1,
            document.documentElement.scrollHeight - window.innerHeight
          );
          model.currentTime =
            Math.min(1, Math.max(0, window.scrollY / max)) * dur;
        };
        scrub();
        window.addEventListener("scroll", scrub, { passive: true });
        window.addEventListener("resize", scrub);
        cleanup = () => {
          window.removeEventListener("scroll", scrub);
          window.removeEventListener("resize", scrub);
        };
      } else {
        updateTarget();
        animate();
        window.addEventListener("scroll", updateTarget, { passive: true });
        window.addEventListener("resize", updateTarget);
        cleanup = () => {
          cancelAnimationFrame(rafId);
          window.removeEventListener("scroll", updateTarget);
          window.removeEventListener("resize", updateTarget);
        };
      }
    };

    if (model.loaded) {
      init();
    } else {
      model.addEventListener("load", init, { once: true });
    }

    return () => {
      model.removeEventListener("load", init);
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, background: "#050505" }}
    >
      <model-viewer
        src="/bg-gym-animation/ruang_gym.glb"
        alt="3D gym interior"
        autoplay
        interaction-prompt="none"
        shadow-intensity="2.0"
        exposure="3.2"
        environment-image="neutral"
        camera-orbit="30deg 80deg 1%"
        field-of-view="75deg"
        min-camera-orbit="auto auto 0%"
        loading="eager"
        style={
          {
            width: "100%",
            height: "100%",
            display: "block",
            "--camera-orbit-transition": "0ms 0ms ease",
          } as React.CSSProperties
        }
      />
    </div>
  );
}
