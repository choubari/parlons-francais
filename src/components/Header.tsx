"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { LanguageToggle } from "@/components/ui";
import { UserAvatar } from "@/components/UserAvatar";

function Logo() {
  // Tricolore tile — bleu / blanc / rouge, no dark surface.
  return (
    <div className="flex h-[34px] w-[34px] flex-none overflow-hidden rounded-[10px] border border-line">
      <div className="h-full w-1/3 bg-grape" />
      <div className="h-full w-1/3 bg-white" />
      <div className="h-full w-1/3 bg-flame" />
    </div>
  );
}

const NAV = [
  { key: "league", href: "/" },
  { key: "private", href: "/private" },
] as const;

export function Header() {
  const { t } = useI18n();
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname.startsWith("/call") || pathname.startsWith("/exercise") || pathname === "/result"
      : pathname === href;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-cream px-5 py-4 sm:px-10">
      <Link href="/" className="flex items-center gap-3">
        <Logo />
        <span className="font-[family-name:var(--font-display)] text-[20px] font-bold tracking-[-0.02em]">
          {t.brand}
        </span>
      </Link>

      <nav className="hidden items-center gap-1.5 md:flex">
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            className={`rounded-[10px] px-4 py-2 text-[14.5px] font-semibold transition ${
              isActive(n.href) ? "bg-espresso text-white" : "text-ink-soft hover:bg-sand"
            }`}
          >
            {t.nav[n.key]}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <LanguageToggle />

        {loading ? (
          <div className="h-9 w-9 rounded-full bg-sand" />
        ) : user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-3"
            >
              <UserAvatar name={user.name} avatarKey={user.avatarKey} size={28} />
              <span className="hidden text-[13px] font-bold sm:inline">{user.firstName || user.name}</span>
              <span className="text-[11px] text-muted">▾</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[46px] z-30 w-[220px] rounded-[14px] border border-line bg-paper p-2 shadow-xl">
                <Link
                  href="/progress"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 hover:bg-sand"
                >
                  <span className="text-[18px]">📊</span>
                  <span>
                    <span className="block text-[13.5px] font-bold">{t.nav.progress}</span>
                    <span className="block text-[11.5px] text-muted">{t.nav.progressHint}</span>
                  </span>
                </Link>
                <div className="my-1 h-px bg-line-soft" />
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold text-ink-soft hover:bg-sand"
                >
                  {t.nav.profile}
                  {user.role === "admin" && (
                    <span className="ml-2 rounded-full bg-grape-soft px-2 py-0.5 text-[10px] font-bold text-grape">
                      {t.nav.admin}
                    </span>
                  )}
                </Link>
                <button
                  onClick={logout}
                  className="block w-full rounded-[10px] px-3 py-2.5 text-left text-[13.5px] font-semibold text-ink-soft hover:bg-sand"
                >
                  {t.nav.signOut}
                </button>
                <div className="mt-1 border-t border-line-soft pt-1 md:hidden">
                  {NAV.map((n) => (
                    <Link
                      key={n.key}
                      href={n.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold text-ink-soft hover:bg-sand"
                    >
                      {t.nav[n.key]}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-[10px] bg-espresso px-4 py-2 text-[14px] font-bold text-white transition hover:bg-espresso-2"
          >
            {t.nav.signIn}
          </Link>
        )}
      </div>
    </header>
  );
}
