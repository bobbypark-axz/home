// 임시 디버그용 — BizRouter 모델 목록 확인 후 삭제 예정
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseURL = process.env.BIZROUTER_BASE_URL ?? "https://api.bizrouter.ai/v1";
  const key = process.env.BIZROUTER_API_KEY;
  if (!key) return NextResponse.json({ error: "no key" }, { status: 500 });
  const r = await fetch(`${baseURL}/models`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await r.text();
  return new NextResponse(body, {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
