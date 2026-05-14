import { NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/admin-auth";
import { updateItem, deleteItem } from "@/app/lib/site-db";

const ALLOWED = [
  "site_features",
  "site_classes",
  "site_trainers",
  "site_plans",
  "site_metrics",
  "site_notices",
  "site_complaints",
];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ collection: string; id: string }> },
) {
  const authed = await getAdminAuth();

  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collection, id } = await params;

  if (!ALLOWED.includes(collection)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = await updateItem(collection, id, body);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ collection: string; id: string }> },
) {
  const authed = await getAdminAuth();

  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collection, id } = await params;

  if (!ALLOWED.includes(collection)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deleted = await deleteItem(collection, id);

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
