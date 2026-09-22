import "server-only";
import { getDb } from "@/lib/db/client";
import { getSessionUserId } from "./session";

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarKey: string | null;
  role: "user" | "admin";
};

type UserRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_key: string | null;
  role: string;
};

function mapUser(row: UserRow): CurrentUser {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarKey: row.avatar_key,
    role: row.role === "admin" ? "admin" : "user",
  };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const uid = await getSessionUserId();
  if (!uid) return null;
  const db = await getDb();
  const row = await db.prepare("SELECT * FROM users WHERE id = ?").bind(uid).first<UserRow>();
  return row ? mapUser(row) : null;
}

/** A user needs onboarding until they've set a first + last name. */
export function needsOnboarding(u: CurrentUser): boolean {
  return !u.firstName?.trim() || !u.lastName?.trim();
}

export function displayName(u: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email.split("@")[0];
}
