"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { loadNaverMaps } from "@/lib/naver-loader";
import type { NaverPanorama as NaverPanoramaInstance } from "@/lib/naver-types";

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;

export function NaverPanorama({
  lat,
  lng,
  fallback,
}: {
  lat: number;
  lng: number;
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const panoRef = useRef<NaverPanoramaInstance | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!CLIENT_ID) {
      setFailed(true);
      return;
    }
    let cancelled = false;

    setFailed(false);
    setLoading(true);

    loadNaverMaps(CLIENT_ID)
      .then(() => {
        if (cancelled || !ref.current) return;
        const naver = window.naver;
        if (!naver?.maps?.Panorama) {
          setFailed(true);
          return;
        }
        try {
          const pano = new naver.maps.Panorama(ref.current, {
            position: new naver.maps.LatLng(lat, lng),
            pov: { pan: 0, tilt: 5, fov: 100 },
            flightSpot: false,
            logoControl: false,
            zoomControl: true,
            aroundControl: true,
          });
          panoRef.current = pano;

          // 거리뷰가 좌표 근처에 없으면 pano_changed에서 panoId가 비어 있음
          naver.maps.Event.addListener(pano, "pano_changed", () => {
            const id = pano.getPanoId?.();
            if (!id) {
              setFailed(true);
            } else {
              setLoading(false);
            }
          });
        } catch (e) {
          console.error("Naver panorama init failed", e);
          setFailed(true);
        }
      })
      .catch((e) => {
        console.error("Naver SDK load failed", e);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      if (panoRef.current?.destroy) {
        try {
          panoRef.current.destroy();
        } catch {
          /* ignore */
        }
      }
      panoRef.current = null;
    };
  }, [lat, lng]);

  if (failed) {
    return <>{fallback ?? null}</>;
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--seed-scale-color-gray-100, #f4f5f7)",
            color: "var(--seed-semantic-color-ink-text-low)",
            fontSize: 12,
            pointerEvents: "none",
          }}
        >
          거리뷰 불러오는 중…
        </div>
      )}
    </div>
  );
}
