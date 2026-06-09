import { NextResponse } from "next/server";
import { weightCollection } from "@/app/lib/db";
import { getSessionUserId } from "@/app/lib/session";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const col = await weightCollection();
    const logs = await col
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Could not load weight logs." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const { date, weight, unit, notes, constipation } = await request.json();
    const cleanDate = String(date || "").trim();
    const cleanWeight = Number(weight);
    const cleanUnit = ["kg", "lbs"].includes(String(unit)) ? String(unit) : "kg";
    const cleanNotes = String(notes || "").trim().slice(0, 500);
    const cleanConstipation = ["none", "mild", "moderate", "severe"].includes(String(constipation))
      ? String(constipation)
      : "none";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }

    if (!Number.isFinite(cleanWeight) || cleanWeight <= 0 || cleanWeight > 999) {
      return NextResponse.json({ error: "Weight must be between 1 and 999." }, { status: 400 });
    }

    const col = await weightCollection();

    await col.replaceOne(
      { userId, date: cleanDate },
      {
        userId,
        date: cleanDate,
        weight: cleanWeight,
        unit: cleanUnit,
        notes: cleanNotes,
        constipation: cleanConstipation,
        createdAt: new Date(),
      },
      { upsert: true },
    );

    const logs = await col
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Could not save weight." }, { status: 500 });
  }
}
