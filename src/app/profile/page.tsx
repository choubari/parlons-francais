"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { ProfileEditor } from "@/components/ProfileEditor";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";

export default function ProfilePage() {
  const { t } = useI18n();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <main className="animate-rise mx-auto w-full max-w-[560px] flex-1 px-5 py-12">
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-[28px] font-bold">
        {t.auth.profileTitle}
      </h1>
      <Card className="p-8">
        <p className="mb-6 text-[14px] text-muted">{user.email}</p>
        <ProfileEditor
          initialFirst={user.firstName ?? ""}
          initialLast={user.lastName ?? ""}
          avatarKey={user.avatarKey}
          submitLabel={saved ? t.auth.profileSaved : t.auth.saveChanges}
          onSaved={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
          }}
        />
        <div className="mt-6 border-t border-line-soft pt-5">
          <Button variant="secondary" size="sm" onClick={logout}>
            {t.nav.signOut}
          </Button>
        </div>
      </Card>
    </main>
  );
}
