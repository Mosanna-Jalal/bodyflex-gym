import { NextResponse } from "next/server";
import { usersCollection } from "@/app/lib/db";
import { getSessionUserId } from "@/app/lib/session";

export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { goals } = await request.json();
    const cleanGoals = Array.isArray(goals)
      ? goals.map((goal) => String(goal).trim()).filter(Boolean).slice(0, 8)
      : [];
    const users = await usersCollection();

    await users.updateOne({ userId }, { $set: { goals: cleanGoals } });

    return NextResponse.json({ goals: cleanGoals });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save goals." },
      { status: 500 },
    );
  }
}
