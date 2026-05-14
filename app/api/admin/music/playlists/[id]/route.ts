import { NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/admin-auth";
import { deleteMusicPlaylist } from "@/app/lib/site-db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ok = await deleteMusicPlaylist(id);
  return NextResponse.json({ ok });
}
