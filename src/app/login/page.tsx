"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { t } = useI18n();
  const params = useSearchParams();
  const linkError = params.get("error") === "link";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send the link.");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <main className="animate-rise mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-5 py-16">
      <Card className="p-8">
        {status === "sent" ? (
          <>
            <div className="mb-2 text-[32px]">📬</div>
            <h1 className="mb-2 font-[family-name:var(--font-display)] text-[24px] font-bold">
              {t.auth.sentTitle}
            </h1>
            <p className="text-[15px] leading-[1.6] text-muted">
              {t.auth.sentHint.replace("{email}", email)}
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-2 font-[family-name:var(--font-display)] text-[26px] font-bold">
              {t.auth.loginTitle}
            </h1>
            <p className="mb-5 text-[15px] leading-[1.6] text-muted">{t.auth.loginSubtitle}</p>
            {linkError && (
              <p className="mb-4 rounded-[10px] bg-rose-soft px-4 py-3 text-[13.5px] text-danger">
                {t.auth.linkError}
              </p>
            )}
            <form onSubmit={submit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.auth.emailPlaceholder}
                className="w-full rounded-[12px] border border-line bg-paper px-4 py-3 text-[15px]"
              />
              {error && <p className="text-[13.5px] text-danger">{error}</p>}
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" ? t.auth.sending : t.auth.sendLink}
              </Button>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
