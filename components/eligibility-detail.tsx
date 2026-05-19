"use client";

// 디테일 패널의 "입주 자격" 섹션 — 구조화 자격 데이터 기반 풍부한 UI.
// /api/eligibility/{listingId} 에서 lazy fetch.
// 시안: 계층 탭 / 연령·혼인·월소득·자산 카드 / 기타 / 우선공급 / CTA.

import { useEffect, useState } from "react";

type Tier = {
  id: string;
  name: string;
  units?: number | null;
  age?: string | null;
  marriage?: string | null;
  income?: {
    percent?: number | null;
    byHousehold?: Record<string, number | null> | null;
    note?: string | null;
  } | null;
  asset?: { total?: number | null; car?: number | null } | null;
  other?: string[];
};

type EligibilityData = {
  supplyTotal?: number | null;
  tiers: Tier[];
  priority?: string[];
};

function formatManwon(v: number | null | undefined): string | null {
  if (v == null || !Number.isFinite(v)) return null;
  // 1억 = 10000 만원
  if (v >= 10000) {
    const eok = Math.floor(v / 10000);
    const man = v % 10000;
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
  }
  return `${v.toLocaleString()}만원`;
}

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M 8 5 V 8 L 10.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconRing() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="10" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M 6 6 L 8 3 L 10 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCoin() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M 8 5 V 11 M 6 7.5 H 9 a 1 1 0 0 1 0 2 H 7 a 1 1 0 0 0 0 2 H 10" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M 2 8 L 8 3 L 14 8 V 13 H 2 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M 5 8 L 7 10 L 11 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M 8 2 L 10 6.4 L 14.5 7 L 11.2 10.2 L 12 14.5 L 8 12.3 L 4 14.5 L 4.8 10.2 L 1.5 7 L 6 6.4 Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function IncomeTable({ income }: { income: NonNullable<Tier["income"]> }) {
  if (!income.byHousehold) return null;
  const entries = Object.entries(income.byHousehold)
    .filter(([, v]) => v != null)
    .sort((a, b) => Number(a[0]) - Number(b[0]));
  if (!entries.length) return null;
  return (
    <div className="eli-income-grid">
      {entries.map(([k, v]) => (
        <div key={k} className="eli-income-cell">
          <div className="eli-income-key">{k}인</div>
          <div className="eli-income-val">{v!.toLocaleString()}만</div>
        </div>
      ))}
    </div>
  );
}

function OtherList({ items }: { items: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const VISIBLE = 3;
  const showAll = expanded || items.length <= VISIBLE;
  const visibleItems = showAll ? items : items.slice(0, VISIBLE);
  const hidden = items.length - VISIBLE;
  return (
    <>
      <ul className="eli-other-list">
        {visibleItems.map((o, i) => <li key={i}>{o}</li>)}
      </ul>
      {!showAll && (
        <button type="button" className="eli-more-btn" onClick={() => setExpanded(true)}>
          +{hidden}개 더 보기
        </button>
      )}
    </>
  );
}

function TierBody({ tier }: { tier: Tier }) {
  const rows: { icon: React.ReactNode; label: string; content: React.ReactNode }[] = [];
  if (tier.age) rows.push({ icon: <IconClock />, label: "연령", content: tier.age });
  if (tier.marriage) rows.push({ icon: <IconRing />, label: "혼인", content: tier.marriage });
  if (tier.income) {
    rows.push({
      icon: <IconCoin />,
      label: "월 소득",
      content: (
        <>
          {tier.income.percent != null && (
            <div className="eli-row-headline">
              중위소득 <strong>{tier.income.percent}%</strong> 이하
            </div>
          )}
          <IncomeTable income={tier.income} />
          {tier.income.note && <div className="eli-row-note">💡 {tier.income.note}</div>}
        </>
      ),
    });
  }
  if (tier.asset && (tier.asset.total != null || tier.asset.car != null)) {
    rows.push({
      icon: <IconHome />,
      label: "자산",
      content: (
        <div className="eli-asset-list">
          {tier.asset.total != null && <div>총자산 <strong>{formatManwon(tier.asset.total)}</strong> 이하</div>}
          {tier.asset.car != null && <div>자동차 <strong>{formatManwon(tier.asset.car)}</strong> 이하</div>}
        </div>
      ),
    });
  }
  if (tier.other?.length) {
    rows.push({
      icon: <IconCheck />,
      label: "기타",
      content: <OtherList items={tier.other} />,
    });
  }
  if (!rows.length) {
    return <div className="eli-empty">이 계층의 세부 자격은 공고문을 확인해 주세요.</div>;
  }
  return (
    <div className="eli-rows">
      {rows.map((r, i) => (
        <div key={i} className="eli-row">
          <div className="eli-row-icon" aria-hidden>{r.icon}</div>
          <div className="eli-row-label">{r.label}</div>
          <div className="eli-row-content">{r.content}</div>
        </div>
      ))}
    </div>
  );
}

export function EligibilityDetail({ listingId, sourceUrl }: { listingId: string; sourceUrl?: string }) {
  const [data, setData] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTierIdx, setActiveTierIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setActiveTierIdx(0);
    fetch(`/api/eligibility/${encodeURIComponent(listingId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled) setData(j?.data ?? null); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [listingId]);

  if (loading) {
    return (
      <div className="eli-detail">
        <div className="eli-skeleton" />
        <div className="eli-skeleton" />
        <div className="eli-skeleton" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="eli-detail">
        <div className="eli-empty">
          <div className="eli-empty-title">자격 정보를 정리하고 있어요</div>
          <div className="eli-empty-sub">
            정확한 자격은 LH 공고문을 확인해 주세요.
          </div>
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="eli-empty-link">
              공고문 보기 →
            </a>
          )}
        </div>
      </div>
    );
  }

  // 데이터 정리:
  // 1) units=0/null + 모든 자격필드 비어있는 tier 는 제외 (Solar 가 의미없이 채운 케이스)
  // 2) name 중복 dedupe (첫 번째 우선)
  const allTiers = data.tiers ?? [];
  const seenNames = new Set<string>();
  const tiers = allTiers.filter((t) => {
    if (seenNames.has(t.name)) return false;
    seenNames.add(t.name);
    const hasUnits = typeof t.units === "number" && t.units > 0;
    const hasDetail =
      Boolean(t.age) || Boolean(t.marriage) ||
      Boolean(t.income?.percent) || Boolean(t.income?.byHousehold) || Boolean(t.income?.note) ||
      Boolean(t.asset?.total) || Boolean(t.asset?.car) ||
      (t.other?.length ?? 0) > 0;
    return hasUnits || hasDetail;
  });
  const activeTier = tiers[activeTierIdx] ?? tiers[0];

  return (
    <div className="eli-detail">
      {/* 계층 탭 — 2개 이상일 때만 노출. 1개 매물은 탭 자체가 의미 없음. */}
      {tiers.length > 1 && (
        <div className="eli-tabs" role="tablist">
          {tiers.map((t, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeTierIdx}
              className={`eli-tab ${i === activeTierIdx ? "on" : ""}`}
              onClick={() => setActiveTierIdx(i)}
            >
              <div className="eli-tab-name">{t.name}</div>
              {typeof t.units === "number" && t.units > 0 && <div className="eli-tab-units">{t.units}</div>}
            </button>
          ))}
        </div>
      )}

      {/* 활성 계층 본문 */}
      {activeTier && <TierBody tier={activeTier} />}

      {/* 우선공급 대상 */}
      {data.priority && data.priority.length > 0 && (
        <div className="eli-priority">
          <div className="eli-priority-title"><IconStar /> 우선공급 대상이면 가점이 있어요</div>
          <div className="eli-priority-chips">
            {data.priority.map((p, i) => (
              <span key={i} className="eli-priority-chip">{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* CTA — 자가 진단 흐름 (TODO: 사용자 프로필 입력 모달) */}
      <button
        type="button"
        className="eli-cta"
        onClick={() => alert("자격 자가진단 — 준비 중입니다. 곧 만나요 :)")}
      >
        <div className="eli-cta-spark" aria-hidden>✨</div>
        <div className="eli-cta-text">
          <div className="eli-cta-title">내 조건으로 자격 확인하기</div>
          <div className="eli-cta-sub">30초만에 둥지가 확인해드려요</div>
        </div>
        <div className="eli-cta-arrow">›</div>
      </button>
    </div>
  );
}
