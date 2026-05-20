import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "둥지 · 공공임대주택 정보",
  description: "행복주택·국민임대·통합공공임대 공고를 한눈에",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Material Symbols Rounded — 자격 row 아이콘 등에 사용. icon_names 로 subset 만 로드. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,0,0&icon_names=schedule,favorite,payments,savings,check_circle,star"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
