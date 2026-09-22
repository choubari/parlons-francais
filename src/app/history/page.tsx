import { redirect } from "next/navigation";

// History was folded into the richer "My Progress" view.
export default function HistoryRedirect() {
  redirect("/progress");
}
