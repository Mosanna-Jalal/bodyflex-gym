"use client";
import { useState, useEffect } from "react";

const navItems = ["Home", "Member", "Classes", "Trainers", "Plans", "Contact"];

function navHref(item: string) {
  if (item.toLowerCase() === "plans") return "#membership";
  if (item.toLowerCase() === "member") return "#portal";
  return `#${item.toLowerCase()}`;
}

export default function MobileNav({
  memberId,
  classes,
}: {
  memberId: boolean;
  classes: string[];
}) {
  const [open, setOpen] = useState(false);
  const [classesOpen, setClassesOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => { setOpen(false); setClassesOpen(false); };

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex flex-col items-center justify-center gap-[5px] w-10 h-10 -mr-1"
        aria-label="Open menu"
      >
        <span className="block h-px w-5 bg-white/70" />
        <span className="block h-px w-5 bg-white/70" />
        <span className="block h-px w-3 bg-white/70 self-start" />
      </button>

      {/* Backdrop */}
      <div
        onClick={close}
        className="lg:hidden fixed inset-0 z-[60] transition-all duration-300"
        style={{
          background: "rgba(0,0,0,0.72)",
          backdropFilter: open ? "blur(4px)" : "none",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Drawer */}
      <div
        className="lg:hidden fixed inset-y-0 right-0 z-[70] flex flex-col"
        style={{
          width: "min(85vw, 360px)",
          background: "#0a0a0a",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.32,0.72,0,1)",
          willChange: "transform",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <span
            className="font-bebas text-white tracking-[0.22em]"
            style={{ fontSize: "1.1rem" }}
          >
            AR FITNESS
          </span>
          <button
            onClick={close}
            className="flex items-center justify-center w-9 h-9 rounded-sm transition-colors hover:bg-white/5"
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) =>
            item === "Classes" ? (
              <div key="Classes">
                <button
                  onClick={() => setClassesOpen((p) => !p)}
                  className="w-full flex items-center justify-between px-6 py-4 text-white/55 hover:text-white hover:bg-white/[0.03] transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span className="font-bebas tracking-[0.18em] text-[1.35rem]">Classes</span>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5"
                    className="text-white/25 transition-transform duration-200"
                    style={{ transform: classesOpen ? "rotate(90deg)" : "rotate(0)" }}
                  >
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                  </svg>
                </button>
                {classesOpen && (
                  <div style={{ background: "rgba(255,255,255,0.02)" }}>
                    {classes.map((name) => (
                      <a
                        key={name}
                        href="#classes"
                        onClick={close}
                        className="flex items-center px-10 py-3 font-bebas text-white/40 hover:text-white/80 transition-colors tracking-[0.14em]"
                        style={{ fontSize: "1.05rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                      >
                        <span className="mr-3 text-[0.4rem] text-red-700">●</span>
                        {name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a
                key={item}
                href={navHref(item)}
                onClick={close}
                className="flex items-center justify-between px-6 py-4 font-bebas text-white/55 hover:text-white hover:bg-white/[0.03] transition-colors"
                style={{
                  fontSize: "1.35rem",
                  letterSpacing: "0.18em",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {item}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                </svg>
              </a>
            )
          )}

          {memberId && (
            <a
              href="#gymradio"
              onClick={close}
              className="flex items-center justify-between px-6 py-4 font-bebas tracking-[0.18em] hover:bg-white/[0.03] transition-colors"
              style={{
                fontSize: "1.35rem",
                color: "rgba(185,28,28,0.9)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span className="flex items-center gap-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1a11 11 0 100 22A11 11 0 0012 1zm0 2a9 9 0 110 18A9 9 0 0112 3zm0 4a5 5 0 100 10A5 5 0 0012 7zm0 2a3 3 0 110 6 3 3 0 010-6z" />
                </svg>
                Gym Radio
              </span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" />
              </svg>
            </a>
          )}

          {/* Admin link inside drawer */}
          <a
            href="/admin/login"
            onClick={close}
            className="flex items-center gap-2 px-6 py-4 transition-colors hover:bg-white/[0.03]"
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "0.62rem",
              letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.2)",
              textTransform: "uppercase",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span style={{ fontSize: "0.5rem", opacity: 0.6 }}>⬡</span> MGMT
          </a>
        </nav>

        {/* CTA */}
        <div className="p-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <a
            href="#portal"
            onClick={close}
            className="font-bebas flex items-center justify-center w-full py-[14px] text-white text-lg tracking-[0.2em] transition hover:opacity-85 active:scale-[0.98]"
            style={{ background: "#b91c1c", letterSpacing: "0.2em" }}
          >
            Join Now
          </a>
        </div>
      </div>
    </>
  );
}
