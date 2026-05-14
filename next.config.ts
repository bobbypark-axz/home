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
};

export default nextConfig;
