"use client";

import { useEffect, useRef, useState } from "react";
import type { Listing, SortKey } from "@/lib/types";
import { eligibilitySummaryByType, HOUSING_TYPES } from "@/lib/mock-data";
import { dDayText, effectiveStatus } from "@/lib/dday";

function typeBadge(type: Listing["type"]) {
  const t = HOUSING_TYPES.find((x) => x.id === type);
  if (!t) return null;
  return <span className={`badge ${t.badge}`}>{t.name}</span>;
}

function priceText(item: Listing) {
  if (item.type === "sale") {
    if (item.salePriceManwon && item.salePriceManwon > 0) {
      const eok = Math.floor(item.salePriceManwon / 10000);
      const man = item.salePriceManwon % 10000;
      return (
        <strong>
          분양가 {eok > 0 ? `${eok}억 ` : ""}
          {man > 0 ? `${man.toLocaleString()}만` : eok > 0 ? "" : "—"}
        </strong>
      );
    }
    return <span style={{ color: "var(--seed-semantic-color-ink-text-low)" }}>분양가 공고문 확인</span>;
  }
  if (item.deposit > 0 || item.rent > 0) {
    return (
      <>
        <strong>보증금 {item.deposit.toLocaleString()}만</strong>
        <span className="sep">·</span>
        <span>월세 {item.rent}만</span>
      </>
    );
  }
  return <span style={{ color: "var(--seed-semantic-color-ink-text-low)" }}>임대조건 공고문 확인</span>;
}

function ListingCard({
  item,
  hovered,
  selected,
  onHover,
  onClick,
}: {
  item: Listing;
  hovered: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) {
  const photo = item.coverPhotoUrl;
  const effStatus = effectiveStatus(item.status, item.deadline, item.beginDate);
  // dDayText 가 raw status 기반이라 effStatus 로 보정된 매물에선 잘못된 라벨 반환 — effStatus 로 호출.
  const dday = dDayText(item.deadline, effStatus);
  // statusLabel — effStatus 우선. raw status 가 "open" 이지만 마감 지났으면 effStatus=closed → "마감".
  const statusLabel =
    effStatus === "closed" ? "마감"
    : effStatus === "closing" ? (dday || "마감임박")
    : effStatus === "upcoming" ? "모집 예정"
    : (dday || "수시모집");
  return (
    <article
      className={`card ${hovered ? "hovered" : ""} ${selected ? "selected" : ""}`}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(item.id)}
    >
      <div className="card-body">
        <div className="card-type-row">
          {typeBadge(item.type)}
          <span className="badge agency">{item.agency}</span>
        </div>
        <div className="card-title">{item.title}</div>
        <div className="card-price">{priceText(item)}</div>
        <div className="card-meta">
          {item.area && (
            <>
              {item.area}
              <span className="dot">·</span>
            </>
          )}
          {item.district}
          {typeof item.supplyUnits === "number" && item.supplyUnits > 0 && (
            <>
              <span className="dot">·</span>
              모집 {item.supplyUnits}세대
            </>
          )}
        </div>
        <div className="card-foot">
          <span className="eligibility">{eligibilitySummaryByType(item.type)}</span>
          {item.competition != null && (
            <>
              <span style={{ color: "var(--seed-scale-color-gray-400)" }}>·</span>
              <span>전년 경쟁률 {item.competition}:1</span>
            </>
          )}
        </div>
      </div>
      <aside className="card-side">
        {statusLabel && <span className={`status-chip ${effStatus}`}>{statusLabel}</span>}
        {photo && (
          <div className="card-thumb">
            {/* next/image 가 mtime 변경된 파일을 인식 못해 옛 조감도가 캐시돼서 보이는 문제. detail 과 통일. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={item.title}
              width={72}
              height={72}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </aside>
    </article>
  );
}

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "recent", label: "최신순" },
  { id: "deadline", label: "마감임박" },
  { id: "low-rent", label: "월세 낮은순" },
  { id: "low-depo", label: "보증금 낮은순" },
];

// 모바일 바텀시트 — 핸들 탭으로 peek ↔ expanded 토글
type SheetSnap = "peek" | "expanded";

export function ListingPanel({
  items,
  sort,
  setSort,
  hoveredId,
  selectedId,
  activeDistrict,
  onHover,
  onSelect,
}: {
  items: Listing[];
  sort: SortKey;
  setSort: (s: SortKey) => void;
  hoveredId: string | null;
  selectedId: string | null;
  activeDistrict: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const [loadedCount, setLoadedCount] = useState(15);
  const itemsRef = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState<SheetSnap>("peek");

  const toggleSnap = () => setSnap((s) => (s === "peek" ? "expanded" : "peek"));

  useEffect(() => {
    setLoadedCount(15);
    if (itemsRef.current) itemsRef.current.scrollTop = 0;
  }, [items.length, activeDistrict]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      setLoadedCount((c) => Math.min(c + 10, items.length));
    }
  };

  const visible = items.slice(0, loadedCount);

  return (
    <div className={`listing sheet-${snap}`} data-snap={snap}>
      <button
        type="button"
        className="listing-handle"
        onClick={toggleSnap}
        aria-label={snap === "peek" ? "매물 목록 펼치기" : "매물 목록 접기"}
        aria-expanded={snap === "expanded"}
      />
      <div className="listing-head">
        <div className="listing-count">
          총 <em>{items.length.toLocaleString()}</em>개의 공공임대 매물
        </div>
        <div className="listing-sort">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={`sort-chip ${sort === opt.id ? "active" : ""}`}
              onClick={() => setSort(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="listing-items" ref={itemsRef} onScroll={handleScroll}>
        {visible.length === 0 && (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--seed-semantic-color-ink-text-low)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>조건에 맞는 매물이 없어요</div>
            <div style={{ fontSize: 12 }}>필터를 조정하거나 지도에서 다른 구를 눌러보세요.</div>
          </div>
        )}
        {visible.map((item) => (
          <ListingCard
            key={item.id}
            item={item}
            hovered={hoveredId === item.id}
            selected={selectedId === item.id}
            onHover={onHover}
            onClick={onSelect}
          />
        ))}
        {loadedCount < items.length && (
          <div className="scroll-sentinel">
            <div
              className="spinner"
              style={{
                width: 20,
                height: 20,
                margin: "0 auto 8px",
                border: "2px solid var(--seed-scale-color-gray-200)",
                borderTopColor: "var(--seed-semantic-color-primary)",
                borderRadius: "50%",
                animation: "spin .8s linear infinite",
              }}
            />
            더 불러오는 중…
          </div>
        )}
        {loadedCount >= items.length && items.length > 0 && (
          <div className="scroll-sentinel">· 모든 매물을 확인했어요 ·</div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
