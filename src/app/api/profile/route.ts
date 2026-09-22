import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/user";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { firstName?: string; lastName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }

  const db = await getDb();
  await db
    .prepare("UPDATE users SET first_name = ?, last_name = ? WHERE id = ?")
    .bind(firstName.slice(0, 40), lastName.slice(0, 40), user.id)
    .run();

  return NextResponse.json({ ok: true });
}
