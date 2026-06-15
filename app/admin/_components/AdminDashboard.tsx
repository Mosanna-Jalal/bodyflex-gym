"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Types ──────────────────────────────────────────────────────────── */
type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "list";
  options?: string[];
  hint?: string;
};

type Schema = {
  collection: string;
  label: string;
  displayKey: string;
  subtitleKey?: string;
  fields: FieldDef[];
  readOnly?: boolean;
  sectionType?: "crud" | "presence" | "offer" | "music";
};

type AnyItem = Record<string, unknown> & { id: string };
type FormValue = string | boolean | string[];

/* ── Content schemas ─────────────────────────────────────────────────── */
const SCHEMAS: Schema[] = [
  {
    collection: "site_features",
    label: "Features",
    displayKey: "title",
    subtitleKey: "description",
    fields: [
      { key: "title",       label: "Title",       type: "text" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    collection: "site_classes",
    label: "Classes",
    displayKey: "name",
    subtitleKey: "time",
    fields: [
      { key: "name",     label: "Class Name", type: "text" },
      { key: "time",     label: "Schedule",   type: "text", hint: 'e.g. "Mon / Wed / Fri"' },
      { key: "level",    label: "Level",      type: "select", options: ["Strength", "Conditioning", "Recovery", "Technique"] },
      { key: "duration", label: "Duration",   type: "text", hint: 'e.g. "60 min"' },
    ],
  },
  {
    collection: "site_trainers",
    label: "Trainers",
    displayKey: "name",
    subtitleKey: "role",
    fields: [
      { key: "name",    label: "Full Name",          type: "text" },
      { key: "role",    label: "Role",               type: "text" },
      { key: "initial", label: "Initials (2 chars)", type: "text" },
      { key: "stat",    label: "Credential / Years", type: "text" },
      { key: "spec",    label: "Specialties",        type: "text" },
      { key: "bio",     label: "Short Bio",          type: "textarea" },
      { key: "email",   label: "Contact Email",      type: "text" },
    ],
  },
  {
    collection: "site_plans",
    label: "Plans",
    displayKey: "name",
    subtitleKey: "price",
    fields: [
      { key: "name",     label: "Plan Name",                     type: "text" },
      { key: "price",    label: 'Price (e.g. "$59")',            type: "text" },
      { key: "featured", label: "Mark as Featured (Best Value)", type: "checkbox" },
      { key: "perks",    label: "Perks — one per line",          type: "list" },
    ],
  },
  {
    collection: "site_metrics",
    label: "Metrics",
    displayKey: "value",
    subtitleKey: "label",
    fields: [
      { key: "value", label: 'Value (e.g. "24/7")', type: "text" },
      { key: "label", label: "Label",               type: "text" },
    ],
  },
  {
    collection: "site_notices",
    label: "Notices",
    displayKey: "title",
    subtitleKey: "message",
    fields: [
      { key: "title",   label: "Title",            type: "text" },
      { key: "message", label: "Message",          type: "textarea" },
      { key: "active",  label: "Show on site",     type: "checkbox" },
    ],
  },
  {
    collection: "site_complaints",
    label: "Complaints",
    displayKey: "message",
    subtitleKey: "createdAt",
    readOnly: true,
    fields: [],
  },
  {
    collection: "site_presence",
    label: "Gym Presence",
    displayKey: "current",
    sectionType: "presence",
    fields: [
      { key: "current",  label: "Current members in gym", type: "text" },
      { key: "capacity", label: "Max capacity",           type: "text" },
    ],
  },
  {
    collection: "site_offer",
    label: "Offer Popup",
    displayKey: "title",
    sectionType: "offer",
    fields: [
      { key: "title",      label: "Offer Title",                 type: "text" },
      { key: "body",       label: "Description",                 type: "textarea" },
      { key: "buttonText", label: "Button Text",                 type: "text" },
      { key: "expiryDate", label: "Expiry Date (YYYY-MM-DD)",   type: "text" },
      { key: "active",     label: "Show popup on site",         type: "checkbox" },
    ],
  },
  {
    collection: "music",
    label: "Gym Radio",
    displayKey: "name",
    sectionType: "music" as const,
    fields: [],
  },
];

/* ── Sidebar groups ──────────────────────────────────────────────────── */
const SIDEBAR_GROUPS = [
  { label: "Content",  indices: [0, 1, 2, 3, 4, 5] },
  { label: "Inbox",    indices: [6] },
  { label: "Settings", indices: [7, 8] },
  { label: "Media",    indices: [9] },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */
function emptyForm(schema: Schema): Record<string, FormValue> {
  const f: Record<string, FormValue> = {};
  for (const field of schema.fields) {
    f[field.key] = field.type === "checkbox" ? false : field.type === "list" ? [] : "";
  }
  return f;
}

function itemToForm(schema: Schema, item: AnyItem): Record<string, FormValue> {
  const f: Record<string, FormValue> = {};
  for (const field of schema.fields) {
    const v = item[field.key];
    if (field.type === "checkbox") f[field.key] = Boolean(v);
    else if (field.type === "list") f[field.key] = Array.isArray(v) ? (v as string[]) : [];
    else f[field.key] = String(v ?? "");
  }
  return f;
}

function formToBody(schema: Schema, form: Record<string, FormValue>) {
  const body: Record<string, unknown> = {};
  for (const field of schema.fields) {
    const v = form[field.key];
    if (field.type === "list") {
      body[field.key] = Array.isArray(v)
        ? v.map((s) => s.trim()).filter(Boolean)
        : String(v).split("\n").map((s) => s.trim()).filter(Boolean);
    } else if (field.type === "checkbox") {
      body[field.key] = Boolean(v);
    } else {
      body[field.key] = String(v ?? "");
    }
  }
  return body;
}

/* ── Shared style tokens ─────────────────────────────────────────────── */
const S = {
  inputBase: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#fff",
    padding: "0.65rem 0.85rem",
    fontSize: "0.88rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  btnPrimary: {
    background: "#fff",
    color: "#000",
    border: "none",
    padding: "0.6rem 1.4rem",
    fontSize: "0.76rem",
    fontWeight: 700 as const,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    cursor: "pointer" as const,
  },
  btnGhost: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.6)",
    padding: "0.6rem 1rem",
    fontSize: "0.76rem",
    letterSpacing: "0.10em",
    textTransform: "uppercase" as const,
    cursor: "pointer" as const,
  },
  label: {
    display: "block" as const,
    fontSize: "0.65rem",
    letterSpacing: "0.22em",
    color: "rgba(255,255,255,0.42)",
    textTransform: "uppercase" as const,
    marginBottom: "0.45rem",
  },
};

/* ── Singleton section (Presence / Offer) ────────────────────────────── */
function SingletonSection({
  schema,
  endpoint,
  notify,
}: {
  schema: Schema;
  endpoint: string;
  notify: (msg: string) => void;
}) {
  const [form, setForm] = useState<Record<string, FormValue>>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => {
        if (!data) {
          setForm(emptyForm(schema));
        } else {
          const f: Record<string, FormValue> = {};
          for (const field of schema.fields) {
            const v = data[field.key];
            if (field.type === "checkbox") f[field.key] = Boolean(v);
            else f[field.key] = String(v ?? "");
          }
          setForm(f);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [endpoint, schema]);

  const save = async () => {
    setSaving(true);
    try {
      const body = formToBody(schema, form);
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) notify("Saved.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em" }}>
        Loading…
      </p>
    );
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem", marginBottom: "1.5rem" }}>
        {schema.fields.map((field) => (
          <div key={field.key}>
            <label style={S.label}>
              {field.label}
              {field.hint && (
                <span style={{ marginLeft: "0.5em", fontSize: "0.62rem", color: "rgba(255,255,255,0.22)", textTransform: "none" }}>
                  {field.hint}
                </span>
              )}
            </label>

            {field.type === "textarea" ? (
              <textarea
                rows={3}
                value={String(form[field.key] ?? "")}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                style={{ ...S.inputBase, resize: "vertical" }}
              />
            ) : field.type === "checkbox" ? (
              <label style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={Boolean(form[field.key])}
                  onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#fff" }}
                />
                <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.65)" }}>Yes</span>
              </label>
            ) : (
              <input
                type="text"
                value={String(form[field.key] ?? "")}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                style={S.inputBase}
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{ ...S.btnPrimary, opacity: saving ? 0.65 : 1, cursor: saving ? "wait" : "pointer" }}
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

/* ── Music admin section ─────────────────────────────────────────────── */
const PLAYLIST_COLORS = ["#b91c1c", "#0369a1", "#15803d", "#7c3aed", "#c2410c", "#0e7490"];

function MusicAdmin({ notify }: { notify: (m: string) => void }) {
  const [playlists, setPlaylists] = useState<{ id: string; name: string; color: string; shareToken: string }[]>([]);
  const [tracks, setTracks]       = useState<{ id: string; playlistId: string; title: string; youtubeId: string }[]>([]);
  const [newName, setNewName]     = useState("");
  const [newColor, setNewColor]   = useState(PLAYLIST_COLORS[0]);
  const [creating, setCreating]   = useState(false);
  const [expandPl, setExpandPl]   = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [copied, setCopied]       = useState<string | null>(null);

  const load = useCallback(async () => {
    const [plRes, trRes] = await Promise.all([
      fetch("/api/admin/music/playlists"),
      fetch("/api/music/tracks"),
    ]);
    if (plRes.ok) setPlaylists(await plRes.json());
    if (trRes.ok) setTracks(await trRes.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const createPlaylist = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/music/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (res.ok) { setNewName(""); await load(); notify("Playlist created."); }
    } finally { setCreating(false); }
  };

  const deletePlaylist = async (id: string) => {
    if (confirmDel !== id) { setConfirmDel(id); return; }
    const res = await fetch(`/api/admin/music/playlists/${id}`, { method: "DELETE" });
    if (res.ok) { setConfirmDel(null); await load(); notify("Playlist deleted."); }
  };

  const deleteTrack = async (id: string) => {
    const res = await fetch(`/api/admin/music/tracks/${id}`, { method: "DELETE" });
    if (res.ok) { await load(); notify("Track removed."); }
  };

  const copyShare = (pl: { shareToken: string; id: string }) => {
    navigator.clipboard.writeText(`${window.location.origin}/?addto=${pl.shareToken}#gymradio`);
    setCopied(pl.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      {/* Create playlist */}
      <div style={{ marginBottom: "2rem", padding: "1.25rem", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
        <p style={S.label}>Create New Playlist</p>
        <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
            placeholder="Playlist name"
            style={{ ...S.inputBase, flex: 1, minWidth: 180 }}
          />
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            {PLAYLIST_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: newColor === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }}
              />
            ))}
          </div>
          <button onClick={createPlaylist} disabled={creating} style={{ ...S.btnPrimary, opacity: creating ? 0.6 : 1 }}>
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>

      {/* Playlist list */}
      {playlists.length === 0 ? (
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.3)" }}>No playlists yet. Create one above.</p>
      ) : playlists.map((pl) => {
        const plTracks = tracks.filter((t) => t.playlistId === pl.id);
        const open = expandPl === pl.id;
        return (
          <div key={pl.id} style={{ marginBottom: "0.75rem", border: "1px solid rgba(255,255,255,0.07)" }}>
            {/* Playlist row */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem 0.75rem", padding: "0.8rem 1rem", background: "rgba(255,255,255,0.03)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: pl.color, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 120, fontWeight: 600, fontSize: "0.88rem" }}>{pl.name}</span>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.32)" }}>{plTracks.length} track{plTracks.length !== 1 ? "s" : ""}</span>
              <button onClick={() => copyShare(pl)} style={{ ...S.btnGhost, padding: "0.28rem 0.7rem", fontSize: "0.68rem", color: copied === pl.id ? "#4ade80" : undefined }}>
                {copied === pl.id ? "Copied!" : "Share Link"}
              </button>
              <button onClick={() => setExpandPl(open ? null : pl.id)} style={{ ...S.btnGhost, padding: "0.28rem 0.7rem", fontSize: "0.68rem" }}>
                {open ? "▲ Hide" : "▼ Tracks"}
              </button>
              {confirmDel === pl.id ? (
                <>
                  <button onClick={() => deletePlaylist(pl.id)} style={{ padding: "0.28rem 0.7rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)", color: "rgba(239,68,68,0.9)", fontSize: "0.68rem", cursor: "pointer" }}>Confirm Delete</button>
                  <button onClick={() => setConfirmDel(null)} style={{ ...S.btnGhost, padding: "0.28rem 0.55rem", fontSize: "0.68rem" }}>✕</button>
                </>
              ) : (
                <button onClick={() => deletePlaylist(pl.id)} style={{ ...S.btnGhost, padding: "0.28rem 0.7rem", fontSize: "0.68rem", color: "rgba(239,68,68,0.6)" }}>Delete</button>
              )}
            </div>
            {/* Track list */}
            {open && (
              <div>
                {plTracks.length === 0 ? (
                  <p style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.28)" }}>No tracks yet — add via the Gym Radio player on the main site.</p>
                ) : plTracks.map((tr) => (
                  <div key={tr.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.55rem 1rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{tr.youtubeId}</span>
                    <span style={{ flex: 1, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tr.title}</span>
                    <a href={`https://youtu.be/${tr.youtubeId}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>↗</a>
                    <button onClick={() => deleteTrack(tr.id)} style={{ ...S.btnGhost, padding: "0.2rem 0.55rem", fontSize: "0.65rem", color: "rgba(239,68,68,0.6)" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Responsive hook ─────────────────────────────────────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

/* ── Main component ──────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const isMobile = useIsMobile();
  const [tabIdx, setTabIdx] = useState(0);
  const [items, setItems] = useState<AnyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; item?: AnyItem } | null>(null);
  const [form, setForm] = useState<Record<string, FormValue>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const schema = SCHEMAS[tabIdx];
  const isSingleton = schema.sectionType === "presence" || schema.sectionType === "offer";
  const singletonEndpoint =
    schema.sectionType === "presence"
      ? "/api/admin/presence"
      : schema.sectionType === "offer"
        ? "/api/admin/offer"
        : "";

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const load = useCallback(async () => {
    if (isSingleton) return;
    setLoading(true);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/admin/${schema.collection}`);
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, [schema.collection, isSingleton]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(emptyForm(schema));
    setModal({ mode: "add" });
  };

  const openEdit = (item: AnyItem) => {
    setForm(itemToForm(schema, item));
    setModal({ mode: "edit", item });
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = formToBody(schema, form);
      let res: Response;
      if (modal?.mode === "edit" && modal.item) {
        res = await fetch(`/api/admin/${schema.collection}/${modal.item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/admin/${schema.collection}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      if (res.ok) {
        setModal(null);
        await load();
        notify(modal?.mode === "edit" ? "Saved." : "Created.");
      }
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    const res = await fetch(`/api/admin/${schema.collection}/${id}`, { method: "DELETE" });
    if (res.ok) {
      setConfirmDelete(null);
      await load();
      notify("Deleted.");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const switchTab = (i: number) => {
    setTabIdx(i);
    setConfirmDelete(null);
    setItems([]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Toast */}
      {notification && (
        <div style={{ position: "fixed", top: "1rem", right: "1rem", zIndex: 200, background: "#fff", color: "#000", padding: "0.6rem 1.2rem", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.1em", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          {notification}
        </div>
      )}

      {/* Header */}
      <header style={{ background: "#0d0d0d", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: isMobile ? "0 1rem" : "0 1.5rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <span style={{ background: "#fff", color: "#000", width: 32, height: 32, display: "grid", placeItems: "center", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.06em", flexShrink: 0 }}>AR</span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)" }}>Admin Panel</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <a href="/" target="_blank" rel="noreferrer" style={{ fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
            View Site ↗
          </a>
          <button onClick={logout} style={{ ...S.btnGhost, padding: "0.35rem 0.85rem", fontSize: "0.7rem" }}>Logout</button>
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex: 1, overflow: isMobile ? "visible" : "hidden" }}>

        {/* Sidebar — vertical on desktop, horizontal scroll bar on mobile */}
        <aside
          style={
            isMobile
              ? { display: "flex", gap: "0.4rem", overflowX: "auto", background: "#0b0b0b", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0.6rem 0.75rem", flexShrink: 0, position: "sticky", top: 56, zIndex: 40, WebkitOverflowScrolling: "touch" }
              : { width: 200, background: "#0b0b0b", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem 0", flexShrink: 0, overflowY: "auto" }
          }
        >
          {isMobile ? (
            SCHEMAS.map((s, i) => (
              <button
                key={s.collection}
                onClick={() => switchTab(i)}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  padding: "0.5rem 0.85rem",
                  borderRadius: 6,
                  background: tabIdx === i ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${tabIdx === i ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.08)"}`,
                  color: tabIdx === i ? "#fff" : "rgba(255,255,255,0.5)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            ))
          ) : (
            SIDEBAR_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontSize: "0.58rem", letterSpacing: "0.28em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase", padding: "0 1.25rem", marginBottom: "0.4rem" }}>
                {group.label}
              </p>
              {group.indices.map((i) => {
                const s = SCHEMAS[i];
                return (
                  <button
                    key={s.collection}
                    onClick={() => switchTab(i)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "0.65rem 1.25rem",
                      background: tabIdx === i ? "rgba(255,255,255,0.05)" : "none",
                      border: "none",
                      borderLeft: `2px solid ${tabIdx === i ? "#fff" : "transparent"}`,
                      color: tabIdx === i ? "#fff" : "rgba(255,255,255,0.40)",
                      fontSize: "0.74rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            ))
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: isMobile ? "visible" : "auto", padding: isMobile ? "1.25rem 1rem" : "2rem 2.5rem", minWidth: 0 }}>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
            <div>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.24em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Managing</p>
              <h1 style={{ fontSize: isMobile ? "1.3rem" : "1.6rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>{schema.label}</h1>
            </div>
            {!isSingleton && !schema.readOnly && schema.sectionType !== "music" && (
              <button onClick={openAdd} style={S.btnPrimary}>+ Add New</button>
            )}
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "1.5rem" }} />

          {/* Singleton sections */}
          {schema.sectionType === "music" ? (
            <MusicAdmin notify={notify} />
          ) : isSingleton ? (
            <SingletonSection schema={schema} endpoint={singletonEndpoint} notify={notify} />
          ) : loading ? (
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em" }}>Loading…</p>
          ) : items.length === 0 ? (
            <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "2.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.3)", marginBottom: "1rem" }}>
                No {schema.label.toLowerCase()} yet.
                {schema.collection === "site_complaints" && " Anonymous complaints from visitors will appear here."}
              </p>
              {!schema.readOnly && (
                <button onClick={openAdd} style={S.btnGhost}>Create First</button>
              )}
            </div>
          ) : (
            <div style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Table head */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "0.6rem 1rem", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.62rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                  {schema.collection === "site_complaints" ? "Message" : schema.fields[0]?.label ?? "Item"}
                </span>
                <span style={{ fontSize: "0.62rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Actions</span>
              </div>

              {/* Rows */}
              {items.map((item, rowIdx) => (
                <div
                  key={item.id as string}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.9rem 1rem",
                    borderBottom: rowIdx < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    background: confirmDelete === item.id ? "rgba(239,68,68,0.04)" : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.88rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {String(item[schema.displayKey] ?? "").slice(0, 120)}
                    </p>
                    {schema.subtitleKey && (
                      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.32)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {String(item[schema.subtitleKey] ?? "").slice(0, 80)}
                        {String(item[schema.subtitleKey] ?? "").length > 80 ? "…" : ""}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: "0.4rem", flexShrink: 0 }}>
                    {!schema.readOnly && (
                      <button
                        onClick={() => openEdit(item)}
                        style={{ ...S.btnGhost, padding: "0.32rem 0.8rem", fontSize: "0.7rem" }}
                      >
                        Edit
                      </button>
                    )}

                    {confirmDelete === item.id ? (
                      <>
                        <button
                          onClick={() => del(item.id as string)}
                          style={{ padding: "0.32rem 0.8rem", background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.5)", color: "rgba(239,68,68,0.9)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          style={{ padding: "0.32rem 0.65rem", background: "transparent", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => del(item.id as string)}
                        style={{ padding: "0.32rem 0.8rem", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {modal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}
        >
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.10)", width: "100%", maxWidth: 520, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <h2 style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)" }}>
                {modal.mode === "add" ? `New ${schema.label.replace(/s$/, "")}` : `Edit ${schema.label.replace(/s$/, "")}`}
              </h2>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.40)", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem", overflowY: "auto", flex: 1 }}>
              {schema.fields.map((field) => (
                <div key={field.key}>
                  <label style={S.label}>
                    {field.label}
                    {field.hint && (
                      <span style={{ marginLeft: "0.5em", fontSize: "0.62rem", color: "rgba(255,255,255,0.22)", letterSpacing: "0.05em", textTransform: "none" }}>
                        {field.hint}
                      </span>
                    )}
                  </label>

                  {field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={String(form[field.key] ?? "")}
                      onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                      style={{ ...S.inputBase, resize: "vertical" }}
                    />
                  ) : field.type === "list" ? (
                    <textarea
                      rows={4}
                      placeholder="One item per line"
                      value={Array.isArray(form[field.key]) ? (form[field.key] as string[]).join("\n") : String(form[field.key] ?? "")}
                      onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value.split("\n") }))}
                      style={{ ...S.inputBase, resize: "vertical" }}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={String(form[field.key] ?? "")}
                      onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                      style={{ ...S.inputBase, background: "#1a1a1a" }}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <label style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(form[field.key])}
                        onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: "#fff" }}
                      />
                      <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.65)" }}>Yes</span>
                    </label>
                  ) : (
                    <input
                      type="text"
                      value={String(form[field.key] ?? "")}
                      onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                      style={S.inputBase}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "flex-end", gap: "0.6rem", flexShrink: 0 }}>
              <button onClick={() => setModal(null)} style={S.btnGhost}>Cancel</button>
              <button
                onClick={save}
                disabled={saving}
                style={{ ...S.btnPrimary, opacity: saving ? 0.65 : 1, cursor: saving ? "wait" : "pointer" }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
