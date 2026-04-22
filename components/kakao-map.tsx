"use client";

import { useEffect, useRef, useState } from "react";
import type { Listing } from "@/lib/types";
import { DISTRICTS } from "@/lib/mock-data";
import { loadKakaoMaps } from "@/lib/kakao-loader";
import "@/lib/kakao-types";
import type { KakaoCustomOverlay, KakaoMap } from "@/lib/kakao-types";
import { CloseIcon, LocateIcon, PinIcon } from "./icons";

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_LEVEL = 8;
const APPKEY = process.env.NEXT_PUBLIC_KAKAO_MAPS_APPKEY;

function sizeClass(count: number): string {
  if (count >= 50) return "size-lg";
  if (count >= 25) return "size-md";
  return "size-sm";
}

function makeDistrictEl(id: string, name: string, count: number): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-marker-wrap";
  el.dataset.districtId = id;
  el.innerHTML = `<div class="map-marker ${sizeClass(count)}">${count}<span class="label">${name.replace("구", "")}</span></div>`;
  return el;
}

function makePinEl(p: Listing): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-pin-wrap";
  el.dataset.listingId = p.id;
  el.innerHTML = `<div class="map-pin">보 ${p.deposit.toLocaleString()} / 월 ${p.rent}</div>`;
  return el;
}

export function KakaoMapView({
  districtCounts,
  activeDistrict,
  onDistrictClick,
  onDistrictClear,
  pins,
  hoveredId,
  selectedId,
  onPinHover,
  onPinClick,
  showLegend,
}: {
  districtCounts: Record<string, number>;
  activeDistrict: string | null;
  onDistrictClick: (id: string) => void;
  onDistrictClear: () => void;
  pins: Listing[];
  hoveredId: string | null;
  selectedId: string | null;
  onPinHover: (id: string | null) => void;
  onPinClick: (id: string) => void;
  showLegend: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const districtOverlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const pinOverlaysRef = useRef<Map<string, { overlay: KakaoCustomOverlay; el: HTMLElement }>>(new Map());
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!APPKEY) {
      setLoadError("NEXT_PUBLIC_KAKAO_MAPS_APPKEY 가 설정되지 않았습니다");
      return;
    }
    let cancelled = false;
    loadKakaoMaps(APPKEY)
      .then(() => {
        if (cancelled || !containerRef.current || !window.kakao) return;
        const { kakao } = window;
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
          level: DEFAULT_LEVEL,
        });
        mapRef.current = map;
        setReady(true);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // District-level aggregate overlays
  useEffect(() => {
    if (!ready || !mapRef.current || !window.kakao) return;
    const { kakao } = window;
    const map = mapRef.current;

    districtOverlaysRef.current.forEach((o) => o.setMap(null));
    districtOverlaysRef.current = [];

    if (activeDistrict) return;

    DISTRICTS.forEach((d) => {
      const count = districtCounts[d.id] ?? 0;
      if (count === 0) return;
      const el = makeDistrictEl(d.id, d.name, count);
      el.addEventListener("click", () => onDistrictClick(d.id));
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(d.lat, d.lng),
        content: el,
        yAnchor: 0.5,
        xAnchor: 0.5,
        clickable: true,
      });
      overlay.setMap(map);
      districtOverlaysRef.current.push(overlay);
    });
  }, [ready, activeDistrict, districtCounts, onDistrictClick]);

  // Individual listing pin overlays (when a district is active)
  useEffect(() => {
    if (!ready || !mapRef.current || !window.kakao) return;
    const { kakao } = window;
    const map = mapRef.current;

    pinOverlaysRef.current.forEach(({ overlay }) => overlay.setMap(null));
    pinOverlaysRef.current = new Map();

    if (!activeDistrict) return;

    pins.forEach((p) => {
      const el = makePinEl(p);
      el.addEventListener("mouseenter", () => onPinHover(p.id));
      el.addEventListener("mouseleave", () => onPinHover(null));
      el.addEventListener("click", () => onPinClick(p.id));
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(p.lat, p.lng),
        content: el,
        yAnchor: 1,
        xAnchor: 0.5,
        clickable: true,
      });
      overlay.setMap(map);
      pinOverlaysRef.current.set(p.id, { overlay, el });
    });
  }, [ready, activeDistrict, pins, onPinHover, onPinClick]);

  // Sync hovered/selected visual state onto existing pin elements
  useEffect(() => {
    pinOverlaysRef.current.forEach(({ el }, id) => {
      el.classList.toggle("hovered", id === hoveredId);
      el.classList.toggle("selected", id === selectedId);
    });
  }, [hoveredId, selectedId]);

  // Pan to the active district center
  useEffect(() => {
    if (!ready || !mapRef.current || !window.kakao) return;
    const { kakao } = window;
    if (activeDistrict) {
      const d = DISTRICTS.find((x) => x.id === activeDistrict);
      if (d) {
        mapRef.current.panTo(new kakao.maps.LatLng(d.lat, d.lng));
        mapRef.current.setLevel(5, { animate: true });
      }
    } else {
      mapRef.current.panTo(new kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng));
      mapRef.current.setLevel(DEFAULT_LEVEL, { animate: true });
    }
  }, [ready, activeDistrict]);

  const activeDistObj = activeDistrict ? DISTRICTS.find((d) => d.id === activeDistrict) : null;

  return (
    <div className="map-wrap">
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {loadError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "var(--seed-scale-color-gray-100)",
            color: "var(--seed-semantic-color-ink-text-low)",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          지도를 불러올 수 없어요
          <br />
          <span style={{ fontSize: 11, marginTop: 4, display: "block" }}>{loadError}</span>
        </div>
      )}

      {activeDistObj && (
        <div className="map-active-region">
          <PinIcon size={13} />
          {activeDistObj.name} ·{" "}
          <strong style={{ color: "var(--seed-semantic-color-primary)" }}>{pins.length}건</strong>
          <button className="close" onClick={onDistrictClear} aria-label="전체 보기로 돌아가기">
            <CloseIcon size={10} />
          </button>
        </div>
      )}

      {!activeDistrict && showLegend && (
        <div className="map-legend">
          <div className="legend-title">모집중 단지 수</div>
          <div className="legend-row">
            <span className="legend-dot sm" style={{ background: "#ff6f0f" }} />
            ~24개
          </div>
          <div className="legend-row">
            <span className="legend-dot" style={{ background: "#ff6f0f" }} />
            25~49개
          </div>
          <div className="legend-row">
            <span className="legend-dot lg" style={{ background: "#ff6f0f" }} />
            50개 이상
          </div>
        </div>
      )}

      <button className="map-recenter">
        <LocateIcon size={13} /> 내 위치
      </button>
    </div>
  );
}
