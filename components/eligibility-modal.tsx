"use client";

import { useState } from "react";
import type { HousingTypeId } from "@/lib/types";
import { judge, urbanIncomeFor, type EligibilityForm } from "@/lib/eligibility";
import { CloseIcon } from "./icons";

function Field({ label, subtitle, children }: { label: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="eli-field">
      <div className="eli-field-label">
        <div>{label}</div>
        {subtitle && <div className="eli-field-sub">{subtitle}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Seg<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { v: T; label: string }[];
}) {
  return (
    <div className="eli-seg">
      {options.map((o) => (
        <button key={o.v} className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const INITIAL_FORM: EligibilityForm = {
  age: "",
  married: "",
  marriedYears: "",
  household: "2",
  income: "",
  assets: "",
  houseOwner: "no",
  region: "seoul",
  specialCase: [],
};

export function EligibilityModal({
  open,
  onClose,
  onApplyFilter,
}: {
  open: boolean;
  onClose: () => void;
  onApplyFilter: (types: HousingTypeId[]) => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<EligibilityForm>(INITIAL_FORM);

  if (!open) return null;

  const update = <K extends keyof EligibilityForm>(k: K, v: EligibilityForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));
  const toggleSpecial = (v: string) => {
    if (form.specialCase.includes(v)) update("specialCase", form.specialCase.filter((x) => x !== v));
    else update("specialCase", [...form.specialCase, v]);
  };

  const result = step === 3 ? judge(form) : null;
  const canNext1 = form.age && form.household && form.houseOwner;
  const canNext2 = form.income !== "" && form.assets !== "";

  const applyToFilter = () => {
    if (!result) return;
    const eligibleTypes = result.results.filter((r) => r.status === "eligible").map((r) => r.id);
    onApplyFilter(eligibleTypes);
    onClose();
  };

  return (
    <div className="eli-overlay" onClick={onClose}>
      <div className="eli-modal" onClick={(e) => e.stopPropagation()}>
        <header className="eli-header">
          <div>
            <div className="eli-kicker">내 자격 확인</div>
            <h2>어떤 공공임대에 지원할 수 있는지 알아볼게요</h2>
          </div>
          <button className="eli-x" onClick={onClose} aria-label="닫기">
            <CloseIcon size={14} />
          </button>
        </header>

        <div className="eli-stepper">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`eli-step ${step >= n ? "on" : ""} ${step === n ? "cur" : ""}`}>
              <span className="eli-step-num">{step > n ? "✓" : n}</span>
              <span className="eli-step-label">{["기본 정보", "소득·자산", "결과"][n - 1]}</span>
            </div>
          ))}
        </div>

        <div className="eli-body">
          {step === 1 && (
            <div className="eli-form">
              <Field label="나이" subtitle="만 나이 기준">
                <div className="eli-input-row">
                  <input
                    type="number"
                    className="eli-input"
                    placeholder="예: 29"
                    value={form.age}
                    onChange={(e) => update("age", e.target.value)}
                  />
                  <span className="eli-suffix">세</span>
                </div>
              </Field>

              <Field label="혼인 상태">
                <Seg
                  value={form.married}
                  onChange={(v) => update("married", v)}
                  options={[
                    { v: "single", label: "미혼" },
                    { v: "yes", label: "기혼" },
                    { v: "planning", label: "예비부부" },
                  ]}
                />
                {form.married === "yes" && (
                  <div className="eli-input-row" style={{ marginTop: 8 }}>
                    <input
                      type="number"
                      className="eli-input"
                      placeholder="혼인 기간"
                      value={form.marriedYears}
                      onChange={(e) => update("marriedYears", e.target.value)}
                    />
                    <span className="eli-suffix">년차</span>
                  </div>
                )}
              </Field>

              <Field label="세대 구성원 수" subtitle="본인 포함">
                <Seg
                  value={form.household}
                  onChange={(v) => update("household", v)}
                  options={[
                    { v: "1", label: "1인" },
                    { v: "2", label: "2인" },
                    { v: "3", label: "3인" },
                    { v: "4", label: "4인" },
                    { v: "5", label: "5인+" },
                  ]}
                />
              </Field>

              <Field label="주택 소유" subtitle="세대 구성원 전원 기준">
                <Seg
                  value={form.houseOwner}
                  onChange={(v) => update("houseOwner", v)}
                  options={[
                    { v: "no", label: "무주택" },
                    { v: "yes", label: "유주택" },
                  ]}
                />
                {form.houseOwner === "yes" && (
                  <div className="eli-warn">⚠️ 유주택 세대는 공공임대 신청이 원칙적으로 불가합니다.</div>
                )}
              </Field>

              <Field label="해당 사항 선택" subtitle="선택한 조건으로 우선공급 대상이 될 수 있어요">
                <div className="eli-chips">
                  {[
                    { v: "student", label: "대학생" },
                    { v: "children", label: "자녀 있음" },
                    { v: "multichild", label: "다자녀(3명+)" },
                    { v: "parentcare", label: "노부모 부양" },
                    { v: "disabled", label: "장애인" },
                    { v: "veteran", label: "국가유공자" },
                  ].map((c) => (
                    <button
                      key={c.v}
                      className={`eli-chip ${form.specialCase.includes(c.v) ? "on" : ""}`}
                      onClick={() => toggleSpecial(c.v)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="eli-form">
              <div className="eli-info-box">
                2026년 기준 {form.household}인 세대의 도시근로자 월평균 소득은{" "}
                <strong>{urbanIncomeFor(form.household).toLocaleString()}만원</strong>으로 산정됩니다.
              </div>

              <Field label="세대 월평균 소득" subtitle="세전, 세대원 합산 (상여 포함)">
                <div className="eli-input-row">
                  <input
                    type="number"
                    className="eli-input"
                    placeholder="예: 420"
                    value={form.income}
                    onChange={(e) => update("income", e.target.value)}
                  />
                  <span className="eli-suffix">만원 / 월</span>
                </div>
                {form.income && (
                  <div className="eli-hint">
                    도시근로자 소득의{" "}
                    <strong>
                      {Math.round((parseInt(form.income) / urbanIncomeFor(form.household)) * 100)}%
                    </strong>{" "}
                    수준
                  </div>
                )}
              </Field>

              <Field label="세대 총자산" subtitle="부동산·금융·자동차 합산 (부채 차감)">
                <div className="eli-input-row">
                  <input
                    type="number"
                    className="eli-input"
                    placeholder="예: 8000"
                    value={form.assets}
                    onChange={(e) => update("assets", e.target.value)}
                  />
                  <span className="eli-suffix">만원</span>
                </div>
                <div className="eli-hint">
                  공공임대 자산 기준: <strong>3억 6,100만원 이하</strong>
                </div>
              </Field>

              <Field label="거주 지역">
                <Seg
                  value={form.region}
                  onChange={(v) => update("region", v)}
                  options={[
                    { v: "seoul", label: "서울" },
                    { v: "gyeonggi", label: "경기" },
                    { v: "incheon", label: "인천" },
                    { v: "other", label: "기타" },
                  ]}
                />
              </Field>
            </div>
          )}

          {step === 3 && result && (
            <div className="eli-result">
              <div className="eli-result-summary">
                <div className="eli-result-kicker">판정 완료</div>
                <div className="eli-result-title">
                  신청 가능한 유형 <em>{result.results.filter((r) => r.status === "eligible").length}개</em>
                </div>
                <div className="eli-result-meta">
                  만 {form.age}세 · {form.household}인 세대 · 월소득{" "}
                  {parseInt(form.income).toLocaleString()}만원 (도시근로자 {result.incomeRatio}%)
                </div>
              </div>

              {result.results.map((r) => (
                <div key={r.id} className={`eli-card ${r.status}`}>
                  <div className="eli-card-head">
                    <span className={`badge ${r.badge}`} style={{ fontSize: 12, padding: "3px 9px" }}>
                      {r.name}
                    </span>
                    <div className={`eli-card-status ${r.status}`}>
                      {r.status === "eligible" ? "✓ 신청 가능" : "× 요건 미충족"}
                    </div>
                  </div>
                  {r.fits.length > 0 && (
                    <ul className="eli-card-fits">
                      {r.fits.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  )}
                  {r.reason && <div className="eli-card-reason">{r.reason}</div>}
                  <div className="eli-card-meta">
                    <span>임대료 {r.rentRatio}</span>
                    <span>·</span>
                    <span>거주 {r.stayYears}</span>
                  </div>
                </div>
              ))}

              <div className="eli-disclaimer">
                * 본 결과는 입력값을 토대로 한 예비 판정이며, 실제 자격은 모집공고별 기준과 심사 결과에 따라 달라질 수 있습니다.
              </div>
            </div>
          )}
        </div>

        <footer className="eli-footer">
          {step > 1 && (
            <button className="eli-btn-ghost" onClick={() => setStep(step - 1)}>
              이전
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step === 1 && (
            <button className="eli-btn-primary" disabled={!canNext1} onClick={() => setStep(2)}>
              다음
            </button>
          )}
          {step === 2 && (
            <button className="eli-btn-primary" disabled={!canNext2} onClick={() => setStep(3)}>
              결과 보기
            </button>
          )}
          {step === 3 && result && (
            <>
              <button className="eli-btn-ghost" onClick={() => setStep(1)}>
                다시 입력
              </button>
              <button
                className="eli-btn-primary"
                disabled={result.results.filter((r) => r.status === "eligible").length === 0}
                onClick={applyToFilter}
              >
                가능한 매물만 보기 →
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
