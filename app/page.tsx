import Script from "next/script";
import BgGymAnimation from "./BgGymAnimation";
import UserPortal from "./UserPortal";
import OfferPopup from "./components/OfferPopup";
import GymPresence from "./components/GymPresence";
import ComplaintForm from "./components/ComplaintForm";
import NavDropdown from "./components/NavDropdown";
import MusicPlayer from "./components/MusicPlayer";
import { getSessionUserId } from "@/app/lib/session";
import {
  listItems,
  type SiteFeature,
  type SiteClass,
  type SiteTrainer,
  type SitePlan,
  type SiteNotice,
} from "@/app/lib/site-db";

const navItems = ["Home", "Member", "Classes", "Trainers", "Plans", "Contact"];

const B    = "1px solid rgba(255,255,255,0.07)";
const BL   = "1px solid rgba(255,255,255,0.13)";
const DARK  = "rgba(0,0,0,0.20)";
const DARK2 = "rgba(0,0,0,0.28)";
const CARD  = "rgba(6,6,6,0.84)";

export default async function Home() {
  const memberId = await getSessionUserId();

  const [features, classes, trainers, plans, notices] = await Promise.all([
    listItems<SiteFeature>("site_features"),
    listItems<SiteClass>("site_classes"),
    listItems<SiteTrainer>("site_trainers"),
    listItems<SitePlan>("site_plans"),
    listItems<SiteNotice>("site_notices"),
  ]);

  const activeNotices = notices.filter((n) => n.active);

  return (
    <>
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
        type="module"
      />

      {/* Offer popup — client only */}
      <OfferPopup />

      {/* z-index 0 — fixed 3D gym */}
      <BgGymAnimation />

      {/* z-index 10 — all page content */}
      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ── NOTICE BANNER ────────────────────────────────────────────── */}
        {activeNotices.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.06)", borderBottom: B }}>
            <div className="mx-auto max-w-7xl px-5 sm:px-6">
              {activeNotices.map((notice) => (
                <div
                  key={notice.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.7rem 0",
                    borderBottom: activeNotices.indexOf(notice) < activeNotices.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: "0.55rem",
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.35)",
                      background: "rgba(255,255,255,0.08)",
                      padding: "0.2rem 0.55rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Notice
                  </span>
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", letterSpacing: "0.02em" }}>
                    <strong style={{ color: "#fff", fontWeight: 700, marginRight: "0.5rem" }}>{notice.title}</strong>
                    {notice.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <header className="sticky top-0" style={{ zIndex: 50, background: "#0a0a0a", borderBottom: B }}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 sm:px-6">
            <a href="#home" style={{ lineHeight: 0, display: "flex", alignItems: "center" }}>
              {/* Crop 20% top+bottom (height 26/44) and 15% left+right (clip-path) */}
              <div style={{ height: 26, overflow: "hidden", display: "flex", alignItems: "center", clipPath: "inset(0 15% 0 15%)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://res.cloudinary.com/dvjavfija/image/upload/v1778762897/ar-fitness/logos/ar-fitness-logo.png"
                  alt="AR Fitness"
                  className="block transition-opacity duration-200 hover:opacity-80"
                  style={{ height: 44, width: "auto", flexShrink: 0 }}
                />
              </div>
            </a>

            <nav className="hidden items-center gap-8 lg:flex">
              {navItems.map((item) =>
                item === "Classes" ? (
                  <NavDropdown key="Classes" items={classes.map((c) => c.name)} />
                ) : (
                  <a
                    key={item}
                    href={`#${
                      item.toLowerCase() === "plans"  ? "membership" :
                      item.toLowerCase() === "member" ? "portal"     :
                      item.toLowerCase()
                    }`}
                    className="section-label text-white/50 transition-colors hover:text-white"
                  >
                    {item}
                  </a>
                )
              )}

              {/* Gym Radio — members only */}
              {memberId && (
                <a
                  href="#gymradio"
                  className="section-label inline-flex items-center gap-1.5 transition-colors hover:text-white"
                  style={{ color: "rgba(185,28,28,0.85)", letterSpacing: "0.22em" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1a11 11 0 100 22A11 11 0 0012 1zm0 2a9 9 0 110 18A9 9 0 0112 3zm0 4a5 5 0 100 10A5 5 0 0012 7zm0 2a3 3 0 110 6 3 3 0 010-6z"/>
                  </svg>
                  Radio
                </a>
              )}
            </nav>

            <div className="flex items-center gap-4">
              {/* Admin entry — discrete, owner-facing */}
              <a
                href="/admin/login"
                className="hidden lg:inline-flex items-center gap-1.5 transition-opacity hover:opacity-100"
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: "0.62rem",
                  letterSpacing: "0.22em",
                  color: "rgba(255,255,255,0.28)",
                  textTransform: "uppercase",
                  borderLeft: "1px solid rgba(255,255,255,0.12)",
                  paddingLeft: "1rem",
                  lineHeight: 1,
                }}
              >
                <span style={{ fontSize: "0.55rem", opacity: 0.7 }}>⬡</span>
                MGMT
              </a>

              <a
                href="#portal"
                className="font-bebas inline-flex min-h-11 items-center justify-center px-7 text-[0.95rem] text-white transition hover:opacity-85"
                style={{ letterSpacing: "0.14em", background: "#b91c1c" }}
              >
                Join Now
              </a>
            </div>
          </div>
        </header>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section id="home" style={{ height: "100svh", position: "relative", overflow: "hidden" }}>
          {/* Gradient overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.55) 100%), linear-gradient(90deg, rgba(0,0,0,0.70) 0%, transparent 62%)", zIndex: 1 }}
          />

          {/* AR FITNESS — pinned just below header, above gradient */}
          <div
            className="pointer-events-none select-none absolute inset-x-0 top-0 flex justify-center"
            style={{ zIndex: 2 }}
            aria-hidden="true"
          >
            <p
              className="font-bebas text-white"
              style={{
                fontSize: "clamp(5rem, 20vw, 18rem)",
                letterSpacing: "0.10em",
                lineHeight: 1,
                opacity: 0.18,
                textShadow: "0 0 80px rgba(255,255,255,0.2)",
                userSelect: "none",
              }}
            >
              AR FITNESS
            </p>
          </div>

          {/* Hero content — vertically centered, left-aligned */}
          <div
            className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-5 sm:px-6"
            style={{ zIndex: 3, paddingTop: "60px", paddingBottom: "2rem" }}
          >
            {/* Label — single line */}
            <p className="section-label readable mb-3 inline-flex items-center gap-3 text-white/55 animate-fade-in">
              <span style={{ display: "inline-block", width: 28, height: 1, background: "rgba(255,255,255,0.45)" }} />
              Premium · Athletic Training Facility
            </p>

            {/* Heading — full content width, single line */}
            <h1
              className="font-oswald animate-fade-in-up"
              style={{
                fontSize: "clamp(2rem, 4.3vw, 5rem)",
                fontWeight: 700,
                letterSpacing: "0.02em",
                lineHeight: 1,
                color: "#fff",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                textShadow: "0 4px 40px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.9)",
                marginBottom: "1.2rem",
              }}
            >
              Leave the Mediocrity at the Door.
            </h1>

            {/* Sub-content — narrow column */}
            <div className="max-w-[600px]">
              {/* Subtext — kept short */}
              <p className="font-barlow readable text-base font-medium leading-6 text-white/68 animate-fade-in-up delay-100">
                High-performance training built for structure, accountability, and real results.
              </p>

              {/* Disciplines — single line */}
              <p className="section-label readable mt-4 text-white/42 animate-fade-in-up delay-100" style={{ letterSpacing: "0.26em" }}>
                Strength &nbsp;|&nbsp; Conditioning &nbsp;|&nbsp; Recovery
              </p>

              {/* CTA row */}
              <div className="mt-5 flex flex-wrap items-center gap-4 animate-fade-in-up delay-200">
                <a
                  href="#classes"
                  className="font-bebas inline-flex min-h-12 items-center justify-center px-9 text-[0.95rem] text-white transition hover:opacity-90"
                  style={{ background: "#b91c1c", letterSpacing: "0.12em" }}
                >
                  Book a Class
                </a>
                <a
                  href="#classes"
                  className="section-label inline-flex items-center gap-2 text-white/45 transition-colors hover:text-white"
                  style={{ letterSpacing: "0.24em" }}
                >
                  Explore Classes ↓
                </a>
              </div>

              {/* Live occupancy */}
              <div className="mt-4 animate-fade-in-up delay-300">
                <GymPresence />
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────── */}
        <section style={{ background: DARK, borderTop: B }}>
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6">
            <div className="mb-14 flex flex-col gap-6 pb-10 lg:flex-row lg:items-end lg:justify-between" style={{ borderBottom: B }}>
              <div>
                <p className="section-label readable mb-3 text-white/38">Why AR Fitness</p>
                <h2 className="font-bebas readable leading-none text-white" style={{ fontSize: "clamp(3rem,8vw,7rem)", letterSpacing: "0.05em" }}>
                  Built for<br />Repeatable Progress.
                </h2>
              </div>
              <p className="font-barlow readable max-w-sm text-lg leading-7 text-white/52">
                Every corner of the facility is designed to remove friction and keep you training harder, longer.
              </p>
            </div>

            <div className="grid md:grid-cols-3" style={{ gap: 1, background: "rgba(255,255,255,0.055)" }}>
              {features.map((f, i) => (
                <article key={f.title} className="card-hover" style={{ background: CARD, padding: "2.5rem", position: "relative", overflow: "hidden" }}>
                  <span className="bg-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <p className="step-label">/ {String(i + 1).padStart(2, "0")}</p>
                  <div className="hr-dim" style={{ marginBottom: "1.75rem" }} />
                  <h3 className="font-bebas readable text-white" style={{ fontSize: "clamp(1.7rem,3vw,2.5rem)", letterSpacing: "0.06em", lineHeight: 1.1 }}>{f.title}</h3>
                  <p className="readable mt-4 text-sm leading-7 text-white/50">{f.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── BRAND / ABOUT ─────────────────────────────────────────────── */}
        <section id="about" style={{ background: DARK2, borderTop: B }}>
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6">

            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="section-label readable mb-3 text-white/38">Our Story</p>
                <h2 className="font-bebas readable leading-none text-white" style={{ fontSize: "clamp(3rem,8vw,6.5rem)", letterSpacing: "0.05em" }}>
                  Built by<br />Athletes,<br />
                  <span style={{ color: "rgba(255,255,255,0.28)" }}>For Athletes.</span>
                </h2>

                <p className="font-barlow readable mt-8 text-lg leading-8 text-white/52">
                  AR Fitness was founded on one conviction: serious training deserves a serious environment.
                  No mirrors plastered with selfie culture. No watered-down programming. Just a clean,
                  purpose-built floor with coaches who treat every member's progress as their own.
                </p>

                <p className="font-barlow readable mt-5 text-lg leading-8 text-white/38">
                  From day one we invested in equipment, coaching education, and data — so every member
                  walks in with a plan and walks out having executed it.
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <a href="#portal" className="font-bebas inline-flex min-h-12 items-center justify-center bg-white px-8 text-[0.92rem] text-black transition hover:bg-white/85" style={{ letterSpacing: "0.12em" }}>
                    Join the Community
                  </a>
                </div>
              </div>

              {/* Values grid */}
              <div className="grid grid-cols-2" style={{ gap: 1, background: "rgba(255,255,255,0.055)" }}>
                {[
                  { num: "01", title: "Discipline", body: "Every session is logged. Every rep counts. We hold the standard." },
                  { num: "02", title: "Community", body: "Members who refer friends build a stronger gym for everyone." },
                  { num: "03", title: "Transparency", body: "Anonymous feedback is welcomed. We read every complaint." },
                  { num: "04", title: "Progress", body: "Data-driven tracking so you can see how far you've come." },
                ].map((v) => (
                  <div key={v.num} style={{ background: CARD, padding: "2rem", position: "relative", overflow: "hidden" }}>
                    <span className="font-bebas" aria-hidden="true" style={{ position: "absolute", right: "-0.05em", top: "-0.1em", fontSize: "5rem", lineHeight: 1, color: "rgba(255,255,255,0.028)", pointerEvents: "none" }}>
                      {v.num}
                    </span>
                    <p className="step-label" style={{ marginBottom: "0.75rem" }}>/ {v.num}</p>
                    <h3 className="font-bebas readable text-white" style={{ fontSize: "1.6rem", letterSpacing: "0.07em", lineHeight: 1.1 }}>{v.title}</h3>
                    <p className="readable mt-3 text-xs leading-6 text-white/42">{v.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote */}
            <div style={{ marginTop: "4rem", borderTop: B, paddingTop: "3rem" }}>
              <blockquote>
                <p className="font-bebas readable text-white" style={{ fontSize: "clamp(1.6rem,4vw,3rem)", letterSpacing: "0.06em", lineHeight: 1.2, maxWidth: 760 }}>
                  "The gym should be the most productive hour of your day — not the most confusing one."
                </p>
                <footer className="section-label mt-4 text-white/35" style={{ letterSpacing: "0.22em" }}>
                  — AR Fitness Founders
                </footer>
              </blockquote>
            </div>
          </div>
        </section>

        {/* ── MEMBER PORTAL ─────────────────────────────────────────────── */}
        <div style={{ background: DARK2, borderTop: B }}>
          <UserPortal />
        </div>

        {/* ── CLASSES ───────────────────────────────────────────────────── */}
        <section id="classes" style={{ background: DARK, borderTop: B }}>
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6">
            <div className="mb-14 flex flex-col gap-5 pb-10 lg:flex-row lg:items-end lg:justify-between" style={{ borderBottom: B }}>
              <div>
                <p className="section-label readable mb-3 text-white/38">Training Schedule</p>
                <h2 className="font-bebas readable leading-none text-white" style={{ fontSize: "clamp(3rem,8vw,7rem)", letterSpacing: "0.05em" }}>
                  Choose the<br />Stimulus.
                </h2>
              </div>
              <a href="#contact" className="font-bebas readable inline-flex min-h-12 w-fit items-center justify-center px-8 text-[0.95rem] text-white transition hover:bg-white hover:text-black" style={{ border: BL, letterSpacing: "0.14em" }}>
                Book a Trial
              </a>
            </div>

            <div className="grid lg:grid-cols-4" style={{ gap: 1, background: "rgba(255,255,255,0.055)" }}>
              {classes.map((item, i) => (
                <article key={item.name} className="card-hover" style={{ background: CARD, padding: "2rem", position: "relative", overflow: "hidden" }}>
                  <span className="bg-num" aria-hidden="true" style={{ fontSize: "clamp(5rem,12vw,10rem)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="section-label readable inline-flex items-center border border-white/18 px-2.5 py-1 text-white/50" style={{ fontSize: "0.6rem", letterSpacing: "0.22em" }}>
                    {item.level}
                  </span>
                  <h3 className="font-bebas readable mt-5 text-white" style={{ fontSize: "clamp(1.5rem,3vw,2.3rem)", letterSpacing: "0.06em", lineHeight: 1.1 }}>{item.name}</h3>
                  <div className="hr-dim" style={{ margin: "1.25rem 0" }} />
                  <p className="section-label readable text-white/40">{item.time}</p>
                  <p className="section-label readable mt-1 text-white/26">{item.duration}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRAINERS ──────────────────────────────────────────────────── */}
        <section id="trainers" style={{ background: DARK2, borderTop: B }}>
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6">
            <div className="mb-14" style={{ borderBottom: B, paddingBottom: "2.5rem" }}>
              <p className="section-label readable mb-3 text-white/38">Coaching Team</p>
              <h2 className="font-bebas readable leading-none text-white" style={{ fontSize: "clamp(3rem,8vw,7rem)", letterSpacing: "0.05em" }}>
                Direction Beats<br />Random Effort.
              </h2>
            </div>

            <div className="grid md:grid-cols-3" style={{ gap: 1, background: "rgba(255,255,255,0.055)" }}>
              {trainers.map((trainer) => (
                <article key={trainer.name} className="card-hover-dark" style={{ background: CARD, padding: "2.5rem", position: "relative", overflow: "hidden" }}>
                  <span className="font-bebas" aria-hidden="true" style={{ position: "absolute", right: "-0.08em", bottom: "-0.10em", fontSize: "clamp(7rem,15vw,12rem)", lineHeight: 1, color: "rgba(255,255,255,0.028)", letterSpacing: "-0.02em", pointerEvents: "none", userSelect: "none" }}>
                    {trainer.initial}
                  </span>

                  <div className="mb-8 flex items-start justify-between">
                    <span className="font-bebas grid place-items-center bg-white text-black" style={{ width: "4rem", height: "4rem", fontSize: "1.15rem", letterSpacing: "0.04em" }}>
                      {trainer.initial}
                    </span>
                    <span className="section-label readable border border-white/22 px-3 py-1.5 text-white/55">{trainer.stat}</span>
                  </div>

                  <h3 className="font-bebas readable text-white" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", letterSpacing: "0.06em", lineHeight: 1 }}>{trainer.name}</h3>
                  <p className="section-label readable mt-2 text-white/44">{trainer.role}</p>
                  <p className="font-barlow readable mt-4 text-xs leading-6 text-white/28">{trainer.spec}</p>
                  {(trainer as SiteTrainer & { bio?: string }).bio && (
                    <p className="font-barlow readable mt-3 text-sm leading-6 text-white/40">
                      {(trainer as SiteTrainer & { bio?: string }).bio}
                    </p>
                  )}
                  {(trainer as SiteTrainer & { email?: string }).email && (
                    <a
                      href={`mailto:${(trainer as SiteTrainer & { email?: string }).email}`}
                      className="section-label readable mt-4 inline-flex items-center gap-2 text-white/35 hover:text-white transition-colors"
                      style={{ fontSize: "0.62rem" }}
                    >
                      ✉ Contact
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── MEMBERSHIP ────────────────────────────────────────────────── */}
        <section id="membership" style={{ background: DARK, borderTop: B }}>
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6">
            <div className="mb-14 flex flex-col gap-6 pb-10 lg:flex-row lg:items-end" style={{ borderBottom: B }}>
              <div className="flex-1">
                <p className="section-label readable mb-3 text-white/38">Membership</p>
                <h2 className="font-bebas readable leading-none text-white" style={{ fontSize: "clamp(3rem,8vw,7rem)", letterSpacing: "0.05em" }}>
                  Pick Your<br />Training Lane.
                </h2>
              </div>
              <p className="font-barlow readable max-w-xs text-lg leading-7 text-white/50">
                Every plan includes clean facilities, locker access, and a floor built for strength and conditioning.
              </p>
            </div>

            <div className="grid lg:grid-cols-3" style={{ gap: 1, background: "rgba(255,255,255,0.055)" }}>
              {plans.map((plan, i) => (
                <article
                  key={plan.name}
                  style={plan.featured ? { background: "rgba(250,250,250,0.96)", padding: "2.5rem", position: "relative" } : { background: CARD, padding: "2.5rem", position: "relative" }}
                >
                  <div className="mb-7 flex items-start justify-between gap-3">
                    <div>
                      <p className="step-label" style={{ color: plan.featured ? "rgba(0,0,0,0.35)" : undefined, marginBottom: "0.4rem" }}>
                        Plan {String(i + 1).padStart(2, "0")}
                      </p>
                      <h3 className="font-bebas" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", letterSpacing: "0.08em", color: plan.featured ? "#000" : "#fff" }}>
                        {plan.name}
                      </h3>
                    </div>
                    {plan.featured && <span className="section-label bg-black px-3 py-1.5 text-white whitespace-nowrap">Best Value</span>}
                  </div>

                  <div className="flex items-end gap-2 pb-6 mb-6" style={{ borderBottom: plan.featured ? "1px solid rgba(0,0,0,0.10)" : "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="font-bebas leading-none" style={{ fontSize: "clamp(3.5rem,8vw,5.5rem)", letterSpacing: "0.02em", color: plan.featured ? "#000" : "#fff" }}>
                      {plan.price}
                    </span>
                    <span className="pb-2 text-sm" style={{ color: plan.featured ? "rgba(0,0,0,0.38)" : "rgba(255,255,255,0.34)" }}>/mo</span>
                  </div>

                  <ul className="mb-8 space-y-3">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-3">
                        <span style={{ marginTop: "0.35rem", flexShrink: 0, fontSize: "0.5rem", color: plan.featured ? "rgba(0,0,0,0.50)" : "rgba(255,255,255,0.36)" }}>◆</span>
                        <span className="text-sm leading-6" style={{ color: plan.featured ? "rgba(0,0,0,0.68)" : "rgba(255,255,255,0.48)" }}>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#portal"
                    className="font-bebas inline-flex min-h-12 w-full items-center justify-center text-[0.95rem] transition"
                    style={plan.featured ? { background: "#000", color: "#fff", letterSpacing: "0.12em" } : { border: "1px solid rgba(255,255,255,0.28)", color: "#fff", letterSpacing: "0.12em" }}
                  >
                    Get Started
                  </a>

                  {/* WhatsApp negotiate */}
                  <a
                    href={`https://wa.me/918521594129?text=${encodeURIComponent(`Hi! I'm interested in the *${plan.name}* plan (${plan.price}/mo). Can we discuss?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bebas mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 text-[0.88rem] transition hover:opacity-85"
                    style={{ background: "#25D366", color: "#fff", letterSpacing: "0.10em" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Negotiate on WhatsApp
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── GYM RADIO — members only ──────────────────────────────────── */}
        {memberId && <MusicPlayer />}

        {/* ── CONTACT + COMPLAINTS ──────────────────────────────────────── */}
        <section id="contact" style={{ background: DARK2, borderTop: B }}>
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6">

            {/* Giant CTA */}
            <div style={{ borderBottom: B, paddingBottom: "3.5rem", marginBottom: "3rem" }}>
              <p className="section-label readable mb-6 text-white/38">Ready to Train?</p>
              <h2 className="font-bebas readable leading-none text-white" style={{ fontSize: "clamp(4rem,14vw,12rem)", letterSpacing: "0.04em" }}>
                Book a Free<br />
                <span style={{ color: "rgba(255,255,255,0.32)" }}>Visit.</span>
              </h2>
              <p className="font-barlow readable mt-6 max-w-md text-lg leading-7 text-white/50">
                Come see the floor, meet the coaches, and decide if AR Fitness is where you do your best work.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <a href="mailto:hello@arfitness.com" className="font-bebas inline-flex min-h-14 items-center justify-center bg-white px-10 text-[0.95rem] text-black transition hover:bg-white/85" style={{ letterSpacing: "0.12em" }}>
                  Email Us
                </a>
                <a href="tel:+1234567890" className="font-bebas inline-flex min-h-14 items-center justify-center px-10 text-[0.95rem] text-white transition hover:bg-white/10" style={{ border: "1px solid rgba(255,255,255,0.28)", letterSpacing: "0.12em" }}>
                  Call Now
                </a>
              </div>
            </div>

            {/* Complaints + footer split */}
            <div className="grid gap-12 lg:grid-cols-[1fr_0.7fr] lg:items-start">
              <ComplaintForm />

              <div>
                <p className="section-label readable mb-5 text-white/30" style={{ letterSpacing: "0.26em" }}>AR Fitness</p>
                <p className="font-bebas readable text-white/20" style={{ fontSize: "clamp(3rem,8vw,5rem)", letterSpacing: "0.08em", lineHeight: 1 }}>
                  Every rep.<br />Every day.
                </p>

                <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {[
                    ["Open", "24 / 7 — 365 days a year"],
                    ["Location", "123 Performance Ave"],
                    ["Email", "hello@arfitness.com"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
                      <span style={{ fontSize: "0.6rem", letterSpacing: "0.22em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", flexShrink: 0, width: 56 }}>{label}</span>
                      <span style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.50)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer row */}
            <div style={{ marginTop: "3rem", borderTop: B, paddingTop: "1.75rem" }} className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <span className="font-bebas readable text-sm text-white/22" style={{ letterSpacing: "0.16em" }}>
                © 2025 AR Fitness. All rights reserved.
              </span>
              <div className="flex gap-6">
                {["Privacy", "Terms", "Contact"].map((link) => (
                  <a key={link} href="#" className="section-label readable text-white/24 transition hover:text-white">{link}</a>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
