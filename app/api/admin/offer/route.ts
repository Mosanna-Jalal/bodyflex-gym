import { NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/admin-auth";
import { getOffer, setOffer } from "@/app/lib/site-db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getOffer());
}

export async function PUT(request: Request) {
  if (!(await getAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  return NextResponse.json(await setOffer(body));
}
