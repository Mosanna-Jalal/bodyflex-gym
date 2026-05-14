import { NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const clean = String(message || "").trim();

    if (clean.length < 10) {
      return NextResponse.json({ error: "Please write at least 10 characters." }, { status: 400 });
    }

    if (clean.length > 2000) {
      return NextResponse.json({ error: "Message too long (max 2000 characters)." }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("site_complaints").insertOne({ message: clean, createdAt: new Date() });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not submit complaint." }, { status: 500 });
  }
}
