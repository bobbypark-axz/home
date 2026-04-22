import type {
  Agency,
  District,
  HousingType,
  HousingTypeId,
  Listing,
  StatusId,
  StatusLabel,
} from "./types";

export const DISTRICTS: District[] = [
  { id: "gangseo",      name: "강서구",   x: 10, y: 52, lat: 37.5509, lng: 126.8495, count: 42 },
  { id: "yangcheon",    name: "양천구",   x: 18, y: 62, lat: 37.5170, lng: 126.8666, count: 28 },
  { id: "guro",         name: "구로구",   x: 22, y: 70, lat: 37.4954, lng: 126.8874, count: 36 },
  { id: "geumcheon",    name: "금천구",   x: 30, y: 82, lat: 37.4569, lng: 126.8950, count: 19 },
  { id: "gwanak",       name: "관악구",   x: 40, y: 78, lat: 37.4784, lng: 126.9516, count: 31 },
  { id: "dongjak",      name: "동작구",   x: 44, y: 66, lat: 37.5124, lng: 126.9393, count: 23 },
  { id: "yeongdeungpo", name: "영등포구", x: 30, y: 60, lat: 37.5264, lng: 126.8962, count: 54 },
  { id: "mapo",         name: "마포구",   x: 32, y: 42, lat: 37.5663, lng: 126.9019, count: 46 },
  { id: "eunpyeong",    name: "은평구",   x: 30, y: 22, lat: 37.6027, lng: 126.9291, count: 38 },
  { id: "seodaemun",    name: "서대문구", x: 40, y: 34, lat: 37.5791, lng: 126.9368, count: 29 },
  { id: "jongno",       name: "종로구",   x: 49, y: 32, lat: 37.5735, lng: 126.9788, count: 18 },
  { id: "junggu",       name: "중구",     x: 53, y: 42, lat: 37.5638, lng: 126.9975, count: 14 },
  { id: "yongsan",      name: "용산구",   x: 50, y: 52, lat: 37.5323, lng: 126.9900, count: 22 },
  { id: "seongbuk",     name: "성북구",   x: 56, y: 26, lat: 37.5894, lng: 127.0167, count: 34 },
  { id: "gangbuk",      name: "강북구",   x: 52, y: 14, lat: 37.6396, lng: 127.0255, count: 27 },
  { id: "dobong",       name: "도봉구",   x: 62, y: 8,  lat: 37.6688, lng: 127.0471, count: 21 },
  { id: "nowon",        name: "노원구",   x: 72, y: 16, lat: 37.6542, lng: 127.0568, count: 49 },
  { id: "jungnang",     name: "중랑구",   x: 74, y: 30, lat: 37.6063, lng: 127.0925, count: 33 },
  { id: "dongdaemun",   name: "동대문구", x: 62, y: 38, lat: 37.5744, lng: 127.0396, count: 26 },
  { id: "seongdong",    name: "성동구",   x: 60, y: 50, lat: 37.5634, lng: 127.0371, count: 31 },
  { id: "gwangjin",     name: "광진구",   x: 70, y: 52, lat: 37.5385, lng: 127.0823, count: 24 },
  { id: "gangdong",     name: "강동구",   x: 88, y: 54, lat: 37.5301, lng: 127.1238, count: 37 },
  { id: "songpa",       name: "송파구",   x: 80, y: 66, lat: 37.5145, lng: 127.1066, count: 58 },
  { id: "gangnam",      name: "강남구",   x: 70, y: 68, lat: 37.5172, lng: 127.0473, count: 25 },
  { id: "seocho",       name: "서초구",   x: 58, y: 72, lat: 37.4837, lng: 127.0324, count: 30 },
];

export const HOUSING_TYPES: HousingType[] = [
  { id: "happy", name: "행복주택", badge: "happy" },
  { id: "nation", name: "국민임대", badge: "nation" },
  { id: "integ", name: "통합공공임대", badge: "integ" },
];

export const AGENCIES: Agency[] = ["LH", "SH", "GH"];

export const STATUS_LABELS: Record<StatusId, StatusLabel> = {
  open: { text: "모집중", color: "#1aa174" },
  upcoming: { text: "모집예정", color: "#c27f29" },
  closing: { text: "마감임박", color: "#ff4133" },
  closed: { text: "마감", color: "#868b94" },
};

export const ELIGIBILITY_LABELS: Record<string, string> = {
  청년: "만 19-39세 청년",
  신혼: "신혼부부·예비부부",
  자녀: "자녀 있는 세대",
  다자녀: "다자녀 세대",
  "1인": "1인 가구",
  가구: "일반 세대",
  고령: "고령자 세대",
};

type Seed = [
  string,            // title
  HousingTypeId,     // type
  Agency,            // agency
  string,            // districtId
  string,            // address
  [number, number],  // [deposit, rent]
  string,            // area
  string,            // layout
  StatusId,          // status
  string,            // deadline
  string[],          // eligible
  string[],          // features
  string,            // transit
  number | null,     // competition
];

const SEED: Seed[] = [
  ["행복주택 가양9단지", "happy", "SH", "gangseo", "서울 강서구 가양동", [1500, 90], "19.2㎡", "원룸", "open", "2026.04.30", ["청년", "신혼"], ["역세권", "1인가구"], "가양역 도보 4분", 20.7],
  ["국민임대 마곡엠밸리3단지", "nation", "LH", "gangseo", "서울 강서구 마곡동", [4800, 180], "46.9㎡", "투룸", "open", "2026.05.12", ["신혼", "자녀"], ["초품아", "신축"], "마곡나루역 도보 7분", 12.4],
  ["통합공공임대 구로항동", "integ", "LH", "guro", "서울 구로구 항동", [6200, 220], "59.8㎡", "쓰리룸", "open", "2026.05.03", ["가구", "다자녀"], ["공원", "신축"], "천왕역 도보 9분", 6.8],
  ["행복주택 금천한내", "happy", "SH", "geumcheon", "서울 금천구 독산동", [2100, 110], "26.5㎡", "투룸", "closing", "2026.04.22", ["청년", "신혼"], ["역세권", "편의"], "독산역 도보 6분", 18.2],
  ["국민임대 관악신림", "nation", "LH", "gwanak", "서울 관악구 신림동", [3400, 150], "39.7㎡", "투룸", "open", "2026.05.20", ["신혼", "자녀"], ["역세권"], "신림역 도보 5분", 9.5],
  ["행복주택 영등포당산", "happy", "SH", "yeongdeungpo", "서울 영등포구 당산동", [1800, 95], "17.4㎡", "원룸", "open", "2026.05.08", ["청년"], ["역세권", "버스"], "당산역 도보 3분", 25.3],
  ["통합공공임대 영등포문래", "integ", "SH", "yeongdeungpo", "서울 영등포구 문래동", [5500, 200], "49.3㎡", "투룸", "upcoming", "2026.06.01", ["가구", "신혼"], ["공원", "편의"], "문래역 도보 8분", null],
  ["국민임대 상암월드컵", "nation", "SH", "mapo", "서울 마포구 상암동", [4200, 170], "44.2㎡", "투룸", "open", "2026.05.15", ["신혼", "자녀"], ["공원", "학군"], "월드컵경기장역 도보 6분", 7.1],
  ["행복주택 은평뉴타운", "happy", "SH", "eunpyeong", "서울 은평구 진관동", [2400, 120], "29.8㎡", "투룸", "open", "2026.04.29", ["청년", "신혼"], ["공원", "신축"], "구파발역 도보 10분", 15.6],
  ["국민임대 서대문홍은", "nation", "LH", "seodaemun", "서울 서대문구 홍은동", [3800, 160], "41.1㎡", "투룸", "closing", "2026.04.25", ["신혼", "자녀"], ["학군"], "홍제역 도보 12분", 11.2],
  ["통합공공임대 용산청파", "integ", "LH", "yongsan", "서울 용산구 청파동", [6800, 240], "46.5㎡", "투룸", "open", "2026.05.18", ["가구", "신혼"], ["역세권", "신축"], "남영역 도보 4분", 5.3],
  ["행복주택 성북장위", "happy", "SH", "seongbuk", "서울 성북구 장위동", [2000, 105], "18.9㎡", "원룸", "open", "2026.05.06", ["청년", "1인"], ["역세권", "편의"], "돌곶이역 도보 7분", 22.8],
  ["국민임대 노원중계", "nation", "LH", "nowon", "서울 노원구 중계동", [3200, 140], "38.6㎡", "투룸", "open", "2026.05.22", ["신혼", "자녀"], ["학군", "공원"], "중계역 도보 8분", 10.4],
  ["행복주택 도봉창동", "happy", "SH", "dobong", "서울 도봉구 창동", [1900, 100], "17.8㎡", "원룸", "closing", "2026.04.23", ["청년"], ["역세권"], "창동역 도보 3분", 28.5],
  ["통합공공임대 중랑면목", "integ", "LH", "jungnang", "서울 중랑구 면목동", [5200, 190], "52.7㎡", "투룸", "open", "2026.05.25", ["가구", "자녀"], ["초품아"], "사가정역 도보 9분", 8.2],
  ["국민임대 동대문전농", "nation", "SH", "dongdaemun", "서울 동대문구 전농동", [4100, 175], "42.8㎡", "투룸", "open", "2026.05.10", ["신혼", "자녀"], ["역세권", "학군"], "청량리역 도보 11분", 9.8],
  ["행복주택 성수뚝섬", "happy", "SH", "seongdong", "서울 성동구 성수동", [2600, 130], "22.4㎡", "원룸", "closing", "2026.04.21", ["청년", "신혼"], ["역세권", "편의"], "뚝섬역 도보 5분", 31.2],
  ["통합공공임대 광진자양", "integ", "SH", "gwangjin", "서울 광진구 자양동", [5800, 210], "56.3㎡", "쓰리룸", "open", "2026.06.03", ["가구", "다자녀"], ["공원", "학군"], "건대입구역 도보 10분", null],
  ["국민임대 강동성내", "nation", "LH", "gangdong", "서울 강동구 성내동", [3900, 165], "42.1㎡", "투룸", "upcoming", "2026.06.08", ["신혼", "자녀"], ["공원"], "강동구청역 도보 7분", null],
  ["행복주택 송파문정", "happy", "SH", "songpa", "서울 송파구 문정동", [2800, 140], "26.8㎡", "투룸", "open", "2026.05.17", ["청년", "신혼"], ["역세권", "신축"], "문정역 도보 4분", 19.4],
  ["국민임대 송파거여", "nation", "LH", "songpa", "서울 송파구 거여동", [4500, 185], "45.7㎡", "투룸", "open", "2026.05.29", ["신혼", "자녀"], ["학군", "공원"], "거여역 도보 8분", 8.9],
  ["행복주택 강남세곡", "happy", "SH", "gangnam", "서울 강남구 세곡동", [2500, 125], "24.6㎡", "원룸", "open", "2026.04.28", ["청년"], ["공원"], "수서역 도보 14분", 26.7],
  ["통합공공임대 서초내곡", "integ", "SH", "seocho", "서울 서초구 내곡동", [6400, 235], "58.2㎡", "쓰리룸", "open", "2026.05.28", ["가구", "다자녀"], ["공원", "학군"], "양재시민의숲역 도보 15분", 6.2],
  ["행복주택 동작상도", "happy", "SH", "dongjak", "서울 동작구 상도동", [2200, 115], "21.3㎡", "원룸", "closing", "2026.04.24", ["청년", "신혼"], ["역세권"], "상도역 도보 6분", 24.1],
  ["국민임대 양천목동", "nation", "SH", "yangcheon", "서울 양천구 목동", [4400, 180], "43.8㎡", "투룸", "open", "2026.05.11", ["신혼", "자녀"], ["학군", "공원"], "목동역 도보 9분", 11.8],
  ["행복주택 종로창신", "happy", "SH", "jongno", "서울 종로구 창신동", [2100, 108], "19.6㎡", "원룸", "open", "2026.05.04", ["청년", "1인"], ["역세권"], "동묘앞역 도보 5분", 23.5],
];

export const LISTINGS: Listing[] = SEED.map((row, i) => {
  const [title, type, agency, districtId, address, [deposit, rent], area, layout, status, deadline, eligible, features, transit, competition] = row;
  const dist = DISTRICTS.find((d) => d.id === districtId);
  return {
    id: "listing-" + (i + 1),
    title,
    type,
    agency,
    districtId,
    district: dist?.name ?? "",
    mapX: (dist?.x ?? 50) + Math.sin(i * 2.3) * 2.5,
    mapY: (dist?.y ?? 50) + Math.cos(i * 1.7) * 2.5,
    lat: (dist?.lat ?? 37.5665) + Math.sin(i * 2.3) * 0.005,
    lng: (dist?.lng ?? 126.9780) + Math.cos(i * 1.7) * 0.005,
    address,
    deposit,
    rent,
    area,
    layout,
    status,
    deadline,
    eligible,
    features,
    transit,
    competition,
    thumbSeed: i,
  };
});
