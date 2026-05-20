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
        {/* Material Symbols Rounded — variable axis 는 range 로 명시해야 폰트 로드됨.
           실제 사용 값은 .eli-icon 의 font-variation-settings 로 결정.
           display=block 으로 폰트 로드 전 ligature 텍스트("schedule" 등) 노출 방지. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=schedule,favorite,payments,savings,check_circle,star&display=block"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
