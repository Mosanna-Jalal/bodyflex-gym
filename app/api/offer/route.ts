import { NextResponse } from "next/server";
import { getOffer } from "@/app/lib/site-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getOffer());
  } catch {
    return NextResponse.json(null);
  }
}
