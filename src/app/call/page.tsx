"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getScenario, type ChosenScenario } from "@/lib/session";
import { CallExperience } from "@/components/CallExperience";

// Custom / Private-Training calls: the scenario is handed over via sessionStorage.
export default function CallPage() {
  const router = useRouter();
  const [scenario, setScenario] = useState<ChosenScenario | null>(null);

  useEffect(() => {
    const s = getScenario();
    if (!s) {
      router.replace("/");
      return;
    }
    // One-time read of the handed-over scenario from sessionStorage after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScenario(s);
  }, [router]);

  if (!scenario) return null;
  return (
    <main className="animate-rise mx-auto w-full max-w-[760px] flex-1 px-5 pb-16 pt-10 sm:px-10">
      <CallExperience scenario={scenario} />
    </main>
  );
}
