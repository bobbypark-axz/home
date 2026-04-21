"use client";

import type { Listing } from "@/lib/types";
import { DISTRICTS } from "@/lib/mock-data";
import { SEOUL_MAP_SVG } from "@/lib/svg";
import { CloseIcon, LocateIcon, PinIcon } from "./icons";

function sizeClass(count: number): string {
  if (count >= 50) return "size-lg";
  if (count >= 25) return "size-md";
  return "size-sm";
}

export function MapView({
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
  const activeDistObj = activeDistrict ? DISTRICTS.find((d) => d.id === activeDistrict) : null;

  return (
    <div className="map-wrap">
      <div
        className="map-svg"
        dangerouslySetInnerHTML={{ __html: SEOUL_MAP_SVG }}
        style={{ position: "absolute", inset: 0 }}
      />

      {!activeDistrict &&
        DISTRICTS.map((d) => {
          const count = districtCounts[d.id] ?? 0;
          if (count === 0) return null;
          return (
            <div
              key={d.id}
              className="map-marker-wrap"
              style={{ left: `${d.x}%`, top: `${d.y}%` }}
              onClick={() => onDistrictClick(d.id)}
            >
              <div className={`map-marker ${sizeClass(count)}`}>
                {count}
                <span className="label">{d.name.replace("구", "")}</span>
              </div>
            </div>
          );
        })}

      {activeDistrict &&
        pins.map((p) => (
          <div
            key={p.id}
            className={`map-pin-wrap ${hoveredId === p.id ? "hovered" : ""} ${selectedId === p.id ? "selected" : ""}`}
            style={{ left: `${p.mapX}%`, top: `${p.mapY}%` }}
            onMouseEnter={() => onPinHover(p.id)}
            onMouseLeave={() => onPinHover(null)}
            onClick={() => onPinClick(p.id)}
          >
            <div className="map-pin">
              보 {p.deposit.toLocaleString()} / 월 {p.rent}
            </div>
          </div>
        ))}

      {activeDistObj && (
        <div className="map-active-region">
          <PinIcon size={13} />
          {activeDistObj.name} · <strong style={{ color: "var(--seed-semantic-color-primary)" }}>{pins.length}건</strong>
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

      <div className="map-zoom">
        <button>+</button>
        <button>−</button>
      </div>

      <button className="map-recenter">
        <LocateIcon size={13} /> 내 위치
      </button>
    </div>
  );
}
