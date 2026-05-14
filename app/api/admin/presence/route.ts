import { NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/admin-auth";
import { getPresence, setPresence } from "@/app/lib/site-db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getPresence());
}

export async function PUT(request: Request) {
  if (!(await getAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { current, capacity } = await request.json();
  const c = Number(current);
  const cap = Number(capacity);

  if (!Number.isFinite(c) || c < 0) {
    return NextResponse.json({ error: "Invalid current count." }, { status: 400 });
  }

  if (!Number.isFinite(cap) || cap <= 0) {
    return NextResponse.json({ error: "Invalid capacity." }, { status: 400 });
  }

  return NextResponse.json(await setPresence({ current: Math.round(c), capacity: Math.round(cap) }));
}
