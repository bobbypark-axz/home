import type { StatusId } from "./types";

const TODAY = new Date(2026, 3, 19);

export function dDayText(deadline: string, status: StatusId): string {
  if (status === "upcoming") return "모집 예정";
  if (status === "closed") return "마감";
  const [y, m, d] = deadline.split(".").map(Number);
  const target = new Date(y, m - 1, d);
  const diff = Math.round((target.getTime() - TODAY.getTime()) / 86400000);
  if (diff < 0) return "마감";
  if (diff === 0) return "D-DAY";
  return `D-${diff}`;
}

export function calcDday(deadline: string): string {
  const [y, m, d] = deadline.split(".").map(Number);
  const diff = Math.round((new Date(y, m - 1, d).getTime() - TODAY.getTime()) / 86400000);
  if (diff < 0) return "마감";
  if (diff === 0) return "D-DAY";
  return `D-${diff}`;
}
