// 매물별 구조화 자격 정보 (lib/notice-eligibility/*.json) 의 server-side 로더.
// API route 와 server component 양쪽에서 사용. client 에 직접 import 금지 (fs 의존).
//
// ID 변환: lh-notices-all id (lh-rental-20274-1) ↔ listings-api id (lh-rental-2015...19890).
// 인덱스는 notice-all id, 호출 시 어느 쪽이든 받아 변환.

import fs from "node:fs";
import path from "node:path";
import allNotices from "./lh-notices-all.json";

const ROOT = path.resolve(process.cwd());
const ELIG_DIR = path.join(ROOT, "lib/notice-eligibility");

// panId ↔ notice-all id 양방향 매핑
const PAN_TO_NOTICE_ID = new Map<string, string>();
for (const n of allNotices as Array<{ id?: string; sourceUrl?: string }>) {
  if (!n.id || !n.sourceUrl) continue;
  const m = n.sourceUrl.match(/panId=(\d+)/);
  if (m) PAN_TO_NOTICE_ID.set(m[1], n.id);
}

function resolveNoticeId(id: string): string {
  // listings-api 식 (lh-rental-2015...19890[-c0]) → notice-all 식 (lh-rental-20274-1)
  const m = id.match(/lh-(?:rental|sale)-(\d+)/);
  if (m) {
    const noticeId = PAN_TO_NOTICE_ID.get(m[1]);
    if (noticeId) return noticeId;
  }
  return id; // 이미 notice-all 식이거나 매핑 못 찾음
}

export type EligibilityTier = {
  id: string;
  name: string;
  units?: number | null;
  age?: string | null;
  marriage?: string | null;
  income?: {
    percent?: number | null;
    byHousehold?: Record<string, number | null> | null;
    note?: string | null;
  } | null;
  asset?: { total?: number | null; car?: number | null } | null;
  other?: string[];
};

export type EligibilityData = {
  supplyTotal?: number | null;
  tiers: EligibilityTier[];
  priority?: string[];
};

const cache = new Map<string, EligibilityData | null>();

/** listingId (listings-api 또는 notice-all 식) → 자격 JSON. 캐시. 없으면 null. */
export function getEligibility(listingId: string): EligibilityData | null {
  const noticeId = resolveNoticeId(listingId);
  if (cache.has(noticeId)) return cache.get(noticeId) ?? null;
  try {
    const raw = fs.readFileSync(path.join(ELIG_DIR, `${noticeId}.json`), "utf8");
    const parsed = JSON.parse(raw) as EligibilityData;
    cache.set(noticeId, parsed);
    return parsed;
  } catch {
    cache.set(noticeId, null);
    return null;
  }
}
