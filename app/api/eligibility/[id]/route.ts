// GET /api/eligibility/{listingId} — 매물별 구조화 자격 정보 반환.
// detail panel 의 EligibilityDetail 컴포넌트가 lazy fetch.

import { NextResponse } from "next/server";
import { getEligibility } from "@/lib/notice-eligibility";

export const runtime = "nodejs"; // fs 사용

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = getEligibility(id);
  if (!data) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data });
}
