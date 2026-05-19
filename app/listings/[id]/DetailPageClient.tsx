"use client";

import { useRouter } from "next/navigation";
import type { Listing } from "@/lib/types";
import { DetailPanel } from "@/components/detail-panel";

// 모바일 viewport 에서 매물 카드 클릭 시 도착하는 풀스크린 디테일 페이지.
// DetailPanel 자체를 그대로 재사용 — .detail-fullpage 래퍼가 풀높이 컨테이너 역할.
export function DetailPageClient({ item }: { item: Listing }) {
  const router = useRouter();
  return (
    <div className="detail-fullpage">
      <DetailPanel item={item} open={true} onClose={() => router.back()} />
    </div>
  );
}
