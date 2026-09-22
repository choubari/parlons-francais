import { NextResponse } from "next/server";
import { getCurrentUser, needsOnboarding, displayName } from "@/lib/auth/user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarKey: user.avatarKey,
      role: user.role,
      name: displayName(user),
      needsOnboarding: needsOnboarding(user),
    },
  });
}
