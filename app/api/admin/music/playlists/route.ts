import { NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/admin-auth";
import { listMusicPlaylists, createMusicPlaylist } from "@/app/lib/site-db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listMusicPlaylists());
}

export async function POST(req: Request) {
  if (!(await getAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const playlist = await createMusicPlaylist({ name: name.trim(), color: color || "#b91c1c" });
  return NextResponse.json(playlist, { status: 201 });
}
