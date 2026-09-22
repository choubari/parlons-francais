"use client";

import { useState } from "react";
import { Dialog, Button } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export function ShareDialog({
  open,
  onClose,
  title,
  link,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  link: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the link is still selectable in the field */
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="mb-1.5 font-[family-name:var(--font-display)] text-[18px] font-bold">
        {t.share.title}
        {title ? ` — ${title}` : ""}
      </div>
      <p className="mb-4 text-[13.5px] text-muted">{t.share.subtitle}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-[10px] border border-line bg-cream px-3.5 py-2.5 text-[13.5px] text-ink-soft"
        />
        <Button variant="dark" size="sm" onClick={copy}>
          {copied ? t.share.copied : t.share.copy}
        </Button>
      </div>
    </Dialog>
  );
}
