// eligibility.jsx — 내 자격 확인 모달

function EligibilityModal({ open, onClose, onApplyFilter }) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    age: '',
    married: '',
    marriedYears: '',
    household: '2',
    income: '',
    assets: '',
    houseOwner: 'no',
    region: 'seoul',
    specialCase: [],
  });

  if (!open) return null;

  const update = (k, v) => setForm({ ...form, [k]: v });
  const toggleSpecial = (v) => {
    if (form.specialCase.includes(v)) update('specialCase', form.specialCase.filter(x => x !== v));
    else update('specialCase', [...form.specialCase, v]);
  };

  // 자격 판정 로직
  const judge = () => {
    const age = parseInt(form.age) || 0;
    const income = parseInt(form.income) || 0;  // 만원 단위 (월평균)
    const assets = parseInt(form.assets) || 0;  // 만원 단위 (총자산)
    const isYoung = age >= 19 && age <= 39;
    const isElder = age >= 65;
    const isNewlywed = form.married === 'yes' && parseInt(form.marriedYears || 0) <= 7;
    const household = parseInt(form.household) || 1;
    const hasChildren = form.specialCase.includes('children');
    const isMultiChild = form.specialCase.includes('multichild');
    const isDisabled = form.specialCase.includes('disabled');
    const isParentCare = form.specialCase.includes('parentcare');

    // 도시근로자 월평균 소득 (2026 기준 추정 · 만원)
    const urbanIncome = { 1: 350, 2: 530, 3: 630, 4: 730, 5: 800, 6: 870 }[household] || 630;
    const incomeRatio = income === 0 ? 0 : Math.round((income / urbanIncome) * 100);

    // 중위소득 150% (통합공공임대)
    const midIncome150 = { 1: 370, 2: 610, 3: 780, 4: 950, 5: 1110, 6: 1270 }[household] || 780;

    const results = [];
    const isHouseless = form.houseOwner === 'no';

    // 행복주택
    const happyFits = [];
    if (isHouseless) {
      if (isYoung && incomeRatio <= 100) happyFits.push('청년 계층');
      if (isNewlywed && incomeRatio <= 100) happyFits.push('신혼부부 계층');
      if (isElder) happyFits.push('고령자 계층');
      if (form.specialCase.includes('student')) happyFits.push('대학생 계층');
    }
    results.push({
      id: 'happy',
      name: '행복주택',
      badge: 'happy',
      fits: happyFits,
      rentRatio: '시세 60~80%',
      stayYears: isNewlywed || hasChildren ? '최대 10년' : '최대 6년',
      status: happyFits.length > 0 ? 'eligible' : 'not',
      reason: happyFits.length === 0
        ? (!isHouseless ? '무주택 요건 미충족'
          : (!isYoung && !isNewlywed && !isElder) ? '청년/신혼/고령 등 해당 계층 없음'
          : '소득 기준 초과')
        : null,
    });

    // 국민임대
    const nationEligible = isHouseless && age >= 19 && incomeRatio <= 70 && assets <= 36100;
    results.push({
      id: 'nation',
      name: '국민임대',
      badge: 'nation',
      fits: nationEligible ? [
        '기본 자격 충족',
        ...(isNewlywed ? ['신혼부부 우선공급'] : []),
        ...(isMultiChild ? ['다자녀 우선공급'] : []),
        ...(isParentCare ? ['노부모 부양 우선공급'] : []),
        ...(isDisabled ? ['장애인 우선공급'] : []),
      ] : [],
      rentRatio: '시세 60~80%',
      stayYears: '최대 30년',
      status: nationEligible ? 'eligible' : 'not',
      reason: !nationEligible
        ? (!isHouseless ? '무주택 요건 미충족'
          : age < 19 ? '만 19세 이상 필요'
          : incomeRatio > 70 ? `월평균 소득 ${incomeRatio}% → 70% 이하 필요`
          : assets > 36100 ? `총자산 ${assets.toLocaleString()}만원 → 3억 6,100만원 이하 필요`
          : '요건 미충족')
        : null,
    });

    // 통합공공임대
    const integMid = income === 0 ? 0 : Math.round((income / midIncome150) * 150);
    const integEligible = isHouseless && income > 0 && income <= midIncome150 && assets <= 36100;
    const priorityFits = [
      ...(isMultiChild ? ['다자녀'] : []),
      ...(isElder ? ['고령자'] : []),
      ...(isDisabled ? ['장애인'] : []),
      ...(form.specialCase.includes('veteran') ? ['국가유공자'] : []),
    ];
    results.push({
      id: 'integ',
      name: '통합공공임대',
      badge: 'integ',
      fits: integEligible ? [
        `중위소득 ${integMid}% · 기본 자격 충족`,
        ...(priorityFits.length > 0 ? [`우선공급 대상: ${priorityFits.join(', ')}`] : ['일반공급 (추첨제)']),
      ] : [],
      rentRatio: '시세 35~80% (분위별 차등)',
      stayYears: '최대 30년',
      status: integEligible ? 'eligible' : 'not',
      reason: !integEligible
        ? (!isHouseless ? '무주택 요건 미충족'
          : income === 0 ? '소득 정보가 없어 판정 불가'
          : income > midIncome150 ? `월소득 ${income}만원 → ${midIncome150}만원 이하 필요 (중위 150%)`
          : '자산 기준 초과')
        : null,
    });

    return { results, incomeRatio, urbanIncome, midIncome150, integMid };
  };

  const result = step === 3 ? judge() : null;
  const canNext1 = form.age && form.household && form.houseOwner;
  const canNext2 = form.income !== '' && form.assets !== '';

  const applyToFilter = () => {
    const eligibleTypes = result.results.filter(r => r.status === 'eligible').map(r => r.id);
    onApplyFilter(eligibleTypes);
    onClose();
  };

  return (
    <div className="eli-overlay" onClick={onClose}>
      <div className="eli-modal" onClick={e => e.stopPropagation()}>
        <header className="eli-header">
          <div>
            <div className="eli-kicker">내 자격 확인</div>
            <h2>어떤 공공임대에 지원할 수 있는지 알아볼게요</h2>
          </div>
          <button className="eli-x" onClick={onClose} aria-label="닫기"><Icon.Close size={14}/></button>
        </header>

        <div className="eli-stepper">
          {[1,2,3].map(n => (
            <div key={n} className={`eli-step ${step >= n ? 'on' : ''} ${step === n ? 'cur' : ''}`}>
              <span className="eli-step-num">{step > n ? '✓' : n}</span>
              <span className="eli-step-label">{['기본 정보', '소득·자산', '결과'][n-1]}</span>
            </div>
          ))}
        </div>

        <div className="eli-body">
          {step === 1 && (
            <div className="eli-form">
              <Field label="나이" subtitle="만 나이 기준">
                <div className="eli-input-row">
                  <input type="number" className="eli-input" placeholder="예: 29" value={form.age} onChange={e => update('age', e.target.value)} />
                  <span className="eli-suffix">세</span>
                </div>
              </Field>

              <Field label="혼인 상태">
                <Seg value={form.married} onChange={v => update('married', v)} options={[
                  { v: 'single', label: '미혼' },
                  { v: 'yes', label: '기혼' },
                  { v: 'planning', label: '예비부부' },
                ]}/>
                {form.married === 'yes' && (
                  <div className="eli-input-row" style={{ marginTop: 8 }}>
                    <input type="number" className="eli-input" placeholder="혼인 기간" value={form.marriedYears} onChange={e => update('marriedYears', e.target.value)} />
                    <span className="eli-suffix">년차</span>
                  </div>
                )}
              </Field>

              <Field label="세대 구성원 수" subtitle="본인 포함">
                <Seg value={form.household} onChange={v => update('household', v)} options={[
                  { v: '1', label: '1인' },
                  { v: '2', label: '2인' },
                  { v: '3', label: '3인' },
                  { v: '4', label: '4인' },
                  { v: '5', label: '5인+' },
                ]}/>
              </Field>

              <Field label="주택 소유" subtitle="세대 구성원 전원 기준">
                <Seg value={form.houseOwner} onChange={v => update('houseOwner', v)} options={[
                  { v: 'no', label: '무주택' },
                  { v: 'yes', label: '유주택' },
                ]}/>
                {form.houseOwner === 'yes' && (
                  <div className="eli-warn">⚠️ 유주택 세대는 공공임대 신청이 원칙적으로 불가합니다.</div>
                )}
              </Field>

              <Field label="해당 사항 선택" subtitle="선택한 조건으로 우선공급 대상이 될 수 있어요">
                <div className="eli-chips">
                  {[
                    { v: 'student', label: '대학생' },
                    { v: 'children', label: '자녀 있음' },
                    { v: 'multichild', label: '다자녀(3명+)' },
                    { v: 'parentcare', label: '노부모 부양' },
                    { v: 'disabled', label: '장애인' },
                    { v: 'veteran', label: '국가유공자' },
                  ].map(c => (
                    <button
                      key={c.v}
                      className={`eli-chip ${form.specialCase.includes(c.v) ? 'on' : ''}`}
                      onClick={() => toggleSpecial(c.v)}
                    >{c.label}</button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="eli-form">
              <div className="eli-info-box">
                2026년 기준 {form.household}인 세대의 도시근로자 월평균 소득은 <strong>{({1:350,2:530,3:630,4:730,5:800,6:870}[form.household] || 630).toLocaleString()}만원</strong>으로 산정됩니다.
              </div>

              <Field label="세대 월평균 소득" subtitle="세전, 세대원 합산 (상여 포함)">
                <div className="eli-input-row">
                  <input type="number" className="eli-input" placeholder="예: 420" value={form.income} onChange={e => update('income', e.target.value)} />
                  <span className="eli-suffix">만원 / 월</span>
                </div>
                {form.income && (
                  <div className="eli-hint">
                    도시근로자 소득의 <strong>{Math.round((parseInt(form.income) / ({1:350,2:530,3:630,4:730,5:800,6:870}[form.household] || 630)) * 100)}%</strong> 수준
                  </div>
                )}
              </Field>

              <Field label="세대 총자산" subtitle="부동산·금융·자동차 합산 (부채 차감)">
                <div className="eli-input-row">
                  <input type="number" className="eli-input" placeholder="예: 8000" value={form.assets} onChange={e => update('assets', e.target.value)} />
                  <span className="eli-suffix">만원</span>
                </div>
                <div className="eli-hint">
                  공공임대 자산 기준: <strong>3억 6,100만원 이하</strong>
                </div>
              </Field>

              <Field label="거주 지역">
                <Seg value={form.region} onChange={v => update('region', v)} options={[
                  { v: 'seoul', label: '서울' },
                  { v: 'gyeonggi', label: '경기' },
                  { v: 'incheon', label: '인천' },
                  { v: 'other', label: '기타' },
                ]}/>
              </Field>
            </div>
          )}

          {step === 3 && result && (
            <div className="eli-result">
              <div className="eli-result-summary">
                <div className="eli-result-kicker">판정 완료</div>
                <div className="eli-result-title">
                  신청 가능한 유형 <em>{result.results.filter(r => r.status === 'eligible').length}개</em>
                </div>
                <div className="eli-result-meta">
                  만 {form.age}세 · {form.household}인 세대 · 월소득 {parseInt(form.income).toLocaleString()}만원 (도시근로자 {result.incomeRatio}%)
                </div>
              </div>

              {result.results.map(r => (
                <div key={r.id} className={`eli-card ${r.status}`}>
                  <div className="eli-card-head">
                    <span className={`badge ${r.badge}`} style={{ fontSize: 12, padding: '3px 9px' }}>{r.name}</span>
                    <div className={`eli-card-status ${r.status}`}>
                      {r.status === 'eligible' ? '✓ 신청 가능' : '× 요건 미충족'}
                    </div>
                  </div>
                  {r.fits.length > 0 && (
                    <ul className="eli-card-fits">
                      {r.fits.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  )}
                  {r.reason && (
                    <div className="eli-card-reason">{r.reason}</div>
                  )}
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
            <button className="eli-btn-ghost" onClick={() => setStep(step - 1)}>이전</button>
          )}
          <div style={{ flex: 1 }}/>
          {step === 1 && (
            <button className="eli-btn-primary" disabled={!canNext1} onClick={() => setStep(2)}>다음</button>
          )}
          {step === 2 && (
            <button className="eli-btn-primary" disabled={!canNext2} onClick={() => setStep(3)}>결과 보기</button>
          )}
          {step === 3 && (
            <>
              <button className="eli-btn-ghost" onClick={() => { setStep(1); }}>다시 입력</button>
              <button
                className="eli-btn-primary"
                disabled={result.results.filter(r => r.status === 'eligible').length === 0}
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

function Field({ label, subtitle, children }) {
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

function Seg({ value, onChange, options }) {
  return (
    <div className="eli-seg">
      {options.map(o => (
        <button
          key={o.v}
          className={value === o.v ? 'on' : ''}
          onClick={() => onChange(o.v)}
        >{o.label}</button>
      ))}
    </div>
  );
}

window.EligibilityModal = EligibilityModal;
