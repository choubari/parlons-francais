"use client";

import type { CustomScenario } from "./persona";
import type { TranscriptTurn } from "./live-client";
import type { Localized } from "./exercises/types";

// The scenario the user chose on the home screen, handed to /call.
export type ChosenScenario = {
  exerciseId?: string;
  custom?: CustomScenario;
  title: Localized;
  theme: string;
  product: Localized;
  prospectProfile: Localized;
  goal: Localized;
  researchBrief: Localized;
  difficulty: string;
};

// Result of a finished call, handed to /result.
export type CallResult = {
  scenario: ChosenScenario;
  transcript: TranscriptTurn[];
};

const SCENARIO = "cct.scenario";
const RESULT = "cct.result";

function put(key: string, val: unknown) {
  sessionStorage.setItem(key, JSON.stringify(val));
}
function get<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const setScenario = (s: ChosenScenario) => put(SCENARIO, s);
export const getScenario = () => get<ChosenScenario>(SCENARIO);
export const setResult = (r: CallResult) => put(RESULT, r);
export const getResult = () => get<CallResult>(RESULT);
