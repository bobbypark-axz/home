// Minimal TypeScript surface for the Kakao Maps JavaScript SDK features we use.
// Upstream has no official types; keep this narrow and expand as needed.

export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  setLevel(level: number, options?: { animate?: boolean }): void;
  getLevel(): number;
  panTo(latlng: KakaoLatLng): void;
  relayout(): void;
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
  setPosition(latlng: KakaoLatLng): void;
}

export interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
  setPosition(latlng: KakaoLatLng): void;
  getContent(): string | HTMLElement;
}

export interface KakaoEventTarget {
  addListener(target: unknown, type: string, handler: (...args: unknown[]) => void): void;
  removeListener(target: unknown, type: string, handler: (...args: unknown[]) => void): void;
}

export interface KakaoNamespace {
  maps: {
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
    Marker: new (options: { position: KakaoLatLng; clickable?: boolean; title?: string }) => KakaoMarker;
    CustomOverlay: new (options: {
      position: KakaoLatLng;
      content: string | HTMLElement;
      yAnchor?: number;
      xAnchor?: number;
      clickable?: boolean;
      zIndex?: number;
    }) => KakaoCustomOverlay;
    event: KakaoEventTarget;
    load: (cb: () => void) => void;
  };
}

declare global {
  interface Window {
    kakao?: KakaoNamespace;
  }
}

export {};
