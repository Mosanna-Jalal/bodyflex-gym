"use client";

import { useEffect, useRef } from "react";

export default function HeroModel() {
  const modelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;

    const updateModel = () => {
      const model = modelRef.current;

      if (!model) {
        return;
      }

      const progress = Math.min(
        1,
        Math.max(0, window.scrollY / Math.max(1, window.innerHeight * 0.9)),
      );
      const angle = 24 + progress * 150;
      const elevation = 60 + progress * 18;
      const zoom = 4.9 - progress * 0.9;

      model.setAttribute("camera-orbit", `${angle.toFixed(1)}deg ${elevation.toFixed(1)}deg ${zoom.toFixed(2)}m`);
      model.setAttribute("field-of-view", `${(28 - progress * 4).toFixed(1)}deg`);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateModel);
    };

    updateModel();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <model-viewer
      ref={modelRef}
      src="/hero%20section/dumbbel_free.glb"
      alt="Animated 3D dumbbell model"
      autoplay
      camera-controls
      interaction-prompt="none"
      shadow-intensity="1.25"
      exposure="1.15"
      camera-orbit="24deg 60deg 4.9m"
      field-of-view="28deg"
      className="relative z-10 h-[330px] w-full sm:h-[430px] lg:h-[650px]"
    />
  );
}
