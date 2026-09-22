"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { ProfileEditor } from "@/components/ProfileEditor";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";

export default function OnboardingPage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <main className="animate-rise mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center px-5 py-16">
      <Card className="p-8">
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-[26px] font-bold">
          {t.auth.onboardingTitle}
        </h1>
        <p className="mb-6 text-[15px] leading-[1.6] text-muted">{t.auth.onboardingSubtitle}</p>
        <ProfileEditor
          initialFirst={user.firstName ?? ""}
          initialLast={user.lastName ?? ""}
          avatarKey={user.avatarKey}
          submitLabel={t.auth.save}
          onSaved={() => router.replace("/")}
        />
      </Card>
    </main>
  );
}
