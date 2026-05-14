"use client";
import { useState } from "react";

export default function NavDropdown({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a
        href="#classes"
        className="section-label text-white/50 transition-colors hover:text-white"
        style={{ letterSpacing: "0.22em" }}
      >
        Classes
      </a>

      {open && (
        <div
          className="absolute left-0 top-full z-50 pt-3"
          style={{ minWidth: 220 }}
        >
          <div style={{ background: "rgba(10,4,4,0.97)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {items.map((name) => (
              <a
                key={name}
                href="#classes"
                className="block font-bebas text-white/65 transition-colors hover:bg-white/5 hover:text-white"
                style={{ padding: "0.8rem 1.5rem", fontSize: "0.9rem", letterSpacing: "0.18em" }}
              >
                {name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
