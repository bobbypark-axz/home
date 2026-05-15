// LH 공고 상세 페이지 → 주소 추출 → OSM Nominatim 으로 좌표 변환.
// 대상: lib/lh-notices-all.json 의 geocoded === "sido-center" + selectWrtancInfo.do URL.
//
// LH 페이지의 var lat_0/lng_0 변수가 비어있는 경우(sido-center 폴백된 listing 들이 대부분)
// 페이지 내 "소재지" 텍스트에서 주소를 뽑아 외부 geocoder 로 처리.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "lib/lh-notices-all.json");

const UA = "doongji-app/1.0 (LH page-coords enricher; polite 1req/1.2s)";
const COORD_RE = /var\s+lat_0\s*=\s*"([\d.]+)"[\s\S]{0,200}?var\s+lng_0\s*=\s*"([\d.]+)"/;
// "<li class="w100"><strong>소재지</strong> 대구광역시 동구 반야월북로 221(신서동,신서화성파크드림) </li>"
const ADDR_RE =
  /<strong>\s*소재지\s*<\/strong>\s*([^<]+?)(?:<|$)/;
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const REQ_DELAY_MS = 1200; // Nominatim TOS: 1 req/s

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cleanAddress(raw) {
  // "(신서동,신서화성파크드림)" 같은 괄호 안은 단지명 — geocoder 정확도 위해 제거 시도
  return raw.replace(/\s+/g, " ").trim();
}

function addressForGeocode(addr) {
  // 괄호 안 제거: "대구광역시 동구 반야월북로 221(신서동,...)" → "대구광역시 동구 반야월북로 221"
  return cleanAddress(addr).replace(/\s*\([^)]*\)\s*$/, "").trim();
}

async function nominatimGeocode(q) {
  const url = `${NOMINATIM_BASE}?format=json&limit=1&countrycodes=kr&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "ko" } });
  if (!res.ok) throw new Error(`nominatim HTTP ${res.status}`);
  const arr = await res.json();
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const lat = Number(arr[0].lat);
  const lng = Number(arr[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const targets = data.filter(
    (r) =>
      r.geocoded === "sido-center" &&
      typeof r.sourceUrl === "string" &&
      r.sourceUrl.includes("selectWrtancInfo.do"),
  );
  console.log(`targets: ${targets.length}`);

  let updatedPage = 0;
  let updatedGeocode = 0;
  let noAddr = 0;
  let geocodeFail = 0;
  let httpFail = 0;

  for (const [i, r] of targets.entries()) {
    const prefix = `[${i + 1}/${targets.length}] ${r.id}`;
    try {
      const res = await fetch(r.sourceUrl, { headers: { "User-Agent": UA } });
      if (!res.ok) {
        httpFail++;
        console.warn(`${prefix} HTTP ${res.status}`);
        continue;
      }
      const html = await res.text();

      // 1) page 내 lat_0/lng_0 우선
      const cm = html.match(COORD_RE);
      if (cm) {
        const lat = Number(cm[1]);
        const lng = Number(cm[2]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          r.lat = lat;
          r.lng = lng;
          r.geocoded = "page-coords";
          updatedPage++;
          console.log(`${prefix} page-coords: ${lat}, ${lng}`);
          await sleep(REQ_DELAY_MS);
          continue;
        }
      }

      // 2) 소재지 주소 추출 → Nominatim
      const am = html.match(ADDR_RE);
      if (!am) {
        noAddr++;
        if (noAddr < 5) console.warn(`${prefix} no 소재지 in page`);
        await sleep(REQ_DELAY_MS);
        continue;
      }
      const rawAddr = cleanAddress(am[1]);
      const queryAddr = addressForGeocode(rawAddr);
      const coords = await nominatimGeocode(queryAddr);
      if (!coords) {
        geocodeFail++;
        if (geocodeFail < 10) console.warn(`${prefix} geocode failed for: ${queryAddr}`);
        await sleep(REQ_DELAY_MS);
        continue;
      }
      r.lat = coords.lat;
      r.lng = coords.lng;
      r.address = rawAddr; // 주소도 같이 보강
      r.geocoded = "page-addr-osm";
      updatedGeocode++;
      console.log(`${prefix} osm: ${coords.lat}, ${coords.lng} (${queryAddr.slice(0, 40)})`);
    } catch (e) {
      console.warn(`${prefix} error: ${e.message}`);
    }
    await sleep(REQ_DELAY_MS);
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log("---");
  console.log({ updatedPage, updatedGeocode, noAddr, geocodeFail, httpFail, total: targets.length });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
