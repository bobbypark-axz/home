#!/usr/bin/env node
// SH(서울주택도시공사) 단지별 임대정보 크롤러
//   list page: /main/lay2/program/S1T305C311/www/m_491/hmng/viewRentalHouseBlockInfoList.do
//   91 pages × ~10 entries ≈ 900 단지 (서울 전역 SH 관리 임대주택)
//
// 매칭 전략: 53개 LH 매물의 단지명(예: "가양7단지", "등촌주공")을 추출해
// SH 단지명에 포함되는지 검사. 정확매칭 / 베이스매칭 / 부분매칭 단계 적용.
//
// 사용: node scripts/crawl-sh-notices.mjs
// 결과: lib/sh-blocks.json          (전체 단지 목록 캐시)
//       lib/sh-listing-notices.json ({ [listingId]: [{ blockId, name, type, district, units, completedAt, status, detailUrl }] })

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib/lh-data.json");
const BLOCKS_PATH = path.join(ROOT, "lib/sh-blocks.json");
const OUT_PATH = path.join(ROOT, "lib/sh-listing-notices.json");

const BASE_URL =
  "https://www.i-sh.co.kr/main/lay2/program/S1T305C311/www/m_491/hmng/viewRentalHouseBlockInfoList.do";
const HEADERS = {
  "User-Agent": "doongji-app/1.0 (SH block matcher; polite crawler; 1req/s)",
  Accept: "text/html",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function detailUrl(blockId) {
  return `https://www.i-sh.co.kr/main/lay2/program/S1T305C311/www/m_491/hmng/viewRentalHouseBlockInfo.do?bzdistnctNo=${blockId}`;
}

function parsePage(html) {
  // 테이블 영역만 잘라서 row 단위로 분해
  const m = html.match(
    /우리아파트 찾기 검색결과 목록 테이블[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/,
  );
  if (!m) return [];
  const body = m[1];
  const rows = body.match(/<tr[\s\S]*?<\/tr>/g) ?? [];
  const blocks = [];
  for (const row of rows) {
    const idM = row.match(/goDetail\('([0-9]+)'\)[^>]*>([^<]+)<\/a>/);
    if (!idM) continue;
    const blockId = idM[1];
    const name = idM[2].trim();
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) =>
      m[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );
    // 컬럼: [번호, 유형, 단지명, 지역, 세대수, 준공(예정)일, 비고]
    blocks.push({
      no: tds[0] || "",
      type: tds[1] || "",
      name,
      district: tds[3] || "",
      units: tds[4] || "",
      completedAt: tds[5] || "",
      status: tds[6] || "",
      blockId,
      detailUrl: detailUrl(blockId),
    });
  }
  return blocks;
}

async function fetchAllPages() {
  const all = [];
  let lastPage = 100;
  for (let page = 1; page <= lastPage; page++) {
    const url = `${BASE_URL}?page=${page}`;
    process.stdout.write(`  page ${page}/${lastPage}: `);
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) {
      console.log(`fail ${r.status}`);
      break;
    }
    const html = await r.text();
    if (page === 1) {
      const lpm = html.match(/getPaging\((\d+),null\)[^"]*"[^"]*btnLast/);
      if (lpm) lastPage = Math.min(Number(lpm[1]), 200);
    }
    const blocks = parsePage(html);
    if (blocks.length === 0) {
      console.log("0 (end)");
      break;
    }
    console.log(`${blocks.length}건`);
    all.push(...blocks);
    await sleep(600);
  }
  // dedupe by blockId
  const seen = new Map();
  for (const b of all) if (!seen.has(b.blockId)) seen.set(b.blockId, b);
  return [...seen.values()];
}

function extractComplexName(listing) {
  const m = listing.address.match(/\(([^)]+)\)/);
  if (!m) return "";
  const parts = m[1].split(",").map((s) => s.trim());
  let name = parts[parts.length - 1] || "";
  return name.replace(/아파트$/, "").trim();
}

function baseName(complexName) {
  // "가양7단지" → "가양", "등촌주공11단지" → "등촌주공", "2단지주공" → "주공"
  return complexName
    .replace(/^[0-9,]+단지?/, "")
    .replace(/[0-9,]+단지?$/, "")
    .replace(/단지$/, "")
    .replace(/\s*\d+\s*$/, "")
    .trim();
}

function matchBlocks(listing, blocks) {
  const complex = extractComplexName(listing);
  if (!complex || complex.length < 2) return [];
  // 1) 단지명 직접 포함
  let m = blocks.filter((b) => b.name.includes(complex));
  if (m.length > 0) return m.map((b) => ({ ...b, matchKind: "exact" }));
  // 2) 베이스명 + 같은 구
  const base = baseName(complex);
  if (base.length >= 2 && base !== complex) {
    m = blocks.filter(
      (b) => b.name.includes(base) && b.district === listing.district,
    );
    if (m.length > 0) return m.map((b) => ({ ...b, matchKind: "base+district" }));
  }
  // 3) listing.title 자체 (예: "서울가양" → "가양") + 같은 구
  const t = listing.title.replace(/^서울/, "").replace(/[0-9]+$/, "").trim();
  if (t.length >= 2) {
    m = blocks.filter(
      (b) => b.name.includes(t) && b.district === listing.district,
    );
    if (m.length > 0) return m.map((b) => ({ ...b, matchKind: "title+district" }));
  }
  return [];
}

async function main() {
  let blocks;
  if (process.env.USE_CACHE && (await fs.stat(BLOCKS_PATH).catch(() => null))) {
    console.log("Using cached SH blocks list...");
    blocks = JSON.parse(await fs.readFile(BLOCKS_PATH, "utf8"));
  } else {
    console.log("Fetching SH 단지별 임대정보 (전체)...");
    blocks = await fetchAllPages();
    await fs.writeFile(BLOCKS_PATH, JSON.stringify(blocks, null, 2) + "\n", "utf8");
    console.log(`\n캐시 저장: ${BLOCKS_PATH}`);
  }
  console.log(`\n총 ${blocks.length}개 SH 단지\n`);

  // 유형/구별 분포 요약
  const byType = {};
  for (const b of blocks) byType[b.type] = (byType[b.type] || 0) + 1;
  console.log("유형 분포:", byType);

  const listings = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
  const result = {};
  let matchCount = 0;
  console.log("\n매물별 매칭:");
  for (const listing of listings) {
    const matched = matchBlocks(listing, blocks);
    if (matched.length > 0) {
      // 모집중/공실 단지 우선, 그다음 임대완료 아닌 것 우선
      matched.sort((a, b) => {
        const sA = !a.status || a.status === "" ? 1 : a.status.includes("임대완료") ? 0 : 2;
        const sB = !b.status || b.status === "" ? 1 : b.status.includes("임대완료") ? 0 : 2;
        return sB - sA;
      });
      result[listing.id] = matched;
      matchCount++;
      const top = matched[0];
      console.log(
        `✓ ${listing.title.padEnd(12)} → ${matched.length}건 [${top.matchKind}] ${top.name} (${top.district}, ${top.status || "active"})`,
      );
    }
  }
  console.log(`\n매칭 성공: ${matchCount}/${listings.length}`);

  await fs.writeFile(OUT_PATH, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(`저장: ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
