"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";

export function ProfileEditor({
  initialFirst,
  initialLast,
  avatarKey: initialAvatarKey,
  onSaved,
  submitLabel,
}: {
  initialFirst: string;
  initialLast: string;
  avatarKey: string | null;
  onSaved: () => void;
  submitLabel: string;
}) {
  const { t } = useI18n();
  const { refresh } = useAuth();
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  const [avatarKey, setAvatarKey] = useState(initialAvatarKey);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const previewName = [first, last].filter(Boolean).join(" ") || "You";

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setAvatarKey(data.avatarKey);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName: first, lastName: last }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      await refresh();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-[12px] border border-line bg-paper px-4 py-3 text-[15px]";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <UserAvatar name={previewName} avatarKey={avatarKey} size={64} />
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? t.auth.uploading : t.auth.changeAvatar}
          </Button>
          <p className="mt-1.5 text-[12px] text-muted">{t.auth.avatarHint}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">
            {t.auth.firstName}
          </label>
          <input className={field} value={first} onChange={(e) => setFirst(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">
            {t.auth.lastName}
          </label>
          <input className={field} value={last} onChange={(e) => setLast(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-[13.5px] text-danger">{error}</p>}

      <Button
        onClick={save}
        disabled={saving || !first.trim() || !last.trim()}
        className="self-start"
      >
        {saving ? t.auth.saving : submitLabel}
      </Button>
    </div>
  );
}
