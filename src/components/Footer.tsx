"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { GITHUB_URL } from "@/lib/config";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-line bg-cream px-5 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-4 text-[13px] text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-display)] font-bold text-ink">
            {t.brand}
          </span>
          <span>· {t.footer.tagline}</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/" className="hover:text-ink">{t.nav.league}</Link>
          <Link href="/private" className="hover:text-ink">{t.nav.private}</Link>
          <Link href="/progress" className="hover:text-ink">{t.nav.progress}</Link>
          <Link href="/privacy" className="hover:text-ink">{t.footer.privacy}</Link>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-ink">
            GitHub ↗
          </a>
        </nav>
      </div>
    </footer>
  );
}
