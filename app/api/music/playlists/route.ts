import { NextResponse } from "next/server";
import { getSessionUserId } from "@/app/lib/session";
import { listMusicPlaylists, createMusicPlaylist } from "@/app/lib/site-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const playlists = await listMusicPlaylists();
  return NextResponse.json(playlists);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Members only" }, { status: 401 });

  const { name, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const playlist = await createMusicPlaylist({ name: name.trim(), color: color || "#b91c1c" });
  return NextResponse.json(playlist, { status: 201 });
}
