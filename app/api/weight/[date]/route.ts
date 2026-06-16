import { NextResponse } from "next/server";
import { weightCollection } from "@/app/lib/db";
import { getSessionUserId } from "@/app/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const { date } = await params;
    const cleanDate = String(date || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }

    const col = await weightCollection();
    await col.deleteOne({ userId, date: cleanDate });

    const logs = await col
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Could not delete weight log." }, { status: 500 });
  }
}
