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
  // status === "open": deadline 이 과거여도 "마감" 으로 표시하지 않음
  // (수시/상시 모집은 형식적 마감일만 있고 계속 받는 경우가 많아서).
  // 빈 문자열을 반환하면 listing-panel 쪽에서 "수시모집" 으로 표시됨.
  const target = parseDeadline(deadline);
  if (!target) return "";
  const diff = diffDays(target);
  if (diff < 0) return "";
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
