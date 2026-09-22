"use client";

import { initials, hue } from "@/lib/ui/avatar";

/** Renders a user's uploaded avatar, or a generated initials circle. */
export function UserAvatar({
  name,
  avatarKey,
  size = 28,
}: {
  name: string;
  avatarKey?: string | null;
  size?: number;
}) {
  if (avatarKey) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/avatar/${avatarKey}`}
        alt={name}
        width={size}
        height={size}
        className="flex-none rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full font-[family-name:var(--font-display)] font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: hue(name) }}
    >
      {initials(name)}
    </span>
  );
}
