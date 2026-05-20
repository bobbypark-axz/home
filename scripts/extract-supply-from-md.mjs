#!/usr/bin/env node
// markdown (lib/notice-texts/{id}.md) 에서 모집세대수 + 임대조건 표를 정형 파싱.
// LH 50년임대·국민임대 표는 컬럼 구조가 표준. LLM 환각 회피 위해 결정론적 추출.
//
// 산출:
//   - lib/notice-supply/{id}.json — 주택형별 상세 (면적·보증금·월세)
//   - lib/listings-api.json 의 supplyUnits / deposit / rent / area 보강
//
// 사용:
//   node scripts/extract-supply-from-md.mjs [--limit N] [--force] [--id LISTING_ID]

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEXTS_DIR = path.join(ROOT, "lib/notice-texts");
const SUPPLY_DIR = path.join(ROOT, "lib/notice-supply");
const LISTINGS_PATH = path.join(ROOT, "lib/listings-api.json");

const args = process.argv.slice(2);
const LIMIT = (() => {
  const i = args.indexOf("--limit");
  return i >= 0 ? Number(args[i + 1]) : Infinity;
})();
const FORCE = args.includes("--force");
const ONLY_ID = (() => {
  const i = args.indexOf("--id");
  return i >= 0 ? args[i + 1] : null;
})();

// "12,345,000" → 12345000.  실패 시 null.
function parseInt2(s) {
  if (!s) return null;
  const n = Number(String(s).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// markdown 표 한 줄 → 셀 배열. "| a | b | c |" → ["a", "b", "c"].
function splitRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((s) => s.trim());
}

// 표 본문 (header 다음, --- 다음) 의 데이터 행만 추출.
// markdown 의 표는 같은 헤더가 여러 줄 반복되는 경우 있어 (병합 셀 효과) 데이터로 보이지만 헤더인 행을 제외.
function isHeaderLikeRow(cells) {
  // 셀 중 하나라도 표 헤더 키워드 포함하면 헤더로 간주.
  const headerKeywords = [
    "주택형", "단지명", "임대보증금", "월임대료", "주거 전용", "전환가능", "보증금",
    "모집할", "예비자수", "구조", "비고", "최대전환", "주거공용",
  ];
  return cells.some((c) => headerKeywords.some((k) => c.includes(k)));
}

// 모집대상 표 추출 — 컬럼: 단지명/주택형/면적(여러)/건설호수/대기예비자/모집할예비자수
// 핵심: "모집할 예비자수" 헤더에 (XX) 형태로 통합 값 명시되면 그 값을 supplyTotal 로.
// 헤더 키워드: "모집할 예비자수" + "주택형"
function parseSupplyTable(md) {
  const lines = md.split("\n");
  const result = { supplyTotal: null, units: [], integrated: false };

  // "모집할 예비자수 (100)" 같이 헤더에 통합 숫자 박힌 케이스
  const integratedMatch = md.match(/모집할\s*예비자수\s*\(\s*([\d,]+)\s*\)/);
  if (integratedMatch) {
    result.supplyTotal = parseInt2(integratedMatch[1]);
    result.integrated = true;
  }

  // 표 영역 찾기 — 헤더에 "주택형" + "모집할" (or "모집세대") 들어있는 라인
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("|")) continue;
    const cells = splitRow(line);
    if (!cells.some((c) => c.includes("주택형"))) continue;
    if (!cells.some((c) => /모집/.test(c))) continue;

    // 헤더 발견. 컬럼 인덱스 매핑.
    const idx = {
      type: cells.findIndex((c) => c.trim() === "주택형"),
      area: cells.findIndex((c) => c.includes("주거 전용") || c.includes("전용면적") || c.includes("주거전용")),
      supply: cells.findIndex((c) => /모집할/.test(c) || /모집세대/.test(c)),
    };

    // 하위 헤더 행 (병합셀의 두 번째 줄) 가 있을 수 있어 데이터까지 진행
    for (let j = i + 1; j < lines.length && lines[j].startsWith("|"); j++) {
      const row = splitRow(lines[j]);
      if (row.every((c) => c === "---" || c === "")) continue;
      if (isHeaderLikeRow(row)) {
        // 하위 헤더 — area 인덱스가 헤더 키워드로 더 정확히 잡힐 수도 있음
        const areaIdx = row.findIndex((c) => c.includes("주거 전용") || c === "주거전용");
        if (areaIdx >= 0 && idx.area < 0) idx.area = areaIdx;
        continue;
      }
      // 데이터 행
      const type = idx.type >= 0 ? row[idx.type] : null;
      const area = idx.area >= 0 ? Number(row[idx.area]) : null;
      const supply = idx.supply >= 0 ? parseInt2(row[idx.supply]) : null;
      if (type && /^[\dA-Z]+$/i.test(type) && supply != null) {
        result.units.push({ type, area: Number.isFinite(area) ? area : null, supply });
      }
    }
    break; // 첫 표만 처리
  }

  // 통합 모집 표시 없고 행 단위 supply 있으면 합산
  if (result.supplyTotal == null && result.units.length > 0) {
    // 모든 행 supply 가 같으면 그게 통합 (LH 50년임대 패턴)
    const uniq = new Set(result.units.map((u) => u.supply));
    if (uniq.size === 1) {
      result.supplyTotal = result.units[0].supply;
      result.integrated = true;
    } else {
      result.supplyTotal = result.units.reduce((a, u) => a + u.supply, 0);
    }
  }

  return result;
}

// 임대조건 표 추출 — 단지명/주택형/임대보증금(계, 계약금, 잔금)/월임대료
// 표는 병합셀이 평탄화되며 같은 헤더 셀 ("임대보증금") 이 4번 반복되는 식.
// 데이터 행은 단지명/주택형/계/계약금/잔금/월임대료/전환한도/최대보증금/최대월세 순.
function parseRentTable(md) {
  const lines = md.split("\n");
  const result = []; // [{type, deposit, rent}]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("|")) continue;
    const cells = splitRow(line);
    // 헤더 식별: "임대보증금" + "월임대료" 동시 출현
    const hasDeposit = cells.some((c) => c.includes("임대보증금"));
    const hasRent = cells.some((c) => c.includes("월임대료"));
    if (!hasDeposit || !hasRent) continue;
    if (!cells.some((c) => c.includes("주택형"))) continue;

    // 하위 헤더 줄들 skip 하며 데이터 추출.
    // 컬럼 위치 — LH 패턴: 단지명(0), 주택형(1), 계(2), 계약금(3), 잔금(4), 월임대료(5)
    for (let j = i + 1; j < lines.length && lines[j].startsWith("|"); j++) {
      const row = splitRow(lines[j]);
      if (row.every((c) => c === "---" || c === "")) continue;
      if (isHeaderLikeRow(row)) continue;
      // 데이터 행: 단지명 / 주택형 / 보증금-계 / 계약금 / 잔금 / 월임대료 / ...
      if (row.length < 6) continue;
      const type = row[1];
      const deposit = parseInt2(row[2]);
      const rent = parseInt2(row[5]);
      if (type && /^[\dA-Z]+$/i.test(type) && deposit != null && rent != null) {
        result.push({ type, deposit, rent });
      }
    }
    break;
  }

  return result;
}

async function main() {
  await fs.mkdir(SUPPLY_DIR, { recursive: true });
  const listings = JSON.parse(await fs.readFile(LISTINGS_PATH, "utf8"));

  // active 한 매물만 (closed 도 데이터 보강 의미 있지만 우선 active)
  const targets = listings.filter((l) => {
    if (ONLY_ID && l.id !== ONLY_ID) return false;
    return l.status !== "closed";
  });

  let ok = 0, skip = 0, miss = 0, err = 0;
  const updates = [];

  for (let i = 0; i < Math.min(targets.length, LIMIT); i++) {
    const l = targets[i];
    const mdPath = path.join(TEXTS_DIR, `${l.id}.md`);
    try {
      await fs.access(mdPath);
    } catch {
      miss++;
      continue;
    }

    try {
      const md = await fs.readFile(mdPath, "utf8");
      const supply = parseSupplyTable(md);
      const rents = parseRentTable(md);

      // 어느 것도 못 뽑으면 skip
      if (supply.supplyTotal == null && rents.length === 0) {
        skip++;
        continue;
      }

      // 주택형별 결합 — supply 정보 (area, supply) + rent 정보 (deposit, rent).
      const byType = {};
      for (const u of supply.units) byType[u.type] = { type: u.type, area: u.area, supply: u.supply };
      for (const r of rents) byType[r.type] = { ...(byType[r.type] || { type: r.type }), deposit: r.deposit, rent: r.rent };
      const units = Object.values(byType);

      const detail = {
        id: l.id,
        supplyTotal: supply.supplyTotal,
        integrated: supply.integrated,
        units,
      };

      const outPath = path.join(SUPPLY_DIR, `${l.id}.json`);
      await fs.writeFile(outPath, JSON.stringify(detail, null, 2) + "\n", "utf8");

      // 최소 평형 기준 대표값 — LH 공고문 표시 관례 (가장 작은 평수의 임대조건이 기준선).
      const sorted = units
        .filter((u) => u.deposit != null && u.rent != null)
        .sort((a, b) => (a.area ?? Infinity) - (b.area ?? Infinity));
      const rep = sorted[0];
      const depositManwon = rep ? Math.round(rep.deposit / 10000) : null;
      const rentManwon = rep ? Math.round(rep.rent / 10000) : null;

      updates.push({
        id: l.id,
        supplyUnits: supply.supplyTotal,
        deposit: depositManwon,
        rent: rentManwon,
        units, // detail-panel 의 단지별 공급 정보 표용
      });
      ok++;
    } catch (e) {
      err++;
      console.error(`  ERR ${l.id}: ${e.message}`);
    }
  }

  // listings-api 보강 — markdown(PDF) 값이 ground truth. 기본은 빈 값만 채우되,
  // --force 면 기존 값 덮어씀 (정렬·파싱 로직 개선 시 재정정 위함).
  let patched = 0;
  for (const u of updates) {
    const item = listings.find((l) => l.id === u.id);
    if (!item) continue;
    let changed = false;
    if (u.supplyUnits != null && (FORCE || item.supplyUnits == null || item.supplyUnits === 1)) {
      if (item.supplyUnits !== u.supplyUnits) { item.supplyUnits = u.supplyUnits; changed = true; }
    }
    if (item.type !== "sale") {
      if (u.deposit != null && (FORCE || item.deposit == null || item.deposit === 0)) {
        if (item.deposit !== u.deposit) { item.deposit = u.deposit; changed = true; }
      }
      if (u.rent != null && (FORCE || item.rent == null || item.rent === 0)) {
        if (item.rent !== u.rent) { item.rent = u.rent; changed = true; }
      }
    }
    // complexes 비어있고 units 있으면 detail-panel 의 단지별 공급 정보 표용으로 채움.
    if ((!item.complexes || item.complexes.length === 0) && u.units && u.units.length > 0) {
      item.complexes = [{
        name: null,
        rows: u.units
          .slice()
          .sort((a, b) => (a.area ?? Infinity) - (b.area ?? Infinity))
          .map((un) => ({
            houseType: String(un.area ?? un.type),
            supplyTotal: un.supply ?? null,
            deposit: un.deposit ?? null,
            rent: un.rent ?? null,
          })),
      }];
      changed = true;
    }
    if (changed) patched++;
  }

  await fs.writeFile(LISTINGS_PATH, JSON.stringify(listings, null, 2) + "\n", "utf8");

  console.log(`\n완료: ok=${ok} patched=${patched} skip=${skip} miss=${miss} err=${err} / 대상 ${targets.length}건`);
}

main().catch((e) => { console.error(e); process.exit(1); });
