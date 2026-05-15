#!/usr/bin/env node
// LH 청약플러스 상세 페이지에서 좌표 / 주택형 / 공급일정을 모두 끌어와
// lib/lh-notices-all.json 의 각 항목에 details 필드로 병합한다.
// 사용: node scripts/enrich-lh-details.mjs [--limit N] [--resume]

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib/lh-notices-all.json");
const PROGRESS_PATH = path.join(ROOT, "lib/lh-notices-all.progress.json");

const HEADERS = {
  "User-Agent": "doongji-app/1.0 (LH detail enricher; polite crawler; 1req/s)",
  Accept: "text/html",
};
const DELAY_MS = 700;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractAllCoords(html) {
  const coords = {};
  for (const m of html.matchAll(/var\s+lat_(\d+)\s*=\s*"([\d.]+)"/g)) {
    coords[m[1]] ??= {};
    coords[m[1]].lat = Number(m[2]);
  }
  for (const m of html.matchAll(/var\s+lng_(\d+)\s*=\s*"([\d.]+)"/g)) {
    coords[m[1]] ??= {};
    coords[m[1]].lng = Number(m[2]);
  }
  return coords;
}

function extractTabNames(html) {
  const tabs = {};
  for (const m of html.matchAll(/<li[^>]*id="tab(?:Plan)?li(\d+)"[^>]*>([\s\S]{0,500}?)<\/li>/g)) {
    const idx = m[1];
    const name = m[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (name && !tabs[idx]) tabs[idx] = name;
  }
  return tabs;
}

function normalizeForMatch(s) {
  return (s || "")
    .replace(/[\s()\[\]·,\-]/g, "")
    .replace(/블록$|단지$|구역$|행복$|행복주택$|아파트$|국민$|영구$/g, "")
    .toLowerCase();
}

function pickCoordForTitle(coords, tabs, title) {
  const keys = Object.keys(coords).filter((k) => coords[k].lat && coords[k].lng);
  if (keys.length === 0) return { coord: null, matchedTab: null };
  if (keys.length === 1) return { coord: coords[keys[0]], matchedTab: tabs[keys[0]] ?? null };
  const t = normalizeForMatch(title);
  let best = { score: -1, key: keys[0] };
  for (const k of keys) {
    const n = normalizeForMatch(tabs[k] ?? "");
    if (!n || !t) continue;
    let score = 0;
    if (n === t) score = 1000;
    else if (n.includes(t) || t.includes(n)) score = 500 + Math.min(n.length, t.length);
    else {
      // 부분 일치 토큰 수
      const a = new Set(n.match(/[가-힣a-z0-9]{2,}/g) ?? []);
      const b = new Set(t.match(/[가-힣a-z0-9]{2,}/g) ?? []);
      for (const tok of a) if (b.has(tok)) score += 10;
    }
    if (score > best.score) best = { score, key: k };
  }
  return { coord: coords[best.key], matchedTab: tabs[best.key] ?? null };
}

function extractPageAddress(html) {
  return html.match(/var\s+address\s*=\s*"([^"]+)"/)?.[1] ?? "";
}

const PHOTO_KIND_PRIORITY = ["단지조감도", "단지전경", "단지배치도", "지역조감도", "지구조감도", "위치도", "동호배치도", "평면도"];

function extractPhotos(html) {
  const out = [];
  const seen = new Set();
  for (const m of html.matchAll(/list\.push\("\{([^"]+)\}"\)/g)) {
    const fields = {};
    for (const entry of m[1].split(",")) {
      const [k, ...v] = entry.split("=");
      fields[k.trim()] = v.join("=").trim();
    }
    const sn = fields.cmnAhflSn;
    if (!sn || seen.has(sn)) continue;
    seen.add(sn);
    out.push({
      kind: fields.slPanAhflDsCdNm || fields.ahflDesc || null,
      name: fields.cmnAhflNm || null,
      url: `https://apply.lh.or.kr/lhapply/lhFile.do?fileid=${sn}`,
    });
  }
  out.sort((a, b) => {
    const ai = PHOTO_KIND_PRIORITY.indexOf(a.kind ?? "");
    const bi = PHOTO_KIND_PRIORITY.indexOf(b.kind ?? "");
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  return out;
}

function cleanCell(s) {
  return s
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tableByCaption(html, captionRegex) {
  const re = new RegExp(
    `<caption[^>]*>\\s*(${captionRegex.source}[\\s\\S]*?)</caption>([\\s\\S]*?)</table>`,
    "i",
  );
  const m = html.match(re);
  if (!m) return null;
  const body = m[2];
  const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((row) => {
    const cells = [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) =>
      cleanCell(c[1]),
    );
    return cells;
  });
  return rows.filter((r) => r.length > 0);
}

function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map((h) => h.replace(/\s+/g, ""));
  return rows
    .slice(1)
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        const v = row[i];
        if (h && v && v !== "상세보기") obj[h] = v;
      });
      return obj;
    })
    .filter((obj) => Object.values(obj).some((v) => v && v.length > 0));
}

function extractHousingTypes(html) {
  return rowsToObjects(tableByCaption(html, /주택형\s*안내/));
}

function extractSchedule(html) {
  const rows = tableByCaption(html, /공급일정/);
  return rowsToObjects(rows).filter((r) => r["신청일시"] || r["신청 일시"]);
}

async function fetchDetail(url) {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

function isLhDetailUrl(url) {
  return typeof url === "string" && url.includes("apply.lh.or.kr") && url.includes("selectWrtancInfo.do");
}

async function loadProgress() {
  try {
    return JSON.parse(await fs.readFile(PROGRESS_PATH, "utf8"));
  } catch {
    return { done: 0, errors: [] };
  }
}

async function saveProgress(p) {
  await fs.writeFile(PROGRESS_PATH, JSON.stringify(p, null, 2) + "\n", "utf8");
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;
  const resume = args.includes("--resume");

  const notices = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
  const progress = resume ? await loadProgress() : { done: 0, errors: [] };

  let processed = 0;
  let okCount = 0;
  let skipCount = 0;
  let errCount = 0;
  const startIdx = resume ? progress.done : 0;

  for (let i = startIdx; i < notices.length; i++) {
    if (processed >= limit) break;
    const n = notices[i];
    // 이미 enrichment 완료된 항목은 건너뜀. photos는 별도 보강(아래)에서 처리.
    if (n.details?.enrichedAt && n.photos?.length) {
      skipCount++;
      progress.done = i + 1;
      continue;
    }
    if (!isLhDetailUrl(n.sourceUrl)) {
      skipCount++;
      progress.done = i + 1;
      continue;
    }
    processed++;
    try {
      const html = await fetchDetail(n.sourceUrl);
      const coords = extractAllCoords(html);
      const tabs = extractTabNames(html);
      const { coord, matchedTab } = pickCoordForTitle(coords, tabs, n.title);
      const pageAddress = extractPageAddress(html);
      const housingTypes = extractHousingTypes(html);
      const schedule = extractSchedule(html);
      const photos = extractPhotos(html);

      if (coord && coord.lat && coord.lng) {
        n.lat = coord.lat;
        n.lng = coord.lng;
      }
      if (photos.length > 0) n.photos = photos;
      n.details = {
        pageAddress,
        matchedTab,
        coordCount: Object.keys(coords).length,
        housingTypes,
        schedule,
        enrichedAt: new Date().toISOString(),
      };
      okCount++;
      if (processed % 20 === 0 || processed <= 10) {
        const pct = (((i + 1) / notices.length) * 100).toFixed(1);
        console.log(
          `[${i + 1}/${notices.length} ${pct}%] ${n.id} "${n.title.slice(0, 28)}" → tab="${matchedTab ?? "-"}" coord=${coord?.lat ?? "-"},${coord?.lng ?? "-"} types=${housingTypes.length}`,
        );
      }
    } catch (error) {
      errCount++;
      progress.errors.push({ id: n.id, url: n.sourceUrl, error: String(error.message) });
      console.log(`[${i + 1}] ${n.id} ERROR: ${error.message}`);
    }
    progress.done = i + 1;
    // 매 50건마다 중간 저장
    if (processed % 50 === 0) {
      await fs.writeFile(DATA_PATH, JSON.stringify(notices, null, 2) + "\n", "utf8");
      await saveProgress(progress);
    }
    await sleep(DELAY_MS);
  }

  await fs.writeFile(DATA_PATH, JSON.stringify(notices, null, 2) + "\n", "utf8");
  await saveProgress(progress);
  console.log(
    `\n완료: 처리 ${processed} (성공 ${okCount}, 실패 ${errCount}, 건너뜀 ${skipCount})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
