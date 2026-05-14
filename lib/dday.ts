import type { StatusId } from "./types";

function parseDeadline(deadline: string): Date | null {
  if (!deadline) return null;
  const parts = deadline.split(".").map((s) => Number(s.trim()));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function diffDays(target: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function dDayText(deadline: string, status: StatusId): string {
  if (status === "upcoming") return "모집 예정";
  if (status === "closed") return "마감";
  const target = parseDeadline(deadline);
  if (!target) return "";
  const diff = diffDays(target);
  if (diff < 0) return "마감";
  if (diff === 0) return "D-DAY";
  return `D-${diff}`;
}

export function calcDday(deadline: string): string {
  const target = parseDeadline(deadline);
  if (!target) return "";
  const diff = diffDays(target);
  if (diff < 0) return "마감";
  if (diff === 0) return "D-DAY";
  return `D-${diff}`;
}
