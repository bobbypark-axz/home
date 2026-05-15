"use client";

import type { Density } from "@/lib/types";

export function TweaksPanel({
  open,
  density,
  setDensity,
  showLegend,
  setShowLegend,
}: {
  open: boolean;
  density: Density;
  setDensity: (v: Density) => void;
  showLegend: boolean;
  setShowLegend: (v: boolean) => void;
}) {
  return (
    <div className={`tweaks-panel ${open ? "open" : ""}`}>
      <div className="tweaks-title">
        <span>Tweaks</span>
      </div>

      <div className="tweak-row">
        <span className="tweak-label">카드 밀도</span>
        <div className="seg">
          <button className={density === "compact" ? "active" : ""} onClick={() => setDensity("compact")}>
            compact
          </button>
          <button className={density === "comfort" ? "active" : ""} onClick={() => setDensity("comfort")}>
            comfort
          </button>
        </div>
      </div>

      <div className="tweak-row">
        <span className="tweak-label">지도 범례</span>
        <div className="seg">
          <button className={showLegend ? "active" : ""} onClick={() => setShowLegend(true)}>
            ON
          </button>
          <button className={!showLegend ? "active" : ""} onClick={() => setShowLegend(false)}>
            OFF
          </button>
        </div>
      </div>
    </div>
  );
}
