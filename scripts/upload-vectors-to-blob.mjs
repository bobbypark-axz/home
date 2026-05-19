#!/usr/bin/env node
// lib/notice-embeddings/vectors.bin → Vercel Blob.
// 결과 URL 을 lib/blob-vectors.json 에 저장 → notice-search.ts 가 runtime 에 fetch.
//
// 사용: node --env-file=.env.local scripts/upload-vectors-to-blob.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const VEC_PATH = path.join(ROOT, "lib/notice-embeddings/vectors.bin");
const OUT_PATH = path.join(ROOT, "lib/blob-vectors.json");

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!TOKEN) { console.error("ERROR: BLOB_READ_WRITE_TOKEN 누락"); process.exit(1); }

const buf = await fs.readFile(VEC_PATH);
const sizeMB = (buf.length / 1024 / 1024).toFixed(1);
console.log(`업로드 시작: ${sizeMB} MB`);
const t0 = Date.now();

// 같은 파일명 유지 — 매번 재업로드 시 동일 경로 (allowOverwrite)
const blob = await put("notice-embeddings/vectors.bin", buf, {
  access: "public",
  token: TOKEN,
  contentType: "application/octet-stream",
  addRandomSuffix: false,
  allowOverwrite: true,
});

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`완료: ${elapsed}s → ${blob.url}`);

await fs.writeFile(
  OUT_PATH,
  JSON.stringify({ url: blob.url, bytes: buf.length, uploadedAt: new Date().toISOString() }, null, 2) + "\n",
);
console.log(`저장: ${OUT_PATH}`);
