import noticesJson from "./lh-notices.json";
import type { HousingTypeId, Listing } from "./types";

export interface SeoulNotice {
  pblancId: string;
  title: string;
  supplyType: string;
  institution: string;
  announceDate: string;
  beginDate: string;
  endDate: string;
  applyUrl: string; // LH 청약플러스 — 실제 청약 진행 페이지
  infoUrl: string;  // 마이홈포털 — 통합 정보 페이지
}

const ALL = noticesJson as SeoulNotice[];

// LH 청약플러스의 "청약신청 바로가기" 정적 entry URL — listing 단위 deep-link 는 불가능하므로
// 임대 vs 분양 타입별로 분기. 사용자가 entry 페이지에서 단지/주택형은 한 번 더 골라야 함.
const LH_APPLY_RENTAL_URL =
  "https://apply.lh.or.kr/lhapply/apply/rtho/rtho01.do?mi=1204";
const LH_APPLY_SALE_URL =
  "https://apply.lh.or.kr/lhapply/apply/silh/silh01.do?mi=1060";

export function allNotices(): SeoulNotice[] {
  return ALL;
}

export function topNotice(): SeoulNotice | null {
  return ALL[0] ?? null;
}

export function pickNoticeFor(
  type: HousingTypeId,
  eligible: string[],
): SeoulNotice | null {
  const has = (kw: string) => ALL.find((n) => n.title.includes(kw));
  if (eligible.includes("청년")) return has("청년") ?? topNotice();
  if (eligible.includes("신혼")) return has("신혼") ?? topNotice();
  if (eligible.includes("다자녀")) return has("다자녀") ?? topNotice();
  if (type === "integ") return has("든든주택") ?? topNotice();
  return topNotice();
}

export function applyUrlFor(type: HousingTypeId): string {
  return type === "sale" ? LH_APPLY_SALE_URL : LH_APPLY_RENTAL_URL;
}

export function infoUrlFor(type: HousingTypeId): string {
  return applyUrlFor(type);
}

export function ddayOfNotice(n: SeoulNotice): string {
  const s = n.endDate;
  if (!s || s.length !== 8) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(
    Number(s.slice(0, 4)),
    Number(s.slice(4, 6)) - 1,
    Number(s.slice(6, 8)),
  );
  const diff = Math.round((end.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "마감";
  if (diff === 0) return "D-DAY";
  return `D-${diff}`;
}

export function fmtNoticeDate(s: string): string {
  if (!s || s.length !== 8) return s;
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

/**
 * 매물 주소에서 단지명을 뽑는다. 예)
 *   "서울특별시 강서구 허준로 209(가양동,가양7단지아파트)" → "가양7단지"
 *   "서울특별시 동작구 여의대방로44길 47(대방동,대방1,2단지주공아파트)" → "대방1,2단지주공"
 *   괄호가 없으면 listing.title 사용.
 */
export function complexName(listing: Listing): string {
  const m = listing.address.match(/\(([^)]+)\)/);
  if (!m) return listing.title.replace(/^서울/, "").trim();
  const parts = m[1].split(",").map((s) => s.trim());
  // 첫 토큰은 동(가양동/대방동), 나머지가 단지명. 단지 토큰이 두 개 이상이면 합친다(예: "대방1,2단지주공").
  const tokens = parts.slice(1);
  const joined = tokens.length > 0 ? tokens.join(",") : parts[0] || "";
  return joined.replace(/아파트$/, "").trim();
}

const GENERIC_NAMES = new Set(["주공", "단지", "아파트", "임대", "공공"]);

/**
 * 매물 검색용 keyword. 단지명이 너무 generic하면 동(洞)을 prefix로 붙여 정확도를 높인다.
 */
export function searchKeyword(listing: Listing): string {
  const name = complexName(listing);
  const dongMatch = listing.address.match(/\(([^)]+)\)/);
  const dong = dongMatch?.[1].split(",")[0]?.trim() ?? "";
  if (!name) return dong || listing.title;
  if (GENERIC_NAMES.has(name) && dong) return `${dong} ${name}`.trim();
  return name;
}

const LH_LIST_URL =
  "https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do";
const LH_LSHS_SCH_URL = "https://apply.lh.or.kr/lhapply/csvc/lshs-sch/inq.do";
const MYHOME_SEARCH_URL =
  "https://www.myhome.go.kr/hws/portal/sch/selectRsdtRcritNtcList.do";

export interface DeepLinks {
  /** LH 청약플러스 공고 검색 (단지명 prefill) */
  lhNoticeSearch: string;
  /** LH 임대주택검색 (지역+공급유형 prefill, 단지정보) */
  lhComplexSearch: string;
  /** 마이홈포털 모집공고 검색 (단지명 prefill) */
  myhomeSearch: string;
}

export function deepLinksFor(listing: Listing): DeepLinks {
  const kw = searchKeyword(listing);
  const lhComplex = new URLSearchParams({
    mi: "1353",
    sCtprvnId: "11",
    sSiCd: listing.district,
  });
  const myhome = new URLSearchParams({
    searchKeyword: kw,
  });
  return {
    // "공고문 원문 보기" 카드: 라벨대로 listing 의 공고 상세 페이지로 이동.
    // 그 페이지 안에 LH 의 "청약신청 바로가기" 버튼이 있어 거기서 신청 가능.
    lhNoticeSearch: listing.sourceUrl ?? applyUrlFor(listing.type),
    lhComplexSearch: `${LH_LSHS_SCH_URL}?${lhComplex}`,
    myhomeSearch: `${MYHOME_SEARCH_URL}?${myhome}`,
  };
}
