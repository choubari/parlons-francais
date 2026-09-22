import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { ensureSeeded } from "@/lib/db/seed";
import { getRunnable, deleteExercise, toCardDTO } from "@/lib/db/exercises";
import { getCurrentUser } from "@/lib/auth/user";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  await ensureSeeded(db);
  const user = await getCurrentUser();
  const row = await getRunnable(db, id, user?.id ?? null);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ card: toCardDTO(row, user?.id ?? null) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  const db = await getDb();
  await deleteExercise(db, user.id, id);
  return NextResponse.json({ ok: true });
}
