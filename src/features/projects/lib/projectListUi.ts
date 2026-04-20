export const PROJECT_CARD_COLOR_PRESETS = [
  { name: "slate", border: "border-l-slate-400", dot: "bg-slate-400" },
  { name: "blue", border: "border-l-blue-500", dot: "bg-blue-500" },
  { name: "green", border: "border-l-green-500", dot: "bg-green-500" },
  { name: "amber", border: "border-l-amber-500", dot: "bg-amber-500" },
  { name: "red", border: "border-l-red-500", dot: "bg-red-500" },
  { name: "purple", border: "border-l-purple-500", dot: "bg-purple-500" },
  { name: "pink", border: "border-l-pink-500", dot: "bg-pink-500" },
  { name: "orange", border: "border-l-orange-500", dot: "bg-orange-500" },
] as const;

export const PROJECT_CARD_STATUS_LABELS: Record<string, { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-green-500" },
  on_hold: { label: "On hold", dot: "bg-amber-500" },
  completed: { label: "Completed", dot: "bg-slate-400" },
};

export function projectCardColorBorder(color?: string | null) {
  return PROJECT_CARD_COLOR_PRESETS.find((c) => c.name === color)?.border ?? "border-l-border/40";
}

export function projectCardColorDot(color?: string | null) {
  return PROJECT_CARD_COLOR_PRESETS.find((c) => c.name === color)?.dot;
}
