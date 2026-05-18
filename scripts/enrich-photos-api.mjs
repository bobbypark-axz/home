// lib/listings-api.json 의 각 listing 에 대해 LH 페이지에서 단지 이미지 추출 → 다운로드
//   - 우선순위: 단지조감도 > 지역조감도 > 첫 평면도 이미지
//   - 다운로드 결과: public/lh-covers/{id}.jpg
//   - listings-api.json 의 coverPhotoLocal/coverPhotoUrl 갱신
//
// 이미 coverPhotoLocal 이 있으면 건너뜀.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "lib/listings-api.json");
const OUT_DIR = path.join(ROOT, "public/lh-covers");
const ENV_PATH = path.join(ROOT, ".env.local");

try {
  const txt = fs.readFileSync(ENV_PATH, "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 doongji-app/1.0";
const LH_BASE = "https://apply.lh.or.kr";
const DELAY_MS = 500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// HTML 안에서 LH 의 이미지 경로 추출.
// 우선순위:
//   1) "지역조감도"/"단지조감도" 가까이 있는 cmnAhflSn → URL 변환
//   2) fpImage1X src (첫 평면도)
//   3) /upload/Files/.../*.{png,jpg} 첫 매칭
function extractImageUrls(html) {
  const out = [];

  // 1) wrtancFloorplan JSON 안에서 cmnAhflPth + cmnPhyAhflNm 추출 (평면도)
  const fpMatch = html.match(/var\s+wrtancFloorplan\s*=\s*JSON\.parse\('([\s\S]*?)'\)/);
  if (fpMatch) {
    try {
      const data = JSON.parse(fpMatch[1]);
      // 다차원 배열 — 첫 단지의 첫 주택형 이미지
      for (const tab of data) {
        if (!Array.isArray(tab) || !tab.length) continue;
        const first = tab[0];
        if (first?.cmnAhflPth && first?.cmnPhyAhflNm) {
          const u = LH_BASE + first.cmnAhflPth.replace(/^\/Files/, "/upload/Files") + first.cmnPhyAhflNm;
          out.push({ url: u, kind: "평면도" });
        }
      }
    } catch {}
  }

  // 2) onchangeImageTab 의 cmnPhyAhflNm 추출 (단지조감도/지역조감도)
  const tabRe = /cmnPhyAhflNm\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = tabRe.exec(html))) {
    const fname = m[1];
    // 경로 — 추정: /upload/Files/upload_dec/{YYYY}/LSE/{MM}/{DD}/{filename}
    const ym = fname.match(/^(\d{4})(\d{2})(\d{2})\d+\.(png|jpg|jpeg)$/i);
    if (ym) {
      const u = `${LH_BASE}/upload/Files/upload_dec/${ym[1]}/LSE/${ym[2]}/${ym[3]}/${fname}`;
      out.push({ url: u, kind: "조감도" });
    }
  }

  // 3) 직접 /upload/Files/ 경로 매칭 (백업)
  const directRe = /\/upload\/Files\/[^"'\s)]+?\.(png|jpe?g)/gi;
  while ((m = directRe.exec(html))) {
    const u = LH_BASE + m[0];
    out.push({ url: u, kind: "img" });
  }

  // 중복 제거
  const seen = new Set();
  const unique = [];
  for (const x of out) {
    if (seen.has(x.url)) continue;
    seen.add(x.url);
    unique.push(x);
  }

  // 노이즈 제외 (noimg.png, common 이미지)
  return unique.filter((x) => !/noimg|common\/|_common\//i.test(x.url));
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Referer: LH_BASE + "/" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error("too small (likely error page)");
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

async function main() {
  const listings = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const targets = listings.filter((l) => !l.coverPhotoLocal && l.sourceUrl && l.sourceUrl.includes("selectWrtancInfo.do"));
  console.log(`target listings: ${targets.length} / total ${listings.length}`);

  let ok = 0, noImg = 0, fail = 0;
  for (const [i, l] of targets.entries()) {
    const prefix = `[${i + 1}/${targets.length}] ${l.id}`;
    try {
      const res = await fetch(l.sourceUrl, { headers: { "User-Agent": UA } });
      if (!res.ok) { fail++; console.warn(`${prefix} HTTP ${res.status}`); await sleep(DELAY_MS); continue; }
      const html = await res.text();
      const imgs = extractImageUrls(html);
      if (!imgs.length) { noImg++; await sleep(DELAY_MS); continue; }

      // 우선순위: 조감도 > 평면도 > img
      const ordered = [
        ...imgs.filter((x) => x.kind === "조감도"),
        ...imgs.filter((x) => x.kind === "평면도"),
        ...imgs.filter((x) => x.kind === "img"),
      ];

      let saved = false;
      for (const cand of ordered) {
        const ext = (cand.url.match(/\.(png|jpe?g)$/i) || ["", "jpg"])[1].toLowerCase();
        const fn = `${l.id}.${ext === "jpeg" ? "jpg" : ext}`;
        const dest = path.join(OUT_DIR, fn);
        try {
          await downloadImage(cand.url, dest);
          l.coverPhotoLocal = `/lh-covers/${fn}`;
          l.coverPhotoUrl = cand.url;
          saved = true;
          ok++;
          if (ok % 20 === 0) console.log(`${prefix} ✓ ${cand.kind}`);
          break;
        } catch {
          // 다음 후보
        }
        await sleep(150);
      }
      if (!saved) { fail++; }
    } catch (e) {
      fail++;
      if (fail < 5) console.warn(`${prefix} error: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(listings, null, 2));
  console.log("---");
  console.log({ ok, noImg, fail, total: targets.length });
  console.log(`saved → ${DATA_PATH}`);
  console.log(`images → ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
