#!/usr/bin/env node
// 마이홈포털 공공주택 모집공고 (HWSPR02) → lib/lh-notices.json
// 서울 LH 모집공고는 단지별이 아닌 "통합공고" 체계라
// 우리 데이터(lh-data.json) 53건과는 별개로 통합공고만 따로 저장한다.
// 사용: `set -a; source .env.local; set +a; node scripts/fetch-deadlines.mjs`

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "lib/lh-notices.json");

const KEY = process.env.DATA_GO_KR_KEY;
if (!KEY) {
  console.error("DATA_GO_KR_KEY 가 .env.local 에 없습니다");
  process.exit(1);
}

const ENDPOINT = "https://apis.data.go.kr/1613000/HWSPR02/rsdtRcritNtcList";
// data.go.kr 일부 엔드포인트가 Node 기본 UA를 차단해서 명시 필요
const HEADERS = { "User-Agent": "curl/8.0" };

function ymOf(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchPage(brntcBassYm, pageNo) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("serviceKey", KEY);
  url.searchParams.set("numOfRows", "100");
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("brntcBassYm", brntcBassYm);
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`${brntcBassYm} p${pageNo}: ${r.status}`);
  return JSON.parse(await r.text());
}

async function fetchMonth(brntcBassYm) {
  const all = [];
  for (let p = 1; p < 30; p++) {
    const json = await fetchPage(brntcBassYm, p);
    const body = json?.response?.body;
    const items = body?.item ?? [];
    all.push(...(Array.isArray(items) ? items : [items]));
    if (all.length >= Number(body?.totalCount ?? 0)) break;
  }
  return all;
}

async function main() {
  const now = new Date();
  // 현재월 + 다음 2달
  const months = [0, 1, 2].map(off => ymOf(new Date(now.getFullYear(), now.getMonth() + off, 1)));

  const today = new Date(); today.setHours(0,0,0,0);
  const seen = new Map();
  for (const m of months) {
    const arr = await fetchMonth(m);
    for (const n of arr) {
      if (n.brtcNm !== "서울특별시") continue;
      seen.set(n.pblancId, n);
    }
  }
  console.log(`서울 공고 ${seen.size}건 (중복제거)`);

  const notices = [...seen.values()]
    .filter(n => {
      // 마감일이 없거나 이미 지난 공고는 제외
      const end = n.endDe;
      if (!end || end.length !== 8) return false;
      const endDate = new Date(Number(end.slice(0,4)), Number(end.slice(4,6))-1, Number(end.slice(6,8)));
      return endDate >= today;
    })
    .map(n => ({
      pblancId: String(n.pblancId),
      title: n.pblancNm || "",
      supplyType: n.suplyTyNm || "",       // 전세임대 / 통합공공임대 등
      institution: n.suplyInsttNm || "LH", // 공급기관
      announceDate: n.rcritPblancDe || "", // 공고일 YYYYMMDD
      beginDate: n.beginDe || "",
      endDate: n.endDe || "",
      // n.pcUrl = 마이홈포털 통합 단일 공고 페이지 — 깔끔 (PDF 다운로드 노출)
      // n.url = LH 청약플러스 공고 페이지 — portal chrome 무거움
      applyUrl: n.pcUrl || n.url || "",
      infoUrl: n.url || n.pcUrl || "",
    }))
    .sort((a, b) => a.endDate.localeCompare(b.endDate));

  console.log(`현재 진행중(마감 미도래) 공고 ${notices.length}건:\n`);
  notices.forEach(n => {
    console.log(`  ${n.endDate} 마감 · ${n.supplyType} · ${n.title}`);
  });

  await fs.writeFile(OUT_PATH, JSON.stringify(notices, null, 2) + "\n", "utf8");
  console.log(`\n저장: ${OUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
