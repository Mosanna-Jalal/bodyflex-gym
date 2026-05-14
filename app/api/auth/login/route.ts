import { NextResponse } from "next/server";
import { usersCollection } from "@/app/lib/db";
import { verifyPassword } from "@/app/lib/password";
import { setSession } from "@/app/lib/session";

export async function POST(request: Request) {
  try {
    const { userId, password } = await request.json();
    const normalizedUserId = String(userId || "").trim();
    const cleanPassword = String(password || "");
    const users = await usersCollection();
    const user = await users.findOne({ userId: normalizedUserId });

    if (!user || !verifyPassword(cleanPassword, user.salt, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid user ID or password." }, { status: 401 });
    }

    await setSession(user.userId);

    return NextResponse.json({ user: { userId: user.userId, goals: user.goals || [] } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not log in." },
      { status: 500 },
    );
  }
}
