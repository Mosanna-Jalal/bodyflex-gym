import { NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/admin-auth";
import { listItems, createItem } from "@/app/lib/site-db";

export const dynamic = "force-dynamic";

const ALLOWED = [
  "site_features",
  "site_classes",
  "site_trainers",
  "site_plans",
  "site_metrics",
  "site_notices",
  "site_complaints",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ collection: string }> },
) {
  const authed = await getAdminAuth();

  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collection } = await params;

  if (!ALLOWED.includes(collection)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = await listItems(collection);

  return NextResponse.json(items);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ collection: string }> },
) {
  const authed = await getAdminAuth();

  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collection } = await params;

  if (!ALLOWED.includes(collection)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const item = await createItem(collection, body);

  return NextResponse.json(item, { status: 201 });
}
