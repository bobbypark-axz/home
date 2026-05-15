#!/usr/bin/env node
// LH 청약플러스 공고 게시판 크롤러 — 매물(53건)별 공실/모집 공고 매칭
// 사용: node scripts/crawl-listing-notices.mjs
// 결과: lib/lh-listing-notices.json  ({ [listingId]: [{title, panId, url, endDate, status, ...}] })

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib/lh-data.json");
const OUT_PATH = path.join(ROOT, "lib/lh-listing-notices.json");

const BASE_URL =
  "https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026";
const HEADERS = {
  "User-Agent": "doongji-app/1.0 (LH notice matcher; polite crawler; 1req/s)",
  Accept: "text/html",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildDetailUrl(panId, c2, c3, c4) {
  const p = new URLSearchParams({
    panId,
    ccrCnntSysDsCd: c2,
    uppAisTpCd: c3,
    aisTpCd: c4,
    mi: "1026",
  });
  return `https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?${p}`;
}

function parsePage(html) {
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? [];
  const notices = [];
  for (const row of rows) {
    const ids = row.match(
      /data-id1="([^"]+)"\s+data-id2="([^"]+)"\s+data-id3="([^"]+)"\s+data-id4="([^"]+)"/,
    );
    if (!ids) continue;
    const [, panId, c2, c3, c4] = ids;
    const titleM = row.match(
      /class="wrtancInfoBtn"[\s\S]*?<span>([\s\S]*?)<\/span>/,
    );
    let title = titleM ? titleM[1] : "";
    title = title
      .replace(/<em[^>]*>[\s\S]*?<\/em>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) =>
      m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    );
    notices.push({
      panId,
      title,
      type: tds[1] || "",
      region: tds[3] || "",
      announceDate: tds[5] || "",
      endDate: tds[6] || "",
      status: tds[7] || "",
      url: buildDetailUrl(panId, c2, c3, c4),
    });
  }
  return notices;
}

async function fetchAllPages() {
  const all = [];
  for (let page = 1; page <= 30; page++) {
    const url = `${BASE_URL}&pageIndex=${page}`;
    process.stdout.write(`  page ${page}: `);
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) {
      console.log(`fail ${r.status}`);
      break;
    }
    const html = await r.text();
    const notices = parsePage(html);
    if (notices.length === 0) {
      console.log("0 (end)");
      break;
    }
    console.log(`${notices.length}건`);
    all.push(...notices);
    await sleep(700);
  }
  // dedupe by panId
  const seen = new Map();
  for (const n of all) {
    if (!seen.has(n.panId)) seen.set(n.panId, n);
  }
  return [...seen.values()];
}

function extractComplexName(listing) {
  // "서울특별시 강서구 허준로 209(가양동,가양7단지아파트)" → "가양7단지"
  const m = listing.address.match(/\(([^)]+)\)/);
  if (!m) return "";
  const inside = m[1];
  const parts = inside.split(",").map((s) => s.trim());
  let name = parts[parts.length - 1] || inside;
  name = name.replace(/아파트$/, "").replace(/주공$/, "주공").trim();
  return name;
}

function baseName(complexName) {
  // "가양7단지" → "가양", "등촌주공1,2단지" → "등촌주공"
  return complexName
    .replace(/[0-9,]+단지?$/, "")
    .replace(/\s*\d+\s*$/, "")
    .trim();
}

function sourcePanId(listing) {
  if (!listing.sourceUrl) return "";
  try {
    return new URL(listing.sourceUrl).searchParams.get("panId") || "";
  } catch {
    return "";
  }
}

function normalizeTitle(title) {
  return (title || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function matchNotices(listing, notices) {
  // 0) 마이홈 API가 내려준 LH 원문 URL의 panId로 직접 매칭
  const panId = sourcePanId(listing);
  if (panId) {
    const byPanId = notices.filter((n) => n.panId === panId);
    if (byPanId.length > 0) return byPanId;
  }

  // 0-2) 공고명/단지명으로 매칭 (주소에 괄호 단지명이 없는 최신 API 데이터 대응)
  const titles = [listing.pblancNm, listing.title].map(normalizeTitle).filter(Boolean);
  for (const title of titles) {
    const byTitle = notices.filter((n) => {
      const noticeTitle = normalizeTitle(n.title);
      return noticeTitle.includes(title) || title.includes(noticeTitle);
    });
    if (byTitle.length > 0) return byTitle;
  }

  const complex = extractComplexName(listing);
  if (!complex || complex.length < 2) return [];
  // 1) 정확 단지명 (예: "가양7단지")
  let m = notices.filter((n) => n.title.includes(complex));
  if (m.length > 0) return m;
  // 2) 단지번호 떼고 (예: "가양주공") + 서울 지역 한정
  const base = baseName(complex);
  if (base.length >= 2 && base !== complex) {
    m = notices.filter(
      (n) => n.title.includes(base) && (n.region.includes("서울") || !n.region),
    );
    if (m.length > 0) return m;
  }
  // 3) listing.title 자체 (예: "서울가양") 매칭 시도
  m = notices.filter((n) => {
    const t = listing.title.replace(/^서울/, "").replace(/[0-9]+$/, "").trim();
    return t.length >= 2 && n.title.includes(t) && (n.region.includes("서울") || !n.region);
  });
  return m;
}

async function main() {
  console.log("Fetching LH 청약플러스 공고 게시판...");
  const notices = await fetchAllPages();
  console.log(`\n총 ${notices.length}건 공고 (중복 제거)\n`);

  // 서울 공고만 따로 살펴보기
  const seoul = notices.filter((n) => n.region.includes("서울"));
  console.log(`서울 공고: ${seoul.length}건`);
  if (seoul.length > 0) {
    console.log("\n서울 공고 제목:");
    seoul.forEach((n) =>
      console.log(`  [${n.status}] ${n.title.slice(0, 70)} (~${n.endDate})`),
    );
  }

  const listings = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
  const result = {};
  let matchCount = 0;
  console.log("\n매물별 매칭:");
  for (const listing of listings) {
    const matched = matchNotices(listing, notices);
    if (matched.length > 0) {
      // 진행중/예정 우선, 마감일 늦은 순
      matched.sort((a, b) => {
        const sA = a.status?.includes("접수") ? 2 : a.status?.includes("공고") ? 1 : 0;
        const sB = b.status?.includes("접수") ? 2 : b.status?.includes("공고") ? 1 : 0;
        if (sA !== sB) return sB - sA;
        return (b.endDate || "").localeCompare(a.endDate || "");
      });
      result[listing.id] = matched;
      matchCount++;
      console.log(`✓ ${listing.title}  →  ${matched.length}건`);
      matched.slice(0, 2).forEach((n) =>
        console.log(`    [${n.status}] ${n.title.slice(0, 60)} (~${n.endDate})`),
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
