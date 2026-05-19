"use client";

// AI 챗 메시지 하단에 끼워 넣는 추천 매물 가로 캐러셀.
// 1단계: 디자인 확정 — 더미 데이터 prop 으로 받음. 백엔드 tool calling 은 2단계.

import { useRouter } from "next/navigation";
import type { Listing } from "@/lib/types";
import { HOUSING_TYPES } from "@/lib/mock-data";
import { dDayText, effectiveStatus } from "@/lib/dday";
import { thumbnailSVG } from "@/lib/svg";

function rankLabel(idx: number): string {
  return `${idx + 1}순위`;
}

export type CarouselItem = { listing: Listing; reasons: string[] };

function CarouselCard({ item: { listing: item, reasons }, rank }: { item: CarouselItem; rank: number }) {
  const router = useRouter();
  const housing = HOUSING_TYPES.find((t) => t.id === item.type);
  const effStatus = effectiveStatus(item.status, item.deadline, item.beginDate);
  const dday = dDayText(item.deadline, item.status);
  const svg = thumbnailSVG(item.thumbSeed, item.type);

  const priceText =
    item.type === "sale" && item.salePriceManwon && item.salePriceManwon > 0
      ? (() => {
          const eok = Math.floor(item.salePriceManwon / 10000);
          const man = item.salePriceManwon % 10000;
          return `분양가 ${eok > 0 ? `${eok}억 ` : ""}${man > 0 ? `${man.toLocaleString()}만` : ""}`.trim();
        })()
      : item.deposit > 0 || item.rent > 0
        ? `보 ${item.deposit.toLocaleString()}만 · 월 ${item.rent}만`
        : "임대조건 공고문 확인";

  return (
    <article
      className="chat-rec-card"
      onClick={() => router.push(`/listings/${item.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="chat-rec-thumb">
        {item.coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverPhotoUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="chat-rec-thumb-svg" dangerouslySetInnerHTML={{ __html: svg }} />
        )}
        <span className="chat-rec-rank">{rankLabel(rank)}</span>
        <button
          type="button"
          className="chat-rec-heart"
          aria-label="관심 매물에 저장"
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path
              d="M 10 17 C 10 17 3 12 3 7.5 C 3 5 5 3 7.5 3 C 8.8 3 10 4 10 4 C 10 4 11.2 3 12.5 3 C 15 3 17 5 17 7.5 C 17 12 10 17 10 17 Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
        {dday && <span className={`chat-rec-dday ${effStatus}`}>{dday}</span>}
      </div>
      <div className="chat-rec-body">
        <div className="chat-rec-tags">
          {housing && <span className={`badge ${housing.badge}`}>{housing.name}</span>}
          <span className="badge agency">{item.agency}</span>
          {item.competition != null && (
            <span className="chat-rec-competition">경쟁률 {item.competition}:1</span>
          )}
        </div>
        <div className="chat-rec-title">{item.title}</div>
        <div className="chat-rec-price">{priceText}</div>
        <div className="chat-rec-meta">
          {item.area && <>{item.area}<span className="dot">·</span></>}
          {item.district}
        </div>
        {reasons.length > 0 && (
          <div className="chat-rec-reasons" aria-label="추천 이유">
            <div className="chat-rec-reasons-title">
              <span className="chat-rec-reasons-check" aria-hidden>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M 2 5 L 4.2 7 L 8 3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              둥지가 선택한 이유
            </div>
            <div className="chat-rec-reasons-chips">
              {reasons.map((r, i) => (
                <span key={i} className="chat-rec-reason-chip">{r}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export function ChatListingCarousel({ items }: { items: CarouselItem[] }) {
  if (!items.length) return null;
  return (
    <div className="chat-rec-carousel" role="region" aria-label="AI 추천 매물">
      {items.map((it, idx) => (
        <CarouselCard key={it.listing.id} item={it} rank={idx} />
      ))}
    </div>
  );
}
