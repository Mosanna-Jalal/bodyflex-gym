import { NextResponse } from "next/server";
import { adminPassword, setAdminSession } from "@/app/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (String(password || "") !== adminPassword()) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await setAdminSession();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
