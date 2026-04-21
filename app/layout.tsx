import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "보금 · 공공임대주택 정보",
  description: "행복주택·국민임대·통합공공임대 공고를 한눈에",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
