"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

export default function HeroModel() {
  const modelRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);
  const motionRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    lastScrollY: 0,
    rotateX: -8,
    rotateY: 18,
    rotateZ: 0,
  });

  useEffect(() => {
    let frame = 0;

    const updateModel = () => {
      const model = modelRef.current;

      if (!model) {
        return;
      }

      const motion = motionRef.current;
      const progress = Math.min(
        1,
        Math.max(0, window.scrollY / Math.max(1, window.innerHeight * 0.9)),
      );
      const scrollDelta = window.scrollY - motion.lastScrollY;

      motion.lastScrollY = window.scrollY;
      motion.rotateX = clamp(motion.rotateX + scrollDelta * 0.12, -55, 55);
      motion.rotateZ = clamp(motion.rotateZ + scrollDelta * 0.045, -28, 28);

      model.setAttribute(
        "orientation",
        `${motion.rotateX.toFixed(1)}deg ${motion.rotateY.toFixed(1)}deg ${motion.rotateZ.toFixed(1)}deg`,
      );
      model.setAttribute("camera-orbit", `${(18 + progress * 22).toFixed(1)}deg 68deg 4.7m`);
      model.setAttribute("field-of-view", `${(28 - progress * 2).toFixed(1)}deg`);
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateModel);
    };

    motionRef.current.lastScrollY = window.scrollY;
    updateModel();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    const model = modelRef.current;
    const handleLoad = () => setLoaded(true);
    model?.addEventListener("load", handleLoad);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      model?.removeEventListener("load", handleLoad);
    };
  }, []);

  const applyRotation = () => {
    const model = modelRef.current;
    const motion = motionRef.current;

    if (!model) {
      return;
    }

    model.setAttribute(
      "orientation",
      `${motion.rotateX.toFixed(1)}deg ${motion.rotateY.toFixed(1)}deg ${motion.rotateZ.toFixed(1)}deg`,
    );
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const motion = motionRef.current;

    motion.active = true;
    motion.startX = event.clientX;
    motion.startY = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const motion = motionRef.current;

    if (!motion.active) {
      return;
    }

    const deltaX = event.clientX - motion.startX;
    const deltaY = event.clientY - motion.startY;

    motion.startX = event.clientX;
    motion.startY = event.clientY;
    motion.rotateY = clamp(motion.rotateY + deltaX * 0.45, -180, 180);
    motion.rotateX = clamp(motion.rotateX - deltaY * 0.35, -65, 65);
    motion.rotateZ = clamp(motion.rotateZ + deltaX * 0.12, -38, 38);
    applyRotation();
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    motionRef.current.active = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="absolute inset-x-0 top-0 z-0 h-[520px] w-full cursor-grab touch-none select-none active:cursor-grabbing sm:h-[640px] lg:-top-12 lg:h-[820px]"
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-20 h-28 w-[82vw] -translate-x-1/2 rounded-[50%] bg-yellow-400/24 blur-3xl lg:top-36" />
      <div className="absolute bottom-10 left-1/2 h-20 w-[76vw] -translate-x-1/2 rounded-[50%] bg-black blur-2xl" />

      {/* Skeleton shown while GLB streams in */}
      {!loaded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full animate-pulse"
            style={{
              width: "min(42vw, 320px)",
              height: "min(42vw, 320px)",
              background: "radial-gradient(circle, rgba(185,28,28,0.08) 0%, rgba(255,255,255,0.03) 60%, transparent 100%)",
            }}
          />
        </div>
      )}

      <model-viewer
        ref={modelRef}
        src="https://res.cloudinary.com/dvjavfija/raw/upload/v1778762902/ar-fitness/3d-models/dumbbel_free.glb"
        alt="Animated 3D dumbbell model"
        autoplay
        interaction-prompt="none"
        shadow-intensity="1.25"
        exposure="1.15"
        orientation="-8deg 18deg 0deg"
        camera-orbit="18deg 68deg 4.7m"
        field-of-view="28deg"
        className="relative z-10 h-full w-full"
        style={{ opacity: loaded ? 0.8 : 0, transition: "opacity 0.6s ease" }}
      />
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
