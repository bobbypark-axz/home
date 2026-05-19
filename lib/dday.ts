import type { StatusId } from "./types";

// 마감임박으로 간주할 일수 — open 상태이면서 D-7 이내인 경우 closing 으로 derive.
const CLOSING_THRESHOLD_DAYS = 7;

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

/** status 를 표시 계층에서 재해석:
 *  1) upcoming 이지만 공고일(beginDate)이 이미 지났고 마감 안 됐으면 → open (sync stale 보정)
 *  2) open + deadline 이 D-N(임계값 이내) 이면 → closing (마감임박)
 *  데이터에는 closing 이 없고 LH API 도 마감임박을 따로 안 보내므로 표시/필터 계층에서 derived.
 *  주의: deadline 이 과거이거나 정례/수시모집(D > 365)이면 closing 아님. */
export function effectiveStatus(status: StatusId, deadline: string, beginDate?: string): StatusId {
  let s = status;

  // upcoming → open 보정: 공고일이 오늘 이전이고 마감일이 오늘 이후면 사실상 접수중.
  // LH API 의 PAN_SS 가 sync 시점 값이라 stale 일 수 있어, 표시 계층에서 자동 정정.
  if (s === "upcoming") {
    const begin = beginDate ? parseDeadline(beginDate) : null;
    const end = parseDeadline(deadline);
    if (begin && end) {
      const beginDiff = diffDays(begin);
      const endDiff = diffDays(end);
      if (beginDiff <= 0 && endDiff >= 0) s = "open";
    }
  }

  if (s !== "open") return s;
  const target = parseDeadline(deadline);
  if (!target) return s;
  const diff = diffDays(target);
  if (diff < 0) return s;
  if (diff > 365) return s;
  if (diff <= CLOSING_THRESHOLD_DAYS) return "closing";
  return s;
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
