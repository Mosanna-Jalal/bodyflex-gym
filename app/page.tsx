import Script from "next/script";
import HeroModel from "./HeroModel";

const navItems = ["Home", "Classes", "Trainers", "Plans", "Contact"];

const metrics = [
  { value: "24/7", label: "Member access" },
  { value: "150+", label: "Weekly sessions" },
  { value: "12", label: "Coach-led programs" },
];

const features = [
  {
    title: "Strength floor",
    description:
      "Racks, free weights, cables, machines, and open turf arranged for serious training without wasted movement.",
  },
  {
    title: "Coached progress",
    description:
      "Personal plans, form checks, and monthly reviews keep every member training with a clear target.",
  },
  {
    title: "Conditioning lab",
    description:
      "HIIT, sled work, assault bikes, rowing, and mobility sessions built into a balanced weekly rhythm.",
  },
];

const classes = [
  { name: "Power Build", time: "Mon / Wed / Fri", level: "Strength" },
  { name: "Engine Room", time: "Tue / Thu", level: "Conditioning" },
  { name: "Mobility Reset", time: "Daily", level: "Recovery" },
  { name: "Barbell Club", time: "Saturday", level: "Technique" },
];

const trainers = [
  { name: "Mia Carter", role: "Strength Lead", stat: "8 yrs" },
  { name: "Jason Lee", role: "Conditioning Coach", stat: "NASM" },
  { name: "Ava Patel", role: "Mobility Specialist", stat: "FRC" },
];

const plans = [
  {
    name: "Open Gym",
    price: "$29",
    detail: "Full floor access, app booking, and locker use.",
  },
  {
    name: "Performance",
    price: "$59",
    detail: "Open gym plus unlimited classes and coach check-ins.",
    featured: true,
  },
  {
    name: "Personal",
    price: "$149",
    detail: "Weekly one-on-one coaching with custom programming.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
        type="module"
      />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <a href="#home" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-yellow-400 text-sm font-black text-black">
              BF
            </span>
            <span>
              <span className="block text-base font-semibold uppercase tracking-[0.18em] text-white">
                Bodyflex
              </span>
              <span className="block text-xs font-medium uppercase tracking-[0.28em] text-zinc-500">
                Gym
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase() === "plans" ? "membership" : item.toLowerCase()}`}
                className="text-sm font-medium text-zinc-400 transition hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>

          <a
            href="#membership"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-yellow-400 px-5 text-sm font-bold text-black transition hover:bg-white"
          >
            Join Now
          </a>
        </div>
      </header>

      <section id="home" className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,#000_0%,#050505_42%,#171409_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-px bg-yellow-400/80" />

        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-start gap-5 px-5 pb-12 pt-4 sm:px-6 sm:pt-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-10 lg:py-12">
          <div className="relative order-1 min-h-[330px] sm:min-h-[430px] lg:order-2 lg:min-h-[650px]">
            <div className="absolute inset-x-8 top-10 h-24 rounded-[50%] bg-yellow-400/20 blur-3xl lg:top-auto lg:bottom-16" />
            <div className="absolute inset-x-10 top-56 h-16 rounded-[50%] bg-black blur-2xl sm:top-72 lg:bottom-10 lg:top-auto" />
            <HeroModel />
          </div>

          <div className="order-2 max-w-2xl pt-2 sm:pt-0 lg:order-1">
            <p className="mb-5 inline-flex rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-yellow-300">
              Strength. Conditioning. Recovery.
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.94] text-white sm:text-6xl lg:text-7xl">
              Train hard. Move clean. Stay consistent.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
              A high-performance gym for people who want structure, accountability, and a floor that feels built for real work.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#membership"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-yellow-400 px-6 text-sm font-bold text-black transition hover:bg-white"
              >
                Start Membership
              </a>
              <a
                href="#classes"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 px-6 text-sm font-bold text-white transition hover:border-yellow-400 hover:text-yellow-300"
              >
                View Classes
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="border-l border-yellow-400/60 pl-4">
                  <p className="text-3xl font-black text-white">{metric.value}</p>
                  <p className="mt-1 text-sm text-zinc-500">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-white text-black">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <h2 className="text-3xl font-black leading-tight sm:text-4xl">
            A gym built for repeatable progress.
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-lg border border-black/10 p-5">
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="classes" className="mx-auto max-w-7xl px-5 py-20 sm:px-6">
        <div className="mb-10 flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-yellow-300">
              Class lineup
            </p>
            <h2 className="mt-3 max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl">
              Choose the stimulus. Keep the standard.
            </h2>
          </div>
          <a
            href="#contact"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-yellow-400 px-6 text-sm font-bold text-yellow-300 transition hover:bg-yellow-400 hover:text-black"
          >
            Book a Trial
          </a>
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          {classes.map((item) => (
            <article
              key={item.name}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:border-yellow-400/70 hover:bg-white/[0.06]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
                {item.level}
              </p>
              <h3 className="mt-5 text-2xl font-black text-white">{item.name}</h3>
              <p className="mt-4 text-sm text-zinc-400">{item.time}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="trainers" className="border-y border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-yellow-300">
              Coaching team
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
              Direction beats random effort.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {trainers.map((trainer) => (
              <article key={trainer.name} className="rounded-lg bg-white p-6 text-black">
                <div className="mb-8 flex items-center justify-between">
                  <span className="h-12 w-12 rounded-lg bg-black" />
                  <span className="rounded bg-yellow-400 px-3 py-1 text-xs font-black uppercase text-black">
                    {trainer.stat}
                  </span>
                </div>
                <h3 className="text-2xl font-black">{trainer.name}</h3>
                <p className="mt-2 text-sm font-semibold text-zinc-600">{trainer.role}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="membership" className="mx-auto max-w-7xl px-5 py-20 sm:px-6">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-yellow-300">
              Membership
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
              Pick your training lane.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-zinc-400 lg:justify-self-end">
            Every plan includes clean facilities, locker access, class booking, and a gym floor designed around strength and conditioning.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-lg border p-6 ${
                plan.featured
                  ? "border-yellow-400 bg-yellow-400 text-black"
                  : "border-white/10 bg-white/[0.03] text-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-black">{plan.name}</h3>
                {plan.featured ? (
                  <span className="rounded bg-black px-3 py-1 text-xs font-black uppercase text-yellow-300">
                    Best Value
                  </span>
                ) : null}
              </div>
              <p className="mt-8 flex items-end gap-1">
                <span className="text-5xl font-black">{plan.price}</span>
                <span className={`pb-2 text-sm ${plan.featured ? "text-black/70" : "text-zinc-500"}`}>
                  /mo
                </span>
              </p>
              <p className={`mt-5 text-sm leading-6 ${plan.featured ? "text-black/75" : "text-zinc-400"}`}>
                {plan.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-white text-black">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-zinc-500">
              Ready to train?
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
              Book a free visit and see the floor for yourself.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:hello@bodyflexgym.com"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-black px-6 text-sm font-bold text-white transition hover:bg-yellow-400 hover:text-black"
            >
              Email Us
            </a>
            <a
              href="tel:+1234567890"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-black/20 px-6 text-sm font-bold text-black transition hover:border-black hover:bg-black hover:text-white"
            >
              Call Now
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
