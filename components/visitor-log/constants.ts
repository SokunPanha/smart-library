export const PURPOSES = ["READING", "BORROWING", "SCHOOLWORK", "RESEARCH", "OTHER"] as const;
export type Purpose = typeof PURPOSES[number];

export const PURPOSE_COLOR: Record<string, string> = {
  READING: "blue",
  BORROWING: "green",
  SCHOOLWORK: "orange",
  RESEARCH: "purple",
  OTHER: "default",
};
