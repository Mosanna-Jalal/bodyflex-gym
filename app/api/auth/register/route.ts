import { NextResponse } from "next/server";
import { usersCollection } from "@/app/lib/db";
import { hashPassword } from "@/app/lib/password";
import { setSession } from "@/app/lib/session";

export async function POST(request: Request) {
  try {
    const { userId, password, referredBy } = await request.json();
    const normalizedUserId = String(userId || "").trim();
    const cleanReferredBy = String(referredBy || "").trim();
    const cleanPassword = String(password || "");

    if (normalizedUserId.length < 3 || normalizedUserId.length > 48) {
      return NextResponse.json(
        { error: "User ID must be between 3 and 48 characters." },
        { status: 400 },
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const users = await usersCollection();
    const existingUser = await users.findOne({ userId: normalizedUserId });

    if (existingUser) {
      return NextResponse.json({ error: "That user ID is already taken." }, { status: 409 });
    }

    let resolvedReferredBy: string | undefined;
    if (cleanReferredBy) {
      const referrer = await users.findOne({ userId: cleanReferredBy });
      if (referrer) resolvedReferredBy = cleanReferredBy;
    }

    const { salt, hash } = hashPassword(cleanPassword);

    await users.insertOne({
      userId: normalizedUserId,
      passwordHash: hash,
      salt,
      goals: [],
      createdAt: new Date(),
      ...(resolvedReferredBy ? { referredBy: resolvedReferredBy } : {}),
    });
    await setSession(normalizedUserId);

    return NextResponse.json({ user: { userId: normalizedUserId, goals: [] } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not register user." },
      { status: 500 },
    );
  }
}
