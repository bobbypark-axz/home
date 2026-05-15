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

/** deadline 이 1년 이상 미래면 "정례/수시모집"의 프로그램 전체 만료일이라고 간주.
 *  실제 라운드별 마감과 무관하므로 D-N 같은 표시는 의미 없음. */
export function isRegularRecruitment(deadline: string, status: StatusId): boolean {
  if (status !== "open") return false;
  const target = parseDeadline(deadline);
  if (!target) return false;
  return diffDays(target) > 365;
}

export function dDayText(deadline: string, status: StatusId): string {
  if (status === "upcoming") return "모집 예정";
  if (status === "closed") return "마감";
  if (isRegularRecruitment(deadline, status)) return "정례모집";
  // status === "open" + deadline 이 과거: "마감" 대신 빈 문자열 →
  // listing-panel 쪽에서 "수시모집" 으로 fallback.
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
  // 1년 이상 미래는 정례/수시모집의 프로그램 만료일일 가능성이 높음 — D-N 숨김
  if (diff > 365) return "";
  if (diff === 0) return "D-DAY";
  return `D-${diff}`;
}
