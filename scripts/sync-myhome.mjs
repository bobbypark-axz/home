#!/usr/bin/env node
// 공공데이터포털 마이홈 모집공고(HWSPR02)에서 받아 lib/lh-data.json 갈아엎기
// 좌표는 별도 — 우선 시군구 중심점(DISTRICTS)으로 매핑. 정확 좌표는 별도 지오코딩 단계.
// 사용: DATA_GO_KR_KEY 설정 후  node scripts/sync-myhome.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "lib/lh-data.json");

const KEY = process.env.DATA_GO_KR_KEY;
if (!KEY) {
  console.error("DATA_GO_KR_KEY 가 .env.local 에 없음");
  process.exit(1);
}

// mock-data.ts 와 같은 시군구 중심점 (좌표 임시 폴백용)
const DISTRICT_CENTERS = {
  강서구: { id: "gangseo",      lat: 37.5509, lng: 126.8495 },
  양천구: { id: "yangcheon",    lat: 37.5170, lng: 126.8666 },
  구로구: { id: "guro",         lat: 37.4954, lng: 126.8874 },
  금천구: { id: "geumcheon",    lat: 37.4569, lng: 126.8950 },
  관악구: { id: "gwanak",       lat: 37.4784, lng: 126.9516 },
  동작구: { id: "dongjak",      lat: 37.5124, lng: 126.9393 },
  영등포구: { id: "yeongdeungpo", lat: 37.5264, lng: 126.8962 },
  마포구: { id: "mapo",         lat: 37.5663, lng: 126.9019 },
  은평구: { id: "eunpyeong",    lat: 37.6027, lng: 126.9291 },
  서대문구: { id: "seodaemun",  lat: 37.5791, lng: 126.9368 },
  종로구: { id: "jongno",       lat: 37.5735, lng: 126.9788 },
  중구: { id: "junggu",         lat: 37.5638, lng: 126.9975 },
  용산구: { id: "yongsan",      lat: 37.5323, lng: 126.9900 },
  성북구: { id: "seongbuk",     lat: 37.5894, lng: 127.0167 },
  강북구: { id: "gangbuk",      lat: 37.6396, lng: 127.0255 },
  도봉구: { id: "dobong",       lat: 37.6688, lng: 127.0471 },
  노원구: { id: "nowon",        lat: 37.6542, lng: 127.0568 },
  중랑구: { id: "jungnang",     lat: 37.6063, lng: 127.0925 },
  동대문구: { id: "dongdaemun", lat: 37.5744, lng: 127.0396 },
  성동구: { id: "seongdong",    lat: 37.5634, lng: 127.0371 },
  광진구: { id: "gwangjin",     lat: 37.5385, lng: 127.0823 },
  강동구: { id: "gangdong",     lat: 37.5301, lng: 127.1238 },
  송파구: { id: "songpa",       lat: 37.5145, lng: 127.1066 },
  강남구: { id: "gangnam",      lat: 37.5172, lng: 127.0473 },
  서초구: { id: "seocho",       lat: 37.4837, lng: 127.0324 },
};

function mapHousingType(suplyTyNm) {
  if (!suplyTyNm) return "integ";
  if (suplyTyNm.includes("행복")) return "happy";
  if (suplyTyNm.includes("국민")) return "nation";
  return "integ";
}

function mapAgency(suplyInsttNm) {
  if (!suplyInsttNm) return "LH";
  if (suplyInsttNm.includes("SH")) return "SH";
  if (suplyInsttNm.includes("GH")) return "GH";
  return "LH";
}

function mapStatus(beginDe, endDe) {
  const today = new Date();
  const yyyymmdd = (s) => s ? new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`) : null;
  const begin = yyyymmdd(beginDe);
  const end = yyyymmdd(endDe);
  if (begin && today < begin) return "upcoming";
  if (end && today > end) return "closed";
  if (end) {
    const days = (end - today) / (1000 * 60 * 60 * 24);
    if (days <= 3) return "closing";
  }
  return "open";
}

function fmtDeadline(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return "";
  return `${yyyymmdd.slice(0,4)}.${yyyymmdd.slice(4,6)}.${yyyymmdd.slice(6,8)}`;
}

async function fetchPage(brtcCode, pageNo, numOfRows = 100) {
  const qs = new URLSearchParams({
    serviceKey: KEY,
    _type: "json",
    numOfRows: String(numOfRows),
    pageNo: String(pageNo),
    brtcCode,
  });
  const url = `https://apis.data.go.kr/1613000/HWSPR02/rsdtRcritNtcList?${qs}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const body = j.response?.body;
  return {
    total: parseInt(body?.totalCount ?? "0", 10),
    items: body?.item ?? [],
  };
}

async function fetchAllSeoul() {
  const all = [];
  let pageNo = 1;
  while (true) {
    const { total, items } = await fetchPage("11", pageNo, 100);
    all.push(...items);
    if (all.length >= total || items.length === 0) break;
    pageNo++;
    await new Promise((r) => setTimeout(r, 300));
  }
  return all;
}

function transform(item, idx) {
  const district = item.signguNm || "";
  const center = DISTRICT_CENTERS[district];
  const type = mapHousingType(item.suplyTyNm);
  const agency = mapAgency(item.suplyInsttNm);
  const status = mapStatus(item.beginDe, item.endDe);
  const depositManwon = item.rentGtn ? Math.round(item.rentGtn / 10000) : 0;
  const rentManwon = item.mtRntchrg ? Math.round(item.mtRntchrg / 10000) : 0;
  return {
    id: `mh-${item.pblancId}-${item.houseSn ?? idx}`,
    pblancId: String(item.pblancId ?? ""),
    houseSn: item.houseSn ?? null,
    title: item.hsmpNm || item.pblancNm || `매물 ${idx + 1}`,
    type,
    agency,
    districtId: center?.id ?? "",
    district,
    lat: center?.lat ?? 0,
    lng: center?.lng ?? 0,
    address: (item.fullAdres || "").trim(),
    pnu: item.pnu || "",
    deposit: depositManwon,
    rent: rentManwon,
    area: "",
    layout: "",
    totalUnits: item.totHshldCo ?? null,
    supplyUnits: item.sumSuplyCo ?? null,
    heatMethod: item.heatMthdNm || "",
    status,
    deadline: fmtDeadline(item.endDe),
    beginDate: fmtDeadline(item.beginDe),
    eligible: [],
    features: [],
    transit: "",
    competition: null,
    thumbSeed: idx,
    suplyTyNm: item.suplyTyNm || "",
    pblancNm: item.pblancNm || "",
    sourceUrl: item.url || item.pcUrl || "",
    pcUrl: item.pcUrl || "",
    mobileUrl: item.mobileUrl || "",
  };
}

async function main() {
  console.log("마이홈 HWSPR02 호출 (서울만, brtcCode=11)...");
  const items = await fetchAllSeoul();
  console.log(`수신: ${items.length}건`);

  const listings = items.map((it, i) => transform(it, i));
  console.log("\n변환 결과 샘플:");
  console.log(JSON.stringify(listings[0], null, 2));

  // 통계
  const districts = new Map();
  for (const l of listings) districts.set(l.district, (districts.get(l.district) || 0) + 1);
  console.log("\n구별 분포:");
  [...districts.entries()].sort((a, b) => b[1] - a[1]).forEach(([d, c]) => console.log(`  ${d.padEnd(8)} ${c}`));

  await fs.writeFile(OUT_PATH, JSON.stringify(listings, null, 2) + "\n", "utf8");
  console.log(`\n저장: ${OUT_PATH} (${listings.length}건)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
