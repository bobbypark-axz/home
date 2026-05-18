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
  // 계층
  청년: "만 19-39세 청년",
  신혼: "신혼부부 (혼인 7년 이내)",
  자녀: "자녀 있는 세대",
  다자녀: "다자녀 세대",
  "1인": "1인 가구",
  가구: "일반 세대",
  고령: "만 65세 이상 고령자",
  대학생: "대학생",
  한부모: "한부모 가족",
  // 기본 조건
  무주택: "무주택 세대구성원",
  // 특별 자격 (영구임대 등)
  수급: "기초생활수급자",
  차상위: "차상위 계층",
  장애: "장애인",
  국가유공: "국가유공자",
  북한이탈: "북한이탈주민",
  // 소득 / 자산
  소득70: "소득 도시근로자 70% 이하",
  소득100: "소득 100% 이하",
  소득150: "소득 150% 이하",
  자산: "총자산 3.61억 이하",
  자동차: "자동차 3,803만원 이하",
  청약저축: "주택청약저축 가입자",
  // 거주
  거주30: "최대 30년 거주",
  거주50: "최대 50년 거주",
  거주10: "최대 10년 (자녀 시)",
};
