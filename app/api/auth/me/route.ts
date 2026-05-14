import { NextResponse } from "next/server";
import { usersCollection } from "@/app/lib/db";
import { getSessionUserId } from "@/app/lib/session";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const users = await usersCollection();
    const user = await users.findOne({ userId }, { projection: { passwordHash: 0, salt: 0 } });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const referralCount = await users.countDocuments({ referredBy: userId });

    return NextResponse.json({
      user: {
        userId: user.userId,
        goals: user.goals || [],
        referredBy: user.referredBy || null,
        referralCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load user." },
      { status: 500 },
    );
  }
}
