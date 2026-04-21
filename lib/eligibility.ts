import type { HousingTypeId } from "./types";

export interface EligibilityForm {
  age: string;
  married: string;
  marriedYears: string;
  household: string;
  income: string;
  assets: string;
  houseOwner: string;
  region: string;
  specialCase: string[];
}

export interface EligibilityResult {
  id: HousingTypeId;
  name: string;
  badge: HousingTypeId;
  fits: string[];
  rentRatio: string;
  stayYears: string;
  status: "eligible" | "not";
  reason: string | null;
}

export interface EligibilityJudgment {
  results: EligibilityResult[];
  incomeRatio: number;
  urbanIncome: number;
  midIncome150: number;
  integMid: number;
}

const URBAN_INCOME: Record<number, number> = { 1: 350, 2: 530, 3: 630, 4: 730, 5: 800, 6: 870 };
const MID_INCOME_150: Record<number, number> = { 1: 370, 2: 610, 3: 780, 4: 950, 5: 1110, 6: 1270 };
const ASSET_CAP = 36100;

export function judge(form: EligibilityForm): EligibilityJudgment {
  const age = parseInt(form.age) || 0;
  const income = parseInt(form.income) || 0;
  const assets = parseInt(form.assets) || 0;
  const isYoung = age >= 19 && age <= 39;
  const isElder = age >= 65;
  const isNewlywed = form.married === "yes" && parseInt(form.marriedYears || "0") <= 7;
  const household = parseInt(form.household) || 1;
  const isMultiChild = form.specialCase.includes("multichild");
  const isDisabled = form.specialCase.includes("disabled");
  const isParentCare = form.specialCase.includes("parentcare");
  const isHouseless = form.houseOwner === "no";

  const urbanIncome = URBAN_INCOME[household] ?? 630;
  const incomeRatio = income === 0 ? 0 : Math.round((income / urbanIncome) * 100);
  const midIncome150 = MID_INCOME_150[household] ?? 780;

  const happyFits: string[] = [];
  if (isHouseless) {
    if (isYoung && incomeRatio <= 100) happyFits.push("청년 계층");
    if (isNewlywed && incomeRatio <= 100) happyFits.push("신혼부부 계층");
    if (isElder) happyFits.push("고령자 계층");
    if (form.specialCase.includes("student")) happyFits.push("대학생 계층");
  }

  const results: EligibilityResult[] = [];
  const hasChildren = form.specialCase.includes("children");

  results.push({
    id: "happy",
    name: "행복주택",
    badge: "happy",
    fits: happyFits,
    rentRatio: "시세 60~80%",
    stayYears: isNewlywed || hasChildren ? "최대 10년" : "최대 6년",
    status: happyFits.length > 0 ? "eligible" : "not",
    reason:
      happyFits.length === 0
        ? !isHouseless
          ? "무주택 요건 미충족"
          : !isYoung && !isNewlywed && !isElder
            ? "청년/신혼/고령 등 해당 계층 없음"
            : "소득 기준 초과"
        : null,
  });

  const nationEligible = isHouseless && age >= 19 && incomeRatio <= 70 && assets <= ASSET_CAP;
  results.push({
    id: "nation",
    name: "국민임대",
    badge: "nation",
    fits: nationEligible
      ? [
          "기본 자격 충족",
          ...(isNewlywed ? ["신혼부부 우선공급"] : []),
          ...(isMultiChild ? ["다자녀 우선공급"] : []),
          ...(isParentCare ? ["노부모 부양 우선공급"] : []),
          ...(isDisabled ? ["장애인 우선공급"] : []),
        ]
      : [],
    rentRatio: "시세 60~80%",
    stayYears: "최대 30년",
    status: nationEligible ? "eligible" : "not",
    reason: !nationEligible
      ? !isHouseless
        ? "무주택 요건 미충족"
        : age < 19
          ? "만 19세 이상 필요"
          : incomeRatio > 70
            ? `월평균 소득 ${incomeRatio}% → 70% 이하 필요`
            : assets > ASSET_CAP
              ? `총자산 ${assets.toLocaleString()}만원 → 3억 6,100만원 이하 필요`
              : "요건 미충족"
      : null,
  });

  const integMid = income === 0 ? 0 : Math.round((income / midIncome150) * 150);
  const integEligible = isHouseless && income > 0 && income <= midIncome150 && assets <= ASSET_CAP;
  const priorityFits = [
    ...(isMultiChild ? ["다자녀"] : []),
    ...(isElder ? ["고령자"] : []),
    ...(isDisabled ? ["장애인"] : []),
    ...(form.specialCase.includes("veteran") ? ["국가유공자"] : []),
  ];
  results.push({
    id: "integ",
    name: "통합공공임대",
    badge: "integ",
    fits: integEligible
      ? [
          `중위소득 ${integMid}% · 기본 자격 충족`,
          ...(priorityFits.length > 0 ? [`우선공급 대상: ${priorityFits.join(", ")}`] : ["일반공급 (추첨제)"]),
        ]
      : [],
    rentRatio: "시세 35~80% (분위별 차등)",
    stayYears: "최대 30년",
    status: integEligible ? "eligible" : "not",
    reason: !integEligible
      ? !isHouseless
        ? "무주택 요건 미충족"
        : income === 0
          ? "소득 정보가 없어 판정 불가"
          : income > midIncome150
            ? `월소득 ${income}만원 → ${midIncome150}만원 이하 필요 (중위 150%)`
            : "자산 기준 초과"
      : null,
  });

  return { results, incomeRatio, urbanIncome, midIncome150, integMid };
}

export function urbanIncomeFor(household: number | string): number {
  const h = typeof household === "string" ? parseInt(household) || 1 : household;
  return URBAN_INCOME[h] ?? 630;
}
