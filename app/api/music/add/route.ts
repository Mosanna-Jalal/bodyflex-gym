import { NextResponse } from "next/server";
import { getPlaylistByToken, addMusicTrack } from "@/app/lib/site-db";

export const dynamic = "force-dynamic";

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function POST(req: Request) {
  const { shareToken, youtubeUrl, title } = await req.json();

  if (!shareToken || !youtubeUrl) {
    return NextResponse.json({ error: "shareToken and youtubeUrl are required" }, { status: 400 });
  }

  const playlist = await getPlaylistByToken(shareToken);
  if (!playlist) {
    return NextResponse.json({ error: "Invalid share token" }, { status: 403 });
  }

  const youtubeId = extractYoutubeId(String(youtubeUrl));
  if (!youtubeId) {
    return NextResponse.json({ error: "Could not parse a valid YouTube video ID from that URL" }, { status: 400 });
  }

  const track = await addMusicTrack({
    playlistId: playlist.id,
    title: title?.trim() || `Track — ${new Date().toLocaleDateString("en-GB")}`,
    youtubeId,
  });

  return NextResponse.json(track, { status: 201 });
}
