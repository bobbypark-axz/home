import type { HousingType, StatusId, StatusLabel } from "./types";

export const HOUSING_TYPES: HousingType[] = [
  { id: "happy", name: "행복주택", badge: "happy" },
  { id: "nation", name: "국민임대", badge: "nation" },
  { id: "perm", name: "영구임대", badge: "perm" },
  { id: "buy", name: "매입임대", badge: "buy" },
  { id: "jeonse", name: "전세임대", badge: "jeonse" },
  { id: "fifty", name: "50년임대", badge: "fifty" },
  { id: "integ", name: "통합공공임대", badge: "integ" },
  { id: "sale", name: "공공분양", badge: "sale" },
];

export const STATUS_LABELS: Record<StatusId, StatusLabel> = {
  open: { text: "입주가능", color: "#1aa174" },
  upcoming: { text: "예정", color: "#c27f29" },
  closing: { text: "마감임박", color: "#ff4133" },
  closed: { text: "마감", color: "#868b94" },
};

export const ELIGIBILITY_LABELS: Record<string, string> = {
  청년: "만 19-39세 청년",
  신혼: "신혼부부·예비부부",
  자녀: "자녀 있는 세대",
  다자녀: "다자녀 세대",
  "1인": "1인 가구",
  가구: "일반 세대",
  고령: "고령자 세대",
};
