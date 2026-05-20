"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Density, District, Filters, HousingTypeId, Listing, SortKey } from "@/lib/types";
import { effectiveStatus } from "@/lib/dday";
import { FilterBar } from "./filter-bar";
import { ListingPanel } from "./listing-panel";
import { NaverMapView } from "./kakao-map";
import { DetailPanel } from "./detail-panel";
import { EligibilityModal } from "./eligibility-modal";
import { FloatingChat } from "./floating-chat";
import { TweaksPanel } from "./tweaks-panel";
import { ChevronIcon, PinIcon } from "./icons";
import { MobileChrome } from "./mobile-chrome";

const INITIAL_FILTERS: Filters = {
  type: [],
  status: [],
};

const SHORT_SIDO_NAMES: Record<string, string> = {
  "충청북도": "충북",
  "충청남도": "충남",
  "전라남도": "전남",
  "경상북도": "경북",
  "경상남도": "경남",
};
function shortRegionName(name: string): string {
  if (SHORT_SIDO_NAMES[name]) return SHORT_SIDO_NAMES[name];
  return name
    .replace(/특별자치도$|광역시$|특별자치시$|특별시$/, "")
    .replace(/도$/, "");
}

export function AppShell({
  listings,
  districts,
}: {
  listings: Listing[];
  districts: District[];
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [sort, setSort] = useState<SortKey>("recent");
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [searchBounds, setSearchBounds] = useState<{
    swLat: number; swLng: number; neLat: number; neLng: number;
  } | null>(null);
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [eliOpen, setEliOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [density, setDensity] = useState<Density>("comfort");
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    void density;
  }, [density]);

  const filtered = useMemo(() => {
    // 마감된 공고는 기본적으로 숨김 — 마감 필터를 명시적으로 켰을 때만 노출
    const showClosed = filters.status.includes("closed");
    let list = listings.slice();
    if (!showClosed) list = list.filter((x) => x.status !== "closed");
    if (filters.type.length) list = list.filter((x) => filters.type.includes(x.type));
    // 마감임박(closing)은 raw status 에 없고 deadline 으로 derive 되므로 effectiveStatus 비교.
    if (filters.status.length) list = list.filter((x) => filters.status.includes(effectiveStatus(x.status, x.deadline, x.beginDate)));
    // 지역 필터: 지도 영역 모드가 우선, 그 다음 시도 클릭 모드
    if (searchBounds) {
      list = list.filter((x) =>
        x.lat >= searchBounds.swLat &&
        x.lat <= searchBounds.neLat &&
        x.lng >= searchBounds.swLng &&
        x.lng <= searchBounds.neLng,
      );
    } else if (activeDistrict) {
      list = list.filter((x) => x.districtId === activeDistrict);
    }

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
  }, [filters, sort, activeDistrict, searchBounds, listings]);

  const districtCounts = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const showClosed = filters.status.includes("closed");
    let list = listings.slice();
    if (!showClosed) list = list.filter((x) => x.status !== "closed");
    if (filters.type.length) list = list.filter((x) => filters.type.includes(x.type));
    if (filters.status.length) list = list.filter((x) => filters.status.includes(effectiveStatus(x.status, x.deadline, x.beginDate)));
    list.forEach((x) => {
      map[x.districtId] = (map[x.districtId] ?? 0) + 1;
    });
    districts.forEach((d) => {
      if (!map[d.id]) map[d.id] = 0;
    });
    return map;
  }, [filters, listings, districts]);

  const resetFilters = () => setFilters(INITIAL_FILTERS);

  const selectedItem = filtered.find((x) => x.id === selectedId) ?? listings.find((x) => x.id === selectedId);

  const handleSelect = useCallback((id: string) => {
    // 모바일 viewport: 풀스크린 라우트로 이동 (overlay 대신 별도 페이지)
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      router.push(`/listings/${id}`);
      return;
    }
    setSelectedId(id);
    setDetailOpen(true);
  }, [router]);
  const handleDistrictClick = useCallback((id: string) => {
    setActiveDistrict(id);
    setSearchBounds(null);
  }, []);
  const handleDistrictClear = useCallback(() => {
    setActiveDistrict(null);
    setSearchBounds(null);
  }, []);
  const handleSearchHere = useCallback(
    (b: { swLat: number; swLng: number; neLat: number; neLng: number }) => {
      setSearchBounds(b);
      setActiveDistrict(null);
    },
    [],
  );
  const handleDetailClose = useCallback(() => setDetailOpen(false), []);

  return (
    <div className="app">
      {/* 모바일 전용 상단 (지역선택 + 필터칩) — desktop 에서는 CSS 로 숨김 */}
      <MobileChrome.Top
        regionLabel={
          searchBounds
            ? "지도 영역"
            : activeDistrict
              ? districts.find((d) => d.id === activeDistrict)?.name ?? "전체 지역"
              : "전체 지역"
        }
        districts={districts}
        activeDistrict={activeDistrict}
        districtCounts={districtCounts}
        onDistrictClick={handleDistrictClick}
        onDistrictClear={handleDistrictClear}
        filters={filters}
        setFilters={setFilters}
        onReset={resetFilters}
      />
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="둥지" className="brand-logo" />
          <button className="brand-ai-cta" onClick={() => setChatOpen(true)}>
            <span className="ai-spark" aria-hidden>✨</span>
            AI로 조건 찾기
          </button>
        </div>
        <div className="region-wrap">
          <button className="region-btn" onClick={() => setRegionMenuOpen((v) => !v)}>
            <PinIcon size={13} />
            {searchBounds
              ? "지도 영역"
              : activeDistrict
                ? shortRegionName(districts.find((d) => d.id === activeDistrict)?.name ?? "전체 지역")
                : "전체 지역"}
            <ChevronIcon size={9} />
          </button>
          {regionMenuOpen && (
            <>
              <div className="region-menu-backdrop" onClick={() => setRegionMenuOpen(false)} />
              <div className="region-menu" role="menu">
                <button
                  className={`region-menu-item ${activeDistrict === null ? "active" : ""}`}
                  onClick={() => {
                    handleDistrictClear();
                    setRegionMenuOpen(false);
                  }}
                >
                  전체 지역
                </button>
                {districts.map((d) => (
                  <button
                    key={d.id}
                    className={`region-menu-item ${activeDistrict === d.id ? "active" : ""}`}
                    onClick={() => {
                      handleDistrictClick(d.id);
                      setRegionMenuOpen(false);
                    }}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="topbar-spacer" />
      </header>

      <div className={`main ${detailOpen && selectedItem ? "detail-open" : ""}`}>
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

        <NaverMapView
          districts={districts}
          districtCounts={districtCounts}
          activeDistrict={activeDistrict}
          onDistrictClick={handleDistrictClick}
          onDistrictClear={handleDistrictClear}
          onSearchHere={handleSearchHere}
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

        <DetailPanel item={selectedItem} open={detailOpen} onClose={handleDetailClose} />
      </div>

      <EligibilityModal
        open={eliOpen}
        onClose={() => setEliOpen(false)}
        onApplyFilter={(types: HousingTypeId[]) => setFilters({ ...filters, type: types })}
      />

      <FloatingChat
        open={chatOpen}
        onOpenChange={setChatOpen}
        shifted={detailOpen && Boolean(selectedItem)}
        allListings={listings}
      />

      <TweaksPanel
        open={tweaksOpen}
        density={density}
        setDensity={setDensity}
        showLegend={showLegend}
        setShowLegend={setShowLegend}
      />
    </div>
  );
}
