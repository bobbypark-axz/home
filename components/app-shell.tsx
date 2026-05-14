"use client";

import { useEffect, useMemo, useState } from "react";
import type { Density, Filters, HousingTypeId, SortKey, ViewMode } from "@/lib/types";
import { DISTRICTS, LISTINGS } from "@/lib/mock-data";
import { FilterBar } from "./filter-bar";
import { ListingPanel } from "./listing-panel";
import { NaverMapView } from "./kakao-map";
import { DetailPanel } from "./detail-panel";
import { EligibilityModal } from "./eligibility-modal";
import { TweaksPanel } from "./tweaks-panel";
import { ChevronIcon, ListIcon, MapIcon, PinIcon } from "./icons";

const INITIAL_FILTERS: Filters = {
  type: [],
  status: [],
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
    // 마감된 공고는 기본적으로 숨김 — 마감 필터를 명시적으로 켰을 때만 노출
    const showClosed = filters.status.includes("closed");
    let list = LISTINGS.slice();
    if (!showClosed) list = list.filter((x) => x.status !== "closed");
    if (filters.type.length) list = list.filter((x) => filters.type.includes(x.type));
    if (filters.status.length) list = list.filter((x) => filters.status.includes(x.status));
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
    const showClosed = filters.status.includes("closed");
    let list = LISTINGS.slice();
    if (!showClosed) list = list.filter((x) => x.status !== "closed");
    if (filters.type.length) list = list.filter((x) => filters.type.includes(x.type));
    if (filters.status.length) list = list.filter((x) => filters.status.includes(x.status));
    list.forEach((x) => {
      map[x.districtId] = (map[x.districtId] ?? 0) + 1;
    });
    DISTRICTS.forEach((d) => {
      if (!map[d.id]) map[d.id] = 0;
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
          <span className="brand-name">둥지</span>
          <button className="brand-ai-cta" onClick={() => setEliOpen(true)}>
            <span className="ai-spark" aria-hidden>✨</span>
            AI로 조건 찾기
          </button>
        </div>
        <button className="region-btn">
          <PinIcon size={13} />
          서울특별시 전체
          <ChevronIcon size={9} />
        </button>
        <div className="topbar-spacer" />
        <div className="topbar-auth">
          <button className="ghost" onClick={() => setTweaksOpen((v) => !v)} aria-label="tweaks">
            ⚙
          </button>
        </div>
      </header>

      <div className={`main ${mode === "list" ? "list-mode" : ""} ${detailOpen && selectedItem ? "detail-open" : ""}`}>
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
          <NaverMapView
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
            overlay={
              <FilterBar filters={filters} setFilters={setFilters} onReset={resetFilters} />
            }
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
