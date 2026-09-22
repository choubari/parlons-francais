import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { getScore } from "@/lib/db/scores";
import { getCurrentUser } from "@/lib/auth/user";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;
  const db = await getDb();
  const score = await getScore(db, id, user.id);
  if (!score) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ score });
}
