"use client";

import { useEffect, useState } from "react";
import { GITHUB_URL } from "@/lib/config";

// Slim, dismissible banner: this hosted instance is a demo on Google AI Studio's
// free tier (limited daily quota), so corrections may pause. Points people to
// self-host their own copy.
const KEY = "parlons.demo.dismissed";

export function DemoBanner() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(localStorage.getItem(KEY) === "1");
  }, []);

  if (hidden) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-espresso px-4 py-2 text-center text-[13px] text-white">
      <span>
        🇫🇷 Version démo — quotas d&apos;IA limités (offre gratuite Google). Hébergez votre
        propre version :{" "}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="font-bold underline underline-offset-2"
        >
          code source sur GitHub →
        </a>
      </span>
      <button
        onClick={() => {
          localStorage.setItem(KEY, "1");
          setHidden(true);
        }}
        aria-label="Fermer"
        className="ml-1 flex-none rounded-full px-2 py-0.5 text-white/70 hover:bg-white/10 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
