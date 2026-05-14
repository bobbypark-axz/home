#!/usr/bin/env node
// 좌표 없는 LH 공고에 네이버 지오코딩 API로 좌표 채워 넣기
// 환경변수 (.env.local):
//   NAVER_MAPS_CLIENT_ID     - 네이버 클라우드 Application Client ID
//   NAVER_MAPS_CLIENT_SECRET - 네이버 클라우드 Application Client Secret
// 두 값이 없으면 API 호출 건너뛰고 시도 중심 좌표만 채움.
// 결과: lib/lh-notices-all.json 의 미수집 항목에 lat/lng 와 geocoded:true 표시

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib/lh-notices-all.json");
const ENV_PATH = path.join(ROOT, ".env.local");

const SIDO_CENTERS = {
  서울특별시: { lat: 37.5665, lng: 126.978 },
  경기도: { lat: 37.4138, lng: 127.5183 },
  인천광역시: { lat: 37.4563, lng: 126.7052 },
  부산광역시: { lat: 35.1796, lng: 129.0756 },
  대구광역시: { lat: 35.8714, lng: 128.6014 },
  광주광역시: { lat: 35.1595, lng: 126.8526 },
  대전광역시: { lat: 36.3504, lng: 127.3845 },
  울산광역시: { lat: 35.5384, lng: 129.3114 },
  세종특별자치시: { lat: 36.4801, lng: 127.289 },
  강원특별자치도: { lat: 37.8228, lng: 128.1555 },
  충청북도: { lat: 36.6358, lng: 127.4914 },
  충청남도: { lat: 36.5184, lng: 126.8 },
  전북특별자치도: { lat: 35.7175, lng: 127.153 },
  전라남도: { lat: 34.8161, lng: 126.463 },
  경상북도: { lat: 36.576, lng: 128.5057 },
  경상남도: { lat: 35.4606, lng: 128.2132 },
  제주특별자치도: { lat: 33.4996, lng: 126.5312 },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadEnvFile() {
  const text = await fs.readFile(ENV_PATH, "utf8").catch(() => "");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

function cleanAddress(addr) {
  if (!addr) return "";
  return addr
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+\d+층.*$/, "")
    .replace(/\s+(?:주택전시관|홍보관|전시관|모델하우스|LH[^,\s]*)[^,]*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function geocodeNaver(query) {
  const id = process.env.NAVER_MAPS_CLIENT_ID;
  const secret = process.env.NAVER_MAPS_CLIENT_SECRET;
  if (!id || !secret || !query) return null;
  const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
  const r = await fetch(url, {
    headers: {
      "x-ncp-apigw-api-key-id": id,
      "x-ncp-apigw-api-key": secret,
      Accept: "application/json",
    },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  const a = j.addresses?.[0];
  if (!a) return null;
  return { lat: Number(a.y), lng: Number(a.x), source: "naver-geocode" };
}

function sidoCenter(sido) {
  const c = SIDO_CENTERS[sido];
  if (!c) return null;
  return { lat: c.lat, lng: c.lng, source: "sido-center" };
}

async function main() {
  await loadEnvFile();
  const hasNaver = Boolean(
    process.env.NAVER_MAPS_CLIENT_ID && process.env.NAVER_MAPS_CLIENT_SECRET,
  );
  console.log(`네이버 지오코딩 API: ${hasNaver ? "활성" : "비활성 — 시도 중심 폴백만"}`);

  const notices = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
  const targets = notices.filter((n) => !(n.lat && n.lng));
  console.log(`보강 대상: ${targets.length}건`);

  let geoOk = 0;
  let fallback = 0;
  let skip = 0;

  for (let i = 0; i < targets.length; i++) {
    const n = targets[i];
    const queries = [];
    const pageAddr = cleanAddress(n.details?.pageAddress || "");
    if (pageAddr) queries.push(pageAddr);
    if (n.sido && n.sigungu) queries.push(`${n.sido} ${n.sigungu}`);

    let coord = null;
    if (hasNaver) {
      for (const q of queries) {
        try {
          coord = await geocodeNaver(q);
        } catch (error) {
          console.log(`[${i + 1}] ${n.id} 지오코딩 실패: ${error.message}`);
        }
        if (coord) break;
        await sleep(120);
      }
    }
    if (!coord) coord = sidoCenter(n.sido);

    if (coord) {
      n.lat = coord.lat;
      n.lng = coord.lng;
      n.geocoded = coord.source;
      if (coord.source === "naver-geocode") geoOk++;
      else fallback++;
    } else {
      skip++;
    }
    if ((i + 1) % 25 === 0) {
      console.log(
        `[${i + 1}/${targets.length}] geocoded=${geoOk} fallback=${fallback} skip=${skip}`,
      );
      await fs.writeFile(DATA_PATH, JSON.stringify(notices, null, 2) + "\n", "utf8");
    }
  }

  await fs.writeFile(DATA_PATH, JSON.stringify(notices, null, 2) + "\n", "utf8");
  console.log(`\n완료: geocoded=${geoOk} fallback=${fallback} skip=${skip}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
