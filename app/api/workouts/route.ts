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

    const { date, exercise, minutes } = await request.json();
    const cleanDate = String(date || "").trim();
    const cleanExercise = String(exercise || "").trim();
    const cleanMinutes = Number(minutes);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return NextResponse.json({ error: "Choose a valid workout date." }, { status: 400 });
    }

    if (cleanExercise.length < 2) {
      return NextResponse.json({ error: "Add the exercise you did." }, { status: 400 });
    }

    if (!Number.isFinite(cleanMinutes) || cleanMinutes <= 0 || cleanMinutes > 600) {
      return NextResponse.json({ error: "Minutes must be between 1 and 600." }, { status: 400 });
    }

    const workouts = await workoutsCollection();

    await workouts.insertOne({
      userId,
      date: cleanDate,
      exercise: cleanExercise,
      minutes: Math.round(cleanMinutes),
      createdAt: new Date(),
    });

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
