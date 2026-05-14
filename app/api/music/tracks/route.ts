import { NextResponse } from "next/server";
import { listMusicTracks } from "@/app/lib/site-db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playlistId = searchParams.get("playlist") ?? undefined;
  const tracks = await listMusicTracks(playlistId);
  return NextResponse.json(tracks);
}
