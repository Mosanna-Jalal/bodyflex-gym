"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type MusicPlaylist = { id: string; name: string; color: string; shareToken: string };
type MusicTrack = { id: string; playlistId: string; title: string; youtubeId: string };

declare global {
  interface Window {
    YT: { Player: new (el: string | HTMLElement, opts: object) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayer {
  loadVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  setVolume(v: number): void;
  destroy(): void;
}

const COLORS = ["#b91c1c", "#0369a1", "#15803d", "#7c3aed", "#c2410c", "#0e7490"];

export default function MusicPlayer() {
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolume] = useState(80);
  const [showAdd, setShowAdd] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addPlaylistId, setAddPlaylistId] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [showNewPl, setShowNewPl] = useState(false);
  const [newPlName, setNewPlName] = useState("");
  const [newPlColor, setNewPlColor] = useState(COLORS[0]);
  const [newPlLoading, setNewPlLoading] = useState(false);

  const ytPlayer = useRef<YTPlayer | null>(null);
  const playerReady = useRef(false);
  const volumeRef = useRef(volume);

  // Refs for stable callbacks
  const stateRef = useRef({ currentIdx: -1, shuffle: false, visibleTracks: [] as MusicTrack[] });

  const visibleTracks = activeTab === "all" ? tracks : tracks.filter((t) => t.playlistId === activeTab);
  const currentTrack = currentIdx >= 0 && currentIdx < visibleTracks.length ? visibleTracks[currentIdx] : null;

  useEffect(() => {
    stateRef.current = { currentIdx, shuffle, visibleTracks };
  });

  // Load data
  useEffect(() => {
    fetch("/api/music/playlists")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setPlaylists(d));
    fetch("/api/music/tracks")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setTracks(d));
  }, []);

  // Check ?addto= URL param
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("addto");
    if (token) { setPendingToken(token); setShowAdd(true); }
  }, []);

  useEffect(() => {
    if (pendingToken && playlists.length > 0) {
      const pl = playlists.find((p) => p.shareToken === pendingToken);
      if (pl) setAddPlaylistId(pl.id);
      setPendingToken(null);
    }
  }, [pendingToken, playlists]);

  // Stable playNext
  const playNext = useCallback(() => {
    const { currentIdx, shuffle, visibleTracks } = stateRef.current;
    if (!visibleTracks.length) return;
    let next: number;
    if (shuffle) {
      do { next = Math.floor(Math.random() * visibleTracks.length); }
      while (visibleTracks.length > 1 && next === currentIdx);
    } else {
      next = (currentIdx + 1) % visibleTracks.length;
    }
    setCurrentIdx(next);
    setIsPlaying(true);
  }, []);

  // Init YouTube API
  useEffect(() => {
    const init = () => {
      if (ytPlayer.current) return;
      ytPlayer.current = new window.YT.Player("yt-player-host", {
        height: "1",
        width: "1",
        videoId: "",
        playerVars: { autoplay: 0, controls: 0, rel: 0, fs: 0, iv_load_policy: 3 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            playerReady.current = true;
            e.target.setVolume(volumeRef.current);
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 1) setIsPlaying(true);
            if (e.data === 2) setIsPlaying(false);
            if (e.data === 0) playNext();
          },
        },
      });
    };

    if (window.YT?.Player) {
      init();
    } else {
      window.onYouTubeIframeAPIReady = init;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    }
  }, [playNext]);

  // Load video when track changes
  useEffect(() => {
    if (!playerReady.current || !ytPlayer.current || !currentTrack) return;
    ytPlayer.current.loadVideoById(currentTrack.youtubeId);
    ytPlayer.current.setVolume(volumeRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.youtubeId]);

  // Volume sync
  useEffect(() => {
    volumeRef.current = volume;
    if (playerReady.current && ytPlayer.current) ytPlayer.current.setVolume(volume);
  }, [volume]);

  // Reset on tab change
  useEffect(() => {
    setCurrentIdx(-1);
    setIsPlaying(false);
  }, [activeTab]);

  const togglePlay = () => {
    if (currentIdx < 0) {
      if (visibleTracks.length > 0) { setCurrentIdx(0); setIsPlaying(true); }
      return;
    }
    if (isPlaying) { ytPlayer.current?.pauseVideo(); setIsPlaying(false); }
    else { ytPlayer.current?.playVideo(); setIsPlaying(true); }
  };

  const playPrev = () => {
    if (!visibleTracks.length) return;
    setCurrentIdx((p) => (p <= 0 ? visibleTracks.length - 1 : p - 1));
    setIsPlaying(true);
  };

  const playTrack = (idx: number) => {
    if (idx === currentIdx) { togglePlay(); return; }
    setCurrentIdx(idx);
    setIsPlaying(true);
  };

  const handleAdd = async () => {
    setAddError("");
    if (!addUrl.trim()) { setAddError("YouTube URL is required"); return; }
    if (!addPlaylistId) { setAddError("Select a playlist"); return; }
    setAddLoading(true);
    try {
      const pl = playlists.find((p) => p.id === addPlaylistId);
      const res = await fetch("/api/music/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareToken: pl?.shareToken, youtubeUrl: addUrl.trim(), title: addTitle.trim() || undefined }),
      });
      if (!res.ok) { const d = await res.json(); setAddError(d.error ?? "Failed"); return; }
      const track = await res.json();
      setTracks((prev) => [...prev, track]);
      setAddUrl(""); setAddTitle(""); setShowAdd(false);
    } catch { setAddError("Network error"); }
    finally { setAddLoading(false); }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlName.trim()) return;
    setNewPlLoading(true);
    try {
      const res = await fetch("/api/music/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlName.trim(), color: newPlColor }),
      });
      if (!res.ok) return;
      const pl = await res.json();
      setPlaylists((prev) => [...prev, pl]);
      setAddPlaylistId(pl.id);
      setNewPlName("");
      setShowNewPl(false);
    } finally {
      setNewPlLoading(false);
    }
  };

  const copyShare = (pl: MusicPlaylist) => {
    navigator.clipboard.writeText(`${window.location.origin}/?addto=${pl.shareToken}#gymradio`);
    setCopied(pl.id);
    setTimeout(() => setCopied(null), 2500);
  };

  const plColor = (pid: string) => playlists.find((p) => p.id === pid)?.color ?? "#b91c1c";

  const B = "1px solid rgba(255,255,255,0.08)";

  return (
    <section id="gymradio" style={{ background: "rgba(5,5,5,0.96)", borderTop: B }}>
      {/* Hidden YouTube player target */}
      <div id="yt-player-host" style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6">
        {/* Section header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label mb-2 text-white/30">AR FITNESS</p>
            <h2
              className="font-bebas text-white"
              style={{ fontSize: "clamp(2.5rem,6vw,5rem)", letterSpacing: "0.05em", lineHeight: 1 }}
            >
              GYM RADIO
            </h2>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            style={{
              fontFamily: "inherit",
              background: "transparent",
              border: B,
              color: showAdd ? "#fff" : "rgba(255,255,255,0.45)",
              padding: "0.5rem 1.2rem",
              fontSize: "0.7rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            {showAdd ? "✕  Cancel" : "+ Add Track"}
          </button>
        </div>

        {/* Add track form */}
        {showAdd && (
          <div className="mb-8 p-6" style={{ background: "rgba(255,255,255,0.03)", border: B }}>
            <p style={{ fontSize: "0.62rem", letterSpacing: "0.24em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "1rem" }}>
              Paste a YouTube link — it goes straight onto the playlist
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_180px_auto]">
              {(["YouTube URL *", "Song title (optional)"] as const).map((ph, i) => (
                <input
                  key={ph}
                  value={i === 0 ? addUrl : addTitle}
                  onChange={(e) => i === 0 ? setAddUrl(e.target.value) : setAddTitle(e.target.value)}
                  placeholder={ph}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  style={{ background: "rgba(255,255,255,0.06)", border: B, padding: "0.65rem 0.9rem", color: "#fff", fontSize: "0.875rem", outline: "none", width: "100%", fontFamily: "inherit" }}
                />
              ))}
              <select
                value={addPlaylistId}
                onChange={(e) => setAddPlaylistId(e.target.value)}
                style={{ background: "#111", border: B, padding: "0.65rem 0.9rem", color: "#fff", fontSize: "0.875rem", outline: "none", fontFamily: "inherit" }}
              >
                <option value="">Select playlist</option>
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={addLoading}
                style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "0.65rem 1.4rem", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", cursor: addLoading ? "wait" : "pointer", opacity: addLoading ? 0.6 : 1, fontFamily: "inherit", fontWeight: 700 }}
              >
                {addLoading ? "…" : "Add"}
              </button>
            </div>
            {addError && <p style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#f87171" }}>{addError}</p>}

            {/* Create new playlist inline */}
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setShowNewPl((v) => !v)}
                style={{ background: "none", border: "none", fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", color: showNewPl ? "#fff" : "rgba(255,255,255,0.38)", fontFamily: "inherit", padding: 0 }}
              >
                {showNewPl ? "✕ Cancel" : "+ New Playlist"}
              </button>

              {showNewPl && (
                <>
                  <input
                    value={newPlName}
                    onChange={(e) => setNewPlName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                    placeholder="Playlist name"
                    style={{ background: "rgba(255,255,255,0.06)", border: B, padding: "0.4rem 0.75rem", color: "#fff", fontSize: "0.8rem", outline: "none", fontFamily: "inherit", width: 160 }}
                  />
                  <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewPlColor(c)}
                        style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: newPlColor === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={newPlLoading}
                    style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "0.4rem 1rem", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", cursor: newPlLoading ? "wait" : "pointer", fontFamily: "inherit", fontWeight: 700, opacity: newPlLoading ? 0.6 : 1 }}
                  >
                    {newPlLoading ? "…" : "Create"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Left — tabs + tracklist */}
          <div>
            {/* Category tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
              {["all", ...playlists.map((p) => p.id)].map((tabId) => {
                const pl = playlists.find((p) => p.id === tabId);
                const active = activeTab === tabId;
                const color = pl?.color ?? "#b91c1c";
                return (
                  <button
                    key={tabId}
                    onClick={() => setActiveTab(tabId)}
                    style={{
                      background: active ? color : "rgba(255,255,255,0.05)",
                      color: active ? "#fff" : "rgba(255,255,255,0.48)",
                      border: `1px solid ${active ? color : "rgba(255,255,255,0.10)"}`,
                      padding: "0.38rem 1rem",
                      fontSize: "0.68rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontWeight: 700,
                      transition: "all 0.15s",
                    }}
                  >
                    {tabId === "all" ? "All" : pl?.name}
                  </button>
                );
              })}
            </div>

            {/* Tracks */}
            <div style={{ maxHeight: 400, overflowY: "auto", border: B }}>
              {visibleTracks.length === 0 ? (
                <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
                  <p style={{ fontSize: "0.72rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>
                    No tracks yet — add one above
                  </p>
                </div>
              ) : visibleTracks.map((track, idx) => {
                const active = idx === currentIdx;
                const pl = playlists.find((p) => p.id === track.playlistId);
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(idx)}
                    className="group"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      cursor: "pointer",
                      background: active ? "rgba(255,255,255,0.05)" : "transparent",
                      borderLeft: `3px solid ${active ? (pl?.color ?? "#b91c1c") : "transparent"}`,
                      borderBottom: idx < visibleTracks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      transition: "background 0.12s",
                    }}
                  >
                    <span style={{ width: 24, textAlign: "right", flexShrink: 0, fontFamily: "monospace", fontSize: "0.72rem", color: active ? (pl?.color ?? "#b91c1c") : "rgba(255,255,255,0.22)" }}>
                      {active && isPlaying ? "▶" : String(idx + 1).padStart(2, "0")}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: active ? "#fff" : "rgba(255,255,255,0.72)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {track.title}
                      </p>
                      {activeTab === "all" && pl && (
                        <p style={{ marginTop: 2, fontSize: "0.65rem", letterSpacing: "0.16em", textTransform: "uppercase", color: pl.color, opacity: 0.75 }}>{pl.name}</p>
                      )}
                    </div>
                    <a
                      href={`https://youtu.be/${track.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ flexShrink: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", transition: "color 0.12s", textDecoration: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                    >
                      ↗
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — player */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* Now playing */}
            <div style={{ border: B, padding: "1.25rem" }}>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.24em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "0.9rem" }}>Now Playing</p>
              {currentTrack ? (
                <>
                  <div style={{ aspectRatio: "16/9", background: "rgba(0,0,0,0.6)", overflow: "hidden", marginBottom: "0.75rem" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${currentTrack.youtubeId}/mqdefault.jpg`}
                      alt={currentTrack.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }}
                    />
                  </div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#fff", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {currentTrack.title}
                  </p>
                  <p style={{ marginTop: "0.3rem", fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: plColor(currentTrack.playlistId), opacity: 0.8 }}>
                    {playlists.find((p) => p.id === currentTrack.playlistId)?.name}
                  </p>
                </>
              ) : (
                <div style={{ aspectRatio: "16/9", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.62rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.18)", textTransform: "uppercase" }}>Select a track</p>
                </div>
              )}

              {/* Controls */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.1rem" }}>
                <button onClick={playPrev} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: "1.1rem", transition: "color 0.12s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>⏮</button>
                <button
                  onClick={togglePlay}
                  style={{ width: 44, height: 44, background: "#b91c1c", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", transition: "opacity 0.12s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <button onClick={playNext} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: "1.1rem", transition: "color 0.12s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>⏭</button>
                <button
                  onClick={() => setShuffle((v) => !v)}
                  style={{ background: "none", border: `1px solid ${shuffle ? "#b91c1c" : "rgba(255,255,255,0.10)"}`, color: shuffle ? "#b91c1c" : "rgba(255,255,255,0.35)", padding: "0.28rem 0.65rem", fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                >
                  Shuf
                </button>
              </div>

              {/* Volume */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "1rem" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.12em" }}>VOL</span>
                <input
                  type="range" min={0} max={100} value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  style={{ flex: 1, accentColor: "#b91c1c" }}
                />
                <span style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.28)", width: 24, textAlign: "right" }}>{volume}</span>
              </div>
            </div>

            {/* Playlists + share */}
            <div style={{ border: B, padding: "1.25rem" }}>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.24em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "0.9rem" }}>Playlists</p>
              {playlists.length === 0 ? (
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.22)" }}>No playlists — create one in admin panel</p>
              ) : playlists.map((pl) => (
                <div key={pl.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: pl.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.825rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</span>
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.28)", flexShrink: 0 }}>({tracks.filter((t) => t.playlistId === pl.id).length})</span>
                  </div>
                  <button
                    onClick={() => copyShare(pl)}
                    style={{ background: "none", border: "none", fontSize: "0.65rem", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", color: copied === pl.id ? "#4ade80" : "rgba(255,255,255,0.35)", flexShrink: 0, marginLeft: "0.75rem", transition: "color 0.15s", fontFamily: "inherit" }}
                  >
                    {copied === pl.id ? "Copied!" : "Share"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
