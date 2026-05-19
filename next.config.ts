import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "apply.lh.or.kr",
        pathname: "/lhapply/lhFile.do",
      },
      {
        protocol: "https",
        hostname: "www.kohom.or.kr",
      },
    ],
  },
  // 서버 함수 번들 size 줄이기 — pdf-parse / sharp 등은 sync 스크립트 전용,
  // 런타임 함수 (api/*) 와 무관. 데이터 디렉토리도 동적 require 만이라 명시적 제외.
  outputFileTracingExcludes: {
    "/api/chat": [
      "node_modules/pdf-parse/**/*",
      "node_modules/sharp/**/*",
      "node_modules/@swc/**/*",
      "node_modules/@esbuild/**/*",
      "node_modules/typescript/**/*",
      "lib/notice-texts/**/*",
      "lib/notice-embeddings/vectors.bin",
      "public/lh-covers/**/*",
      "scripts/**/*",
      ".next/cache/**/*",
    ],
    "/api/eligibility/**": [
      "node_modules/pdf-parse/**/*",
      "node_modules/sharp/**/*",
      "node_modules/@swc/**/*",
      "node_modules/@esbuild/**/*",
      "lib/notice-texts/**/*",
      "lib/notice-embeddings/**/*",
      "public/lh-covers/**/*",
      "scripts/**/*",
    ],
    "*": [
      "node_modules/pdf-parse/**/*",
      "node_modules/sharp/**/*",
      "lib/notice-texts/**/*",
      "public/lh-covers/**/*",
      "scripts/**/*",
    ],
  },
};

export default nextConfig;
