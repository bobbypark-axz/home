import "./tokens.css";
import "./mobile.css";
import { MobileApp } from "./MobileV1";
import { LH_DISTRICTS, LH_LISTINGS } from "@/lib/lh-adapter";

// /m URL — 실제 모바일 앱 모드. props 직렬화 부담 줄이기 위해 모바일 카드에 필요한
// 필드만 골라서 전달 (12MB JSON 통째 전달은 hydration 부담).
export default function MobileDemoPage() {
  const slim = LH_LISTINGS.map((l) => ({
    id: l.id, title: l.title, type: l.type, agency: l.agency,
    districtId: l.districtId, district: l.district, address: l.address,
    lat: l.lat, lng: l.lng, deposit: l.deposit, rent: l.rent, area: l.area,
    status: l.status, deadline: l.deadline, eligible: l.eligible,
    thumbSeed: l.thumbSeed, supplyUnits: l.supplyUnits,
    heatMethod: l.heatMethod, suplyTyNm: l.suplyTyNm,
    layout: "", features: [], transit: "", competition: null,
    sourceUrl: l.sourceUrl,
  }));
  return (
    <div className="mobile-only-force">
      <MobileApp listings={slim} districts={LH_DISTRICTS} />
    </div>
  );
}
