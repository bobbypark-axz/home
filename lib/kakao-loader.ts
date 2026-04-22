// Kakao Maps SDK loader — loads the script once per page, supports callback.
// Uses autoload=false so we can defer init until React effect fires.

let loadPromise: Promise<void> | null = null;

export function loadKakaoMaps(appkey: string): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Kakao Maps must be loaded on the client"));
      return;
    }

    const w = window as unknown as { kakao?: { maps?: { load: (cb: () => void) => void } } };

    if (w.kakao?.maps) {
      w.kakao.maps.load(() => resolve());
      return;
    }

    const existing = document.getElementById("kakao-maps-sdk") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => {
        w.kakao?.maps?.load(() => resolve());
      });
      existing.addEventListener("error", () => reject(new Error("Failed to load Kakao Maps SDK")));
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appkey)}&autoload=false&libraries=services,clusterer`;
    script.async = true;
    script.onload = () => {
      w.kakao?.maps?.load(() => resolve());
    };
    script.onerror = () => reject(new Error("Failed to load Kakao Maps SDK"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
