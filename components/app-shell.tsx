"use client";

import { useEffect, useMemo, useState } from "react";
import type { Density, Filters, HousingTypeId, SortKey, ViewMode } from "@/lib/types";
import { DISTRICTS, LISTINGS } from "@/lib/mock-data";
import { FilterBar } from "./filter-bar";
import { ListingPanel } from "./listing-panel";
import { KakaoMapView } from "./kakao-map";
import { DetailPanel } from "./detail-panel";
import { EligibilityModal } from "./eligibility-modal";
import { TweaksPanel } from "./tweaks-panel";
import { ChevronIcon, ListIcon, MapIcon, PinIcon } from "./icons";

const INITIAL_FILTERS: Filters = {
  type: [],
  status: [],
  transit: [],
  eligibility: [],
  timing: [],
};

export function AppShell() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [sort, setSort] = useState<SortKey>("deadline");
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [eliOpen, setEliOpen] = useState(false);
  const [mode, setMode] = useState<ViewMode>("split");
  const [density, setDensity] = useState<Density>("comfort");
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    void density;
  }, [density]);

  const filtered = useMemo(() => {
    let list = LISTINGS.slice();
    if (filters.type.length) list = list.filter((x) => filters.type.includes(x.type));
    if (filters.status.length) list = list.filter((x) => filters.status.includes(x.status));
    if (filters.transit.length) {
      list = list.filter((x) =>
        filters.transit.some((t) => x.features.includes(t) || x.transit.includes(t === "역세권" ? "도보" : "버스")),
      );
    }
    if (filters.eligibility.length) {
      list = list.filter((x) => x.eligible.some((e) => filters.eligibility.includes(e)));
    }
    if (activeDistrict) list = list.filter((x) => x.districtId === activeDistrict);

    if (sort === "deadline") {
      list.sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));
    } else if (sort === "low-rent") {
      list.sort((a, b) => a.rent - b.rent);
    } else if (sort === "low-depo") {
      list.sort((a, b) => a.deposit - b.deposit);
    } else {
      list.sort((a, b) => a.id.localeCompare(b.id));
    }
    return list;
  }, [filters, sort, activeDistrict]);

  const districtCounts = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    let list = LISTINGS.slice();
    if (filters.type.length) list = list.filter((x) => filters.type.includes(x.type));
    if (filters.status.length) list = list.filter((x) => filters.status.includes(x.status));
    if (filters.eligibility.length) list = list.filter((x) => x.eligible.some((e) => filters.eligibility.includes(e)));
    list.forEach((x) => {
      map[x.districtId] = (map[x.districtId] ?? 0) + (x.districtId === "gangseo" ? 8 : x.districtId === "songpa" ? 10 : 6) + 1;
    });
    DISTRICTS.forEach((d) => {
      if (!map[d.id]) map[d.id] = 0;
      if (map[d.id] > 0) map[d.id] = Math.max(map[d.id], Math.round(d.count * 0.5));
      else if (filters.type.length === 0 && filters.status.length === 0 && filters.eligibility.length === 0) {
        map[d.id] = d.count;
      }
    });
    return map;
  }, [filters]);

  const resetFilters = () => setFilters(INITIAL_FILTERS);

  const selectedItem = filtered.find((x) => x.id === selectedId) ?? LISTINGS.find((x) => x.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">보</div>
          <span className="brand-name">보금</span>
          <span className="brand-gov">공공임대</span>
        </div>
        <button className="region-btn">
          <PinIcon size={13} />
          서울특별시 전체
          <ChevronIcon size={9} />
        </button>
        <div className="topbar-spacer" />
        <button className="topbar-cta" onClick={() => setEliOpen(true)}>
          <span className="dot" /> 내 자격 확인
        </button>
        <div className="topbar-auth">
          <button className="ghost">내 청약 내역</button>
          <button className="ghost">관심 목록</button>
          <button className="primary">로그인 / 회원가입</button>
          <button className="ghost" onClick={() => setTweaksOpen((v) => !v)} aria-label="tweaks">
            ⚙
          </button>
        </div>
      </header>

      <FilterBar filters={filters} setFilters={setFilters} onReset={resetFilters} />

      <div className={`main ${mode === "list" ? "list-mode" : ""}`}>
        <ListingPanel
          items={filtered}
          sort={sort}
          setSort={setSort}
          hoveredId={hoveredId}
          selectedId={selectedId}
          activeDistrict={activeDistrict}
          onHover={setHoveredId}
          onSelect={handleSelect}
        />

        {mode === "split" && (
          <KakaoMapView
            districtCounts={districtCounts}
            activeDistrict={activeDistrict}
            onDistrictClick={(id) => setActiveDistrict(id)}
            onDistrictClear={() => setActiveDistrict(null)}
            pins={filtered}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onPinHover={setHoveredId}
            onPinClick={handleSelect}
            showLegend={showLegend}
          />
        )}

        <DetailPanel item={selectedItem} open={detailOpen} onClose={() => setDetailOpen(false)} />

        {mode === "split" && (
          <div className="mode-toggle">
            <button className={mode === "split" ? "active" : ""} onClick={() => setMode("split")}>
              <MapIcon size={13} /> 지도
            </button>
            <button
              className={(mode as ViewMode) === "list" ? "active" : ""}
              onClick={() => setMode("list")}
            >
              <ListIcon size={13} /> 리스트
            </button>
          </div>
        )}
        {mode === "list" && (
          <button
            onClick={() => setMode("split")}
            style={{
              position: "fixed",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(33,33,36,.92)",
              color: "white",
              padding: "10px 18px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              zIndex: 10,
              boxShadow: "0 6px 20px rgba(0,0,0,.2)",
            }}
          >
            <MapIcon size={13} /> 지도로 보기
          </button>
        )}
      </div>

      <EligibilityModal
        open={eliOpen}
        onClose={() => setEliOpen(false)}
        onApplyFilter={(types: HousingTypeId[]) => setFilters({ ...filters, type: types })}
      />

      <TweaksPanel
        open={tweaksOpen}
        mode={mode}
        setMode={setMode}
        density={density}
        setDensity={setDensity}
        showLegend={showLegend}
        setShowLegend={setShowLegend}
      />
    </div>
  );
}
