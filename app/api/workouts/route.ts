import { NextResponse } from "next/server";
import { workoutsCollection } from "@/app/lib/db";
import { getSessionUserId } from "@/app/lib/session";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const workouts = await workoutsCollection();
    const logs = await workouts
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load workouts." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const body = await request.json();
    const cleanDate = String(body.date || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return NextResponse.json({ error: "Choose a valid workout date." }, { status: 400 });
    }

    // Accept either a single { exercise, minutes } or a batch { entries: [...] }.
    const rawEntries = Array.isArray(body.entries)
      ? body.entries
      : [{ exercise: body.exercise, minutes: body.minutes }];

    const now = new Date();
    const docs = [];

    for (const entry of rawEntries) {
      const cleanExercise = String(entry?.exercise || "").trim();
      const cleanMinutes = Number(entry?.minutes);

      if (cleanExercise.length < 2) {
        return NextResponse.json({ error: "Add the exercise you did." }, { status: 400 });
      }

      if (!Number.isFinite(cleanMinutes) || cleanMinutes <= 0 || cleanMinutes > 600) {
        return NextResponse.json({ error: "Minutes must be between 1 and 600." }, { status: 400 });
      }

      docs.push({
        userId,
        date: cleanDate,
        exercise: cleanExercise,
        minutes: Math.round(cleanMinutes),
        createdAt: now,
      });
    }

    if (docs.length === 0) {
      return NextResponse.json({ error: "Add at least one exercise." }, { status: 400 });
    }

    const workouts = await workoutsCollection();
    await workouts.insertMany(docs);

    const logs = await workouts
      .find({ userId }, { projection: { _id: 0 } })
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save workout." },
      { status: 500 },
    );
  }
}
