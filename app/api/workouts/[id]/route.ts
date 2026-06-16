import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { workoutsCollection, listUserWorkouts } from "@/app/lib/db";
import { getSessionUserId } from "@/app/lib/session";

function toObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { id } = await params;
    const _id = toObjectId(id);
    if (!_id) {
      return NextResponse.json({ error: "Invalid log id." }, { status: 400 });
    }

    const body = await request.json();
    const cleanDate = String(body.date || "").trim();
    const cleanExercise = String(body.exercise || "").trim();
    const cleanMinutes = Number(body.minutes);

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
    const result = await workouts.updateOne(
      { _id, userId },
      { $set: { date: cleanDate, exercise: cleanExercise, minutes: Math.round(cleanMinutes) } },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Workout not found." }, { status: 404 });
    }

    const logs = await listUserWorkouts(userId);
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update workout." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { id } = await params;
    const _id = toObjectId(id);
    if (!_id) {
      return NextResponse.json({ error: "Invalid log id." }, { status: 400 });
    }

    const workouts = await workoutsCollection();
    await workouts.deleteOne({ _id, userId });

    const logs = await listUserWorkouts(userId);
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete workout." },
      { status: 500 },
    );
  }
}
