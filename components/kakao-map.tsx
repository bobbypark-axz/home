"use client";

import { useEffect, useRef, useState } from "react";
import type { Listing } from "@/lib/types";
import { DISTRICTS } from "@/lib/mock-data";
import { loadNaverMaps } from "@/lib/naver-loader";
import "@/lib/naver-types";
import type { NaverMarker, NaverMap } from "@/lib/naver-types";
import { CloseIcon, LocateIcon, PinIcon } from "./icons";

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_ZOOM = 11;
const DISTRICT_ZOOM = 13;
const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;

function sizeClass(count: number): string {
  if (count >= 100) return "size-lg";
  if (count >= 25) return "size-md";
  return "size-sm";
}

function districtShortName(name: string): string {
  return name
    .replace(/특별자치도$|광역시$|특별자치시$|특별시$/, "")
    .replace(/도$/, "")
    .replace(/구$/, "");
}

function makeDistrictEl(id: string, name: string, count: number): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-marker-wrap";
  el.dataset.districtId = id;
  el.innerHTML = `<div class="map-marker ${sizeClass(count)}"><span class="count">${count}</span><span class="label">${districtShortName(name)}</span></div>`;
  return el;
}

function pinClass(type: Listing["type"]): string {
  if (type === "sale") return "map-pin sale";
  if (type === "happy") return "map-pin happy";
  if (type === "nation") return "map-pin nation";
  if (type === "perm") return "map-pin perm";
  if (type === "buy") return "map-pin buy";
  if (type === "jeonse") return "map-pin jeonse";
  if (type === "fifty") return "map-pin fifty";
  return "map-pin";
}

function pinLabel(p: Listing): string {
  if (p.type === "sale") return "공공분양";
  if (p.deposit > 0 && p.rent > 0) return `보 ${p.deposit.toLocaleString()} / 월 ${p.rent}`;
  if (p.suplyTyNm) return p.suplyTyNm;
  return "임대";
}

function makePinEl(p: Listing): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-pin-wrap";
  el.dataset.listingId = p.id;
  el.innerHTML = `<div class="${pinClass(p.type)}">${pinLabel(p)}</div>`;
  return el;
}

function clusterSizeClass(count: number): string {
  if (count >= 50) return "size-lg";
  if (count >= 15) return "size-md";
  return "size-sm";
}

function makeClusterEl(count: number): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-cluster-wrap";
  el.innerHTML = `<div class="map-cluster ${clusterSizeClass(count)}">${count}</div>`;
  return el;
}

function gridStepForZoom(zoom: number): number {
  if (zoom <= 9) return 0.4;
  if (zoom <= 10) return 0.2;
  if (zoom <= 11) return 0.1;
  if (zoom <= 12) return 0.05;
  if (zoom <= 13) return 0.025;
  return 0; // 14 이상은 개별 핀
}

function clusterPins(pins: Listing[], zoom: number): Array<
  | { kind: "single"; pin: Listing }
  | { kind: "cluster"; lat: number; lng: number; pins: Listing[] }
> {
  const step = gridStepForZoom(zoom);
  if (step === 0) return pins.map((pin) => ({ kind: "single", pin }));
  const buckets = new Map<string, Listing[]>();
  for (const p of pins) {
    const ky = Math.floor(p.lat / step);
    const kx = Math.floor(p.lng / step);
    const key = `${ky}|${kx}`;
    const arr = buckets.get(key);
    if (arr) arr.push(p);
    else buckets.set(key, [p]);
  }
  const out: ReturnType<typeof clusterPins> = [];
  for (const group of buckets.values()) {
    if (group.length <= 2) {
      for (const pin of group) out.push({ kind: "single", pin });
      continue;
    }
    const lat = group.reduce((s, p) => s + p.lat, 0) / group.length;
    const lng = group.reduce((s, p) => s + p.lng, 0) / group.length;
    out.push({ kind: "cluster", lat, lng, pins: group });
  }
  return out;
}

export function NaverMapView({
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
  overlay,
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
  overlay?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const districtMarkersRef = useRef<NaverMarker[]>([]);
  const pinMarkersRef = useRef<Map<string, { marker: NaverMarker; el: HTMLElement }>>(new Map());
  const clusterMarkersRef = useRef<NaverMarker[]>([]);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) {
      setLoadError("NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID 가 설정되지 않았습니다");
      return;
    }
    let cancelled = false;
    loadNaverMaps(CLIENT_ID)
      .then(() => {
        if (cancelled || !containerRef.current || !window.naver) return;
        const { naver } = window;
        const map = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
          zoom: DEFAULT_ZOOM,
          scaleControl: false,
          logoControl: true,
          mapDataControl: false,
          zoomControl: false,
        });
        mapRef.current = map;
        naver.maps.Event.addListener(map, "zoom_changed", () => {
          setZoom(map.getZoom());
        });
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

  // District-level aggregate markers
  useEffect(() => {
    if (!ready || !mapRef.current || !window.naver) return;
    const { naver } = window;
    const map = mapRef.current;

    districtMarkersRef.current.forEach((m) => m.setMap(null));
    districtMarkersRef.current = [];

    if (activeDistrict) return;

    DISTRICTS.forEach((d) => {
      const count = districtCounts[d.id] ?? 0;
      if (count === 0) return;
      const el = makeDistrictEl(d.id, d.name, count);
      el.addEventListener("click", () => onDistrictClick(d.id));
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(d.lat, d.lng),
        map,
        icon: { content: el, anchor: { x: 0, y: 0 } },
        clickable: true,
      });
      districtMarkersRef.current.push(marker);
    });
  }, [ready, activeDistrict, districtCounts, onDistrictClick]);

  // Individual listing pin markers + clustering
  useEffect(() => {
    if (!ready || !mapRef.current || !window.naver) return;
    const { naver } = window;
    const map = mapRef.current;

    pinMarkersRef.current.forEach(({ marker }) => marker.setMap(null));
    pinMarkersRef.current = new Map();
    clusterMarkersRef.current.forEach((m) => m.setMap(null));
    clusterMarkersRef.current = [];

    if (!activeDistrict) return;

    const groups = clusterPins(pins, zoom);
    for (const g of groups) {
      if (g.kind === "single") {
        const p = g.pin;
        const el = makePinEl(p);
        el.addEventListener("mouseenter", () => onPinHover(p.id));
        el.addEventListener("mouseleave", () => onPinHover(null));
        el.addEventListener("click", () => onPinClick(p.id));
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(p.lat, p.lng),
          map,
          icon: { content: el, anchor: { x: 0, y: 0 } },
          clickable: true,
          zIndex: 2,
        });
        pinMarkersRef.current.set(p.id, { marker, el });
      } else {
        const el = makeClusterEl(g.pins.length);
        const lat = g.lat;
        const lng = g.lng;
        el.addEventListener("click", () => {
          map.morph(new naver.maps.LatLng(lat, lng), Math.min(map.getZoom() + 2, 16));
        });
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(lat, lng),
          map,
          icon: { content: el, anchor: { x: 0, y: 0 } },
          clickable: true,
          zIndex: 1,
        });
        clusterMarkersRef.current.push(marker);
      }
    }
  }, [ready, activeDistrict, pins, zoom, onPinHover, onPinClick]);

  // Sync hovered/selected visual state onto existing pin elements
  useEffect(() => {
    pinMarkersRef.current.forEach(({ el }, id) => {
      el.classList.toggle("hovered", id === hoveredId);
      el.classList.toggle("selected", id === selectedId);
    });
  }, [hoveredId, selectedId]);

  // Pan/zoom to active district
  useEffect(() => {
    if (!ready || !mapRef.current || !window.naver) return;
    const { naver } = window;
    if (activeDistrict) {
      const d = DISTRICTS.find((x) => x.id === activeDistrict);
      if (d) mapRef.current.morph(new naver.maps.LatLng(d.lat, d.lng), DISTRICT_ZOOM);
    } else {
      mapRef.current.morph(new naver.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng), DEFAULT_ZOOM);
    }
  }, [ready, activeDistrict]);

  const activeDistObj = activeDistrict ? DISTRICTS.find((d) => d.id === activeDistrict) : null;

  return (
    <div className="map-wrap">
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      {overlay && <div className="map-overlay-top">{overlay}</div>}

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
