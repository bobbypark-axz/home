import type { District, HousingTypeId, Listing, StatusId } from "./types";
import apiListings from "./listings-api.json";

// LH 공공데이터 API 3종 + VWorld 통합 sync 결과 (scripts/sync-lh-api.mjs)
// 일부 메타 필드는 API1 응답이 빈 객체(`{}`)로 직렬화돼 들어오는 경우가 있어 unknown 으로 받고 런타임에 정규화.
interface ApiListing {
  id: string;
  pblancId: string;
  title: string;
  noticeTitle: string;
  type: string;
  agency: string;
  district: string;
  districtId: string | null;
  status: string;
  deadline: string;
  announceDate: string;
  address: string;
  lat: number | null;
  lng: number | null;
  geocoded: string;
  area: string;
  depositManwon: number;
  monthlyRentManwon: number;
  salePriceManwon: number | null;
  supplyUnits: number | null;
  complexName: string | null;
  pnu: string | null;
  houseType: unknown;
  heatMethod: unknown;
  parkngCo: number | null;
  coverPhotoUrl: string | null;
  coverPhotoLocal: string | null;
  sourceUrl: string;
  thumbSeed: number;
  scope?: "single" | "regional"; // sync v2+ 부터 채워짐 — 광역 공고는 지도에서 제외
  eligibilityKeys?: string[];    // enrich-eligibility 가 PDF 에서 추출한 매물별 자격 키
  complexes?: unknown;           // enrich-complexes 가 채우는 단지별 표 (Listing.complexes 로 그대로 전달)
}

function safeString(v: unknown): string {
  return typeof v === "string" && v.trim() ? v : "";
}

// "29.63~46.52" → "29~46㎡". 소수점 raw 노출이 부담스러워 반올림 + 단위.
function formatArea(area: string): string {
  if (!area) return "";
  const parts = area.split("~").map((s) => Number(s)).filter((n) => Number.isFinite(n) && n > 0);
  if (!parts.length) return "";
  const lo = Math.round(Math.min(...parts));
  const hi = Math.round(Math.max(...parts));
  return lo === hi ? `${lo}㎡` : `${lo}~${hi}㎡`;
}

// PDF 휴리스틱 추출 시 발생한 outlier 거르기 (만원 단위).
// 예: 국민임대 보증금이 2.28억 같은 경우는 PDF 표가 깨져 분양가가 들어간 케이스로 추정.
const PRICE_GUARD: Record<string, { deposit: number; rent: number }> = {
  happy:  { deposit: 10000, rent: 50 },   // 1억 / 50만
  nation: { deposit: 15000, rent: 80 },   // 1.5억 / 80만
  perm:   { deposit: 5000,  rent: 30 },   // 5천 / 30만
  fifty:  { deposit: 20000, rent: 80 },
  integ:  { deposit: 20000, rent: 80 },
  buy:    { deposit: 30000, rent: 100 },
  jeonse: { deposit: 30000, rent: 50 },
};

function guardPrice(type: string, deposit: number, rent: number): [number, number] {
  const g = PRICE_GUARD[type];
  if (!g) return [deposit, rent];
  const d = deposit > g.deposit ? 0 : deposit;
  const r = rent > g.rent ? 0 : rent;
  return [d, r];
}

// 매물 type 별 기본 자격 키 (ELIGIBILITY_LABELS 와 짝). 매물별 완화 조건 등은
// 공고문 확인이 필요하지만, 기본값은 LH 공식 안내 기준.
// 키 → ELIGIBILITY_LABELS 에서 풀어 표시.
const ELIGIBILITY_BY_TYPE: Record<string, string[]> = {
  happy:  ["청년", "신혼", "자녀", "고령", "대학생", "한부모", "무주택", "소득100", "자산", "거주10"],
  nation: ["무주택", "소득70", "자산", "자동차", "거주30"],
  perm:   ["수급", "차상위", "한부모", "장애", "국가유공", "북한이탈", "거주50"],
  fifty:  ["무주택", "소득70", "자산", "거주50"],
  integ:  ["무주택", "소득100", "소득150", "자산", "거주30"],
  buy:    ["청년", "신혼", "자녀", "무주택", "소득70", "자산"],
  jeonse: ["청년", "신혼", "무주택", "소득70"],
  sale:   ["무주택", "청약저축"],
};

// 자격 키 정렬 우선순위 — 계층 > 기본 조건 > 소득/자산. 카드 slice(0,2) 시 더 직관적인 라벨이 먼저.
const ELIGIBILITY_ORDER: string[] = [
  "청년", "신혼", "자녀", "고령", "대학생", "한부모",
  "수급", "차상위", "장애", "국가유공", "북한이탈",
  "무주택", "청약저축",
  "소득70", "소득100", "소득150", "자산", "자동차",
  "거주10", "거주30", "거주50",
];
function sortEligibility(keys: string[]): string[] {
  const idx = (k: string) => {
    const i = ELIGIBILITY_ORDER.indexOf(k);
    return i < 0 ? 999 : i;
  };
  return [...keys].sort((a, b) => idx(a) - idx(b));
}

interface SidoEntry {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

const SIDOS: SidoEntry[] = [
  { id: "seoul", name: "서울특별시", lat: 37.5665, lng: 126.978 },
  { id: "gyeonggi", name: "경기도", lat: 37.4138, lng: 127.5183 },
  { id: "incheon", name: "인천광역시", lat: 37.4563, lng: 126.7052 },
  { id: "busan", name: "부산광역시", lat: 35.1796, lng: 129.0756 },
  { id: "daegu", name: "대구광역시", lat: 35.8714, lng: 128.6014 },
  { id: "gwangju", name: "광주광역시", lat: 35.1595, lng: 126.8526 },
  { id: "daejeon", name: "대전광역시", lat: 36.3504, lng: 127.3845 },
  { id: "ulsan", name: "울산광역시", lat: 35.5384, lng: 129.3114 },
  { id: "sejong", name: "세종특별자치시", lat: 36.4801, lng: 127.289 },
  { id: "gangwon", name: "강원특별자치도", lat: 37.8228, lng: 128.1555 },
  { id: "chungbuk", name: "충청북도", lat: 36.6358, lng: 127.4914 },
  { id: "chungnam", name: "충청남도", lat: 36.5184, lng: 126.8 },
  { id: "jeonbuk", name: "전북특별자치도", lat: 35.7175, lng: 127.153 },
  { id: "jeonnam", name: "전라남도", lat: 34.8161, lng: 126.463 },
  { id: "gyeongbuk", name: "경상북도", lat: 36.576, lng: 128.5057 },
  { id: "gyeongnam", name: "경상남도", lat: 35.4606, lng: 128.2132 },
  { id: "jeju", name: "제주특별자치도", lat: 33.4996, lng: 126.5312 },
];

function adaptApi(r: ApiListing): Listing | null {
  // 광역(매입임대/전세형 등 다지점) 공고는 단일 좌표 의미 없음 → 지도 노출 제외.
  // 향후 별도 "전국 공고" 섹션에서 노출하려면 별도 export 추가.
  if (r.scope === "regional") return null;
  // 좌표/시도 없는 항목 제외
  if (!r.lat || !r.lng) return null;
  if (!r.districtId) return null;
  const [deposit, rent] = guardPrice(r.type, r.depositManwon || 0, r.monthlyRentManwon || 0);
  return {
    id: r.id,
    pblancId: r.pblancId,
    title: r.title,
    type: r.type as HousingTypeId,
    agency: "LH",
    districtId: r.districtId,
    district: r.district,
    lat: r.lat,
    lng: r.lng,
    address: r.address || "",
    pnu: r.pnu || undefined,
    deposit,
    rent,
    area: formatArea(r.area || ""),
    layout: "",
    totalUnits: r.supplyUnits ?? null,
    supplyUnits: r.supplyUnits ?? null,
    heatMethod: safeString(r.heatMethod),
    salePriceManwon: r.salePriceManwon,
    status: r.status as StatusId,
    deadline: r.deadline || "",
    beginDate: r.announceDate || "",
    // 매물별 PDF 에서 추출된 자격 키 우선 (정확). 없으면 type 기본값.
    eligible: sortEligibility(
      (Array.isArray(r.eligibilityKeys) && r.eligibilityKeys.length)
        ? r.eligibilityKeys
        : (ELIGIBILITY_BY_TYPE[r.type] || [])
    ),
    features: [],
    transit: "",
    competition: null,
    thumbSeed: r.thumbSeed,
    suplyTyNm: safeString(r.houseType) || undefined,
    complexes: Array.isArray(r.complexes) ? (r.complexes as Listing["complexes"]) : undefined,
    pblancNm: r.noticeTitle,
    sourceUrl: r.sourceUrl,
    coverPhotoUrl: r.coverPhotoLocal || r.coverPhotoUrl || undefined,
  };
}

const ALL: Listing[] = (apiListings as unknown as ApiListing[])
  .map((r) => adaptApi(r))
  .filter((x): x is Listing => x !== null);

// 같은 공고가 정정공고/재게시 형태로 여러 번 올라오는 경우 dedupe.
// title 에서 [정정공고]/[재게시] 같은 접두 라벨을 떼고 남는 본 title 로 그룹핑 → 그룹당 1건.
// 우선순위: 정정공고 > active(open/upcoming) > 최근 announceDate > pblancId desc
function groupKey(title: string): string {
  return (title || "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
}

function dedupeListings(items: Listing[]): Listing[] {
  const groups = new Map<string, Listing[]>();
  for (const it of items) {
    const k = groupKey(it.title);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }
  const out: Listing[] = [];
  for (const arr of groups.values()) {
    if (arr.length === 1) { out.push(arr[0]); continue; }
    arr.sort((a, b) => {
      const aRev = /정정/.test(a.title) ? 1 : 0;
      const bRev = /정정/.test(b.title) ? 1 : 0;
      if (aRev !== bRev) return bRev - aRev;
      const aActive = a.status === "closed" ? 0 : 1;
      const bActive = b.status === "closed" ? 0 : 1;
      if (aActive !== bActive) return bActive - aActive;
      const aDate = a.beginDate || "";
      const bDate = b.beginDate || "";
      if (aDate !== bDate) return aDate < bDate ? 1 : -1;
      return (b.pblancId || "").localeCompare(a.pblancId || "");
    });
    out.push(arr[0]);
  }
  return out;
}

export const LH_LISTINGS: Listing[] = dedupeListings(ALL);

export function buildDistricts(listings: Listing[]): District[] {
  const counts = new Map<string, number>();
  // 시도별 listing 좌표 누적 — 시도 기하학적 중심 대신 실제 listing 분포의 평균(centroid)으로
  // 마커 위치 잡기. 경기도처럼 면적이 넓은 시도는 중심점이 실제 매물 분포와 떨어져 어색했음.
  const sums = new Map<string, { latSum: number; lngSum: number; n: number }>();
  for (const l of listings) {
    counts.set(l.districtId, (counts.get(l.districtId) ?? 0) + 1);
    const s = sums.get(l.districtId) ?? { latSum: 0, lngSum: 0, n: 0 };
    s.latSum += l.lat;
    s.lngSum += l.lng;
    s.n += 1;
    sums.set(l.districtId, s);
  }
  return SIDOS.filter((s) => counts.has(s.id)).map((s, idx) => {
    const c = sums.get(s.id);
    return {
      id: s.id,
      name: s.name,
      x: idx,
      y: idx,
      lat: c && c.n > 0 ? c.latSum / c.n : s.lat,
      lng: c && c.n > 0 ? c.lngSum / c.n : s.lng,
      count: counts.get(s.id) ?? 0,
    };
  });
}

export const LH_DISTRICTS: District[] = buildDistricts(LH_LISTINGS);
