import type { District, HousingTypeId, Listing, StatusId } from "./types";
import notices from "./lh-notices-all.json";

interface LhNotice {
  id: string;
  pblancId: string;
  houseSn: number | null;
  category: "임대" | "분양";
  typeId: string;
  housingType: string;
  houseType: string;
  title: string;
  noticeTitle: string;
  provider: "LH";
  sido: string;
  sigungu: string;
  address: string;
  pnu: string;
  totalUnits: number | null;
  supplyUnits: number | null;
  depositWon: number | null;
  monthlyRentWon: number | null;
  depositManwon: number | null;
  monthlyRentManwon: number | null;
  announceDate: string;
  beginDate: string;
  endDate: string;
  winnerDate: string;
  noticeStatus: string;
  progressStatus: string;
  activeStatus: "upcoming" | "open" | "closing" | "closed";
  daysToDeadline: number | null;
  sourceUrl: string;
  detailUrl: string;
  mobileUrl: string;
  attachmentId: string;
  lat?: number;
  lng?: number;
  geocoded?: string;
  salePriceManwon?: number | null;
  coverPhotoLocal?: string;
  photos?: Array<{ kind: string | null; name: string | null; url: string }>;
  details?: {
    pageAddress?: string;
    matchedTab?: string | null;
    housingTypes?: Array<Record<string, string>>;
    schedule?: Array<Record<string, string>>;
  };
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

const SIDO_BY_NAME = new Map<string, SidoEntry>(SIDOS.map((s) => [s.name, s]));

const TYPE_MAP: Record<string, HousingTypeId> = {
  happy: "happy",
  nation: "nation",
  perm: "perm",
  buy: "buy",
  jeonse: "jeonse",
  fifty: "fifty",
  sale: "sale",
  integ: "integ",
};

function pickType(typeId: string, category: string): HousingTypeId {
  return TYPE_MAP[typeId] ?? (category === "분양" ? "sale" : "integ");
}

function pickStatus(notice: LhNotice): StatusId {
  // progressStatus 가 "모집완료" 면 activeStatus 가 "open" 이라도 실제로는 마감.
  // LH 데이터의 두 필드가 일치하지 않는 옛 분양 기록이 많아서 진실은 progressStatus.
  if (notice.progressStatus === "모집완료") return "closed";
  return notice.activeStatus;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function buildLayout(details: LhNotice["details"]): string {
  const rows = details?.housingTypes ?? [];
  if (rows.length === 0) return "";
  const names = rows
    .map((r) => r["주택형"] ?? r["주택유형"] ?? "")
    .filter(Boolean)
    .slice(0, 3);
  return names.join(", ");
}

function buildArea(details: LhNotice["details"]): string {
  const rows = details?.housingTypes ?? [];
  if (rows.length === 0) return "";
  const areas = rows
    .map((r) => r["전용면적(㎡)"] ?? r["전용면적"] ?? "")
    .filter(Boolean);
  if (areas.length === 0) return "";
  return `${areas[0]}㎡${areas.length > 1 ? ` 외 ${areas.length - 1}` : ""}`;
}

const PHOTO_PRIORITY = [
  "단지조감도",
  "단지전경",
  "단지배치도",
  "동호배치도",
  "지구조감도",
  "지역조감도",
  "위치도",
  "교통망도",
  "투시도",
  "평면도",
];

function photoRank(photo: { kind: string | null; name: string | null }): number {
  const tag = `${photo.kind ?? ""}${photo.name ?? ""}`;
  for (let i = 0; i < PHOTO_PRIORITY.length; i++) {
    if (tag.includes(PHOTO_PRIORITY[i])) return i;
  }
  return PHOTO_PRIORITY.length;
}

function sortPhotos(
  photos?: Array<{ kind: string | null; name: string | null; url: string }>,
) {
  if (!photos?.length) return photos;
  return [...photos].sort((a, b) => photoRank(a) - photoRank(b));
}

const PHOTO_SAFE_EXT = /\.(jpe?g|png|webp)(?:$|\?)/i;

function isAerialRender(p: { kind: string | null; name: string | null }): boolean {
  const tag = `${p.kind ?? ""}${p.name ?? ""}`;
  if (!tag.includes("단지조감도")) return false;
  // 배치도/평면도/현황도 같이 도면 류는 거른다
  if (/배치도|평면도|현황도|구조도|투시도|동호도|토지이용|위치도|찾아오시는|교통/.test(tag)) return false;
  // 사진 호환 포맷만
  if (p.name && !PHOTO_SAFE_EXT.test(p.name)) return false;
  return true;
}

function coverRank(p: { kind: string | null; name: string | null }): number {
  const tag = `${p.kind ?? ""}${p.name ?? ""}`;
  // 확대이미지 = 고해상도 렌더 — 가장 깨끗
  if (tag.includes("단지조감도-확대") || tag.includes("단지조감도확대")) return 0;
  return 1;
}

function pickCoverPhoto(
  photos?: Array<{ kind: string | null; name: string | null; url: string }>,
): string | undefined {
  if (!photos?.length) return undefined;
  const candidates = photos.filter(isAerialRender);
  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => coverRank(a) - coverRank(b));
  return candidates[0].url;
}

const PRICE_RE = /([\d,]+)/;

function parseSalePriceManwon(details: LhNotice["details"]): number | null {
  const rows = details?.housingTypes ?? [];
  if (rows.length === 0) return null;
  for (const row of rows) {
    for (const [k, v] of Object.entries(row)) {
      if (!k.includes("분양가") && !k.includes("매각가")) continue;
      const m = String(v).match(PRICE_RE);
      if (!m) continue;
      const won = Number(m[1].replace(/,/g, ""));
      if (Number.isFinite(won) && won > 0) return Math.round(won / 10000);
    }
  }
  return null;
}

function isUnboundedProgram(notice: LhNotice): boolean {
  // 1) 시도 중심에 폴백된 모든 항목 — 실제 단지 좌표가 없어 지도 표시 무의미
  //    이전엔 임대(전세/매입) + 모집완료만 잡았는데, 분양 잔여세대 선착순처럼 활성 상태로
  //    sido-center 에 폴백된 케이스도 있어서 모두 제외로 통일.
  const isSidoCenterFallback = notice.geocoded === "sido-center";
  // 2) 제목이 "수시/상시 모집" — 마감일 개념 없는 전국 프로그램
  const title = `${notice.title ?? ""}${notice.noticeTitle ?? ""}`;
  const isContinuous = /수시\s*모집|상시\s*모집/.test(title);
  return isSidoCenterFallback || isContinuous;
}

function adapt(notice: LhNotice, idx: number): Listing | null {
  if (!notice.lat || !notice.lng) return null;
  if (isUnboundedProgram(notice)) return null;
  const sido = SIDO_BY_NAME.get(notice.sido);
  if (!sido) return null;
  return {
    id: notice.id,
    pblancId: notice.pblancId,
    houseSn: notice.houseSn,
    title: notice.title || notice.noticeTitle,
    type: pickType(notice.typeId, notice.category),
    agency: "LH",
    districtId: sido.id,
    district: sido.name,
    lat: notice.lat,
    lng: notice.lng,
    // pageAddress 는 LH 운영자(본사) 주소라서 listing 주소가 비어있을 때 fallback 으로
    // 쓰면 "강남구 선릉로121길 12 (논현동)" 같은 LH 본사 주소가 표시됨 — 사용 금지
    address: notice.address || "",
    pnu: notice.pnu,
    deposit: notice.depositManwon ?? 0,
    rent: notice.monthlyRentManwon ?? 0,
    area: buildArea(notice.details),
    layout: buildLayout(notice.details),
    totalUnits: asNumber(notice.totalUnits, 0),
    supplyUnits: asNumber(notice.supplyUnits, 0),
    heatMethod: "",
    status: pickStatus(notice),
    deadline: notice.endDate,
    beginDate: notice.beginDate,
    eligible: [],
    features: [],
    transit: "",
    competition: null,
    thumbSeed: idx,
    salePriceManwon: notice.salePriceManwon ?? parseSalePriceManwon(notice.details),
    suplyTyNm: notice.housingType,
    pblancNm: notice.noticeTitle,
    sourceUrl: notice.sourceUrl,
    pcUrl: notice.detailUrl,
    mobileUrl: notice.mobileUrl,
    photos: sortPhotos(notice.photos),
    coverPhotoUrl: notice.coverPhotoLocal ?? pickCoverPhoto(notice.photos),
  };
}

const ALL: Listing[] = (notices as unknown as LhNotice[])
  .map((n, idx) => adapt(n, idx))
  .filter((x): x is Listing => x !== null);

export const LH_LISTINGS: Listing[] = ALL;

export function buildDistricts(listings: Listing[]): District[] {
  const counts = new Map<string, number>();
  for (const l of listings) {
    counts.set(l.districtId, (counts.get(l.districtId) ?? 0) + 1);
  }
  return SIDOS.filter((s) => counts.has(s.id)).map((s, idx) => ({
    id: s.id,
    name: s.name,
    x: idx,
    y: idx,
    lat: s.lat,
    lng: s.lng,
    count: counts.get(s.id) ?? 0,
  }));
}

export const LH_DISTRICTS: District[] = buildDistricts(LH_LISTINGS);
