import { NextResponse } from "next/server";
import { getPresence } from "@/app/lib/site-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getPresence());
  } catch {
    return NextResponse.json({ current: 0, capacity: 50, updatedAt: "" });
  }
}
