"use client";

import { Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export default function PrivacyPage() {
  const { t } = useI18n();
  return (
    <main className="animate-rise mx-auto w-full max-w-[760px] flex-1 px-5 pb-20 pt-10 sm:px-10">
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-[32px] font-bold">
        {t.privacy.title}
      </h1>
      <Card className="flex flex-col gap-4 p-7 text-[15px] leading-[1.65] text-ink-soft">
        {t.privacy.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </Card>
    </main>
  );
}
