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
}

function safeString(v: unknown): string {
  return typeof v === "string" && v.trim() ? v : "";
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
    deposit: r.depositManwon || 0,
    rent: r.monthlyRentManwon || 0,
    area: r.area || "",
    layout: "",
    totalUnits: r.supplyUnits ?? null,
    supplyUnits: r.supplyUnits ?? null,
    heatMethod: safeString(r.heatMethod),
    salePriceManwon: r.salePriceManwon,
    status: r.status as StatusId,
    deadline: r.deadline || "",
    beginDate: r.announceDate || "",
    eligible: [],
    features: [],
    transit: "",
    competition: null,
    thumbSeed: r.thumbSeed,
    suplyTyNm: safeString(r.houseType) || undefined,
    pblancNm: r.noticeTitle,
    sourceUrl: r.sourceUrl,
    coverPhotoUrl: r.coverPhotoLocal || r.coverPhotoUrl || undefined,
  };
}

const ALL: Listing[] = (apiListings as unknown as ApiListing[])
  .map((r) => adaptApi(r))
  .filter((x): x is Listing => x !== null);

export const LH_LISTINGS: Listing[] = ALL;

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
