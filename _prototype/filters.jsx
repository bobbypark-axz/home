// filters.jsx — 상단 필터 바

const { useState, useRef, useEffect } = React;

const FILTER_CONFIG = {
  type: {
    label: '임대 유형',
    options: [
      { value: 'happy',  label: '행복주택' },
      { value: 'nation', label: '국민임대' },
      { value: 'integ',  label: '통합공공임대' },
    ],
  },
  status: {
    label: '모집 상태',
    options: [
      { value: 'open',     label: '모집중' },
      { value: 'upcoming', label: '모집예정' },
      { value: 'closing',  label: '마감임박' },
    ],
  },
  transit: {
    label: '교통',
    options: [
      { value: '역세권', label: '역세권 (도보 10분)' },
      { value: '버스',   label: '버스 편의' },
    ],
  },
  eligibility: {
    label: '입주 자격',
    options: [
      { value: '청년',   label: '청년' },
      { value: '신혼',   label: '신혼부부' },
      { value: '자녀',   label: '자녀 있는 세대' },
      { value: '다자녀', label: '다자녀' },
      { value: '1인',    label: '1인 가구' },
      { value: '고령',   label: '고령자' },
    ],
  },
  timing: {
    label: '입주 시기',
    options: [
      { value: 'Q2-2026', label: '2026년 2분기' },
      { value: 'Q3-2026', label: '2026년 3분기' },
      { value: 'Q4-2026', label: '2026년 4분기' },
      { value: '2027',    label: '2027년 이후' },
    ],
  },
};

function FilterButton({ filterKey, active, selected, onToggle }) {
  const config = FILTER_CONFIG[filterKey];
  const hasSelection = selected.length > 0;
  const label = hasSelection
    ? (selected.length === 1
        ? config.options.find(o => o.value === selected[0])?.label || config.label
        : `${config.label} ${selected.length}`)
    : config.label;
  return (
    <button
      className={`filter-btn ${hasSelection ? 'active' : ''} ${active ? 'open' : ''}`}
      onClick={onToggle}
    >
      {label}
      <Icon.Chevron size={10} dir={active ? 'up' : 'down'} />
    </button>
  );
}

function FilterPopover({ filterKey, selected, onChange, onClose, anchorLeft }) {
  const config = FILTER_CONFIG[filterKey];
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const toggle = (v) => {
    if (selected.includes(v)) onChange(selected.filter(x => x !== v));
    else onChange([...selected, v]);
  };

  return (
    <div ref={ref} className="filter-popover" style={{ left: anchorLeft }}>
      <div className="popover-title">{config.label}</div>
      <div className="popover-options">
        {config.options.map(opt => (
          <button
            key={opt.value}
            className={`popover-chip ${selected.includes(opt.value) ? 'selected' : ''}`}
            onClick={() => toggle(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="popover-actions">
        <button className="popover-reset" onClick={() => onChange([])}>초기화</button>
        <button className="popover-apply" onClick={onClose}>
          {selected.length > 0 ? `${selected.length}개 적용` : '닫기'}
        </button>
      </div>
    </div>
  );
}

function FilterBar({ filters, setFilters, onReset }) {
  const [openKey, setOpenKey] = useState(null);
  const [anchorLeft, setAnchorLeft] = useState(0);
  const barRef = useRef(null);

  const toggle = (key, e) => {
    if (openKey === key) { setOpenKey(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const barRect = barRef.current.getBoundingClientRect();
    setAnchorLeft(rect.left - barRect.left);
    setOpenKey(key);
  };

  const totalSelected = Object.values(filters).reduce((a, arr) => a + arr.length, 0);

  return (
    <div ref={barRef} className="filterbar">
      {Object.keys(FILTER_CONFIG).map(key => (
        <FilterButton
          key={key}
          filterKey={key}
          active={openKey === key}
          selected={filters[key] || []}
          onToggle={(e) => toggle(key, arguments[0] || window.event)}
        />
      ))}
      {totalSelected > 0 && (
        <button className="filter-reset" onClick={onReset}>
          전체 초기화 · {totalSelected}
        </button>
      )}
      <div style={{ flex: 1 }}></div>
      <div style={{ fontSize: 12, color: 'var(--seed-semantic-color-ink-text-low)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon.Calendar size={12}/> 2026년 4월 기준
      </div>

      {openKey && (
        <FilterPopover
          filterKey={openKey}
          selected={filters[openKey] || []}
          onChange={(next) => setFilters({ ...filters, [openKey]: next })}
          onClose={() => setOpenKey(null)}
          anchorLeft={anchorLeft}
        />
      )}
    </div>
  );
}

// Fix: delegation lost `e` — wrap each button
function FilterBarV2({ filters, setFilters, onReset }) {
  const [openKey, setOpenKey] = useState(null);
  const [anchorLeft, setAnchorLeft] = useState(0);
  const barRef = useRef(null);

  const handleToggle = (key) => (e) => {
    if (openKey === key) { setOpenKey(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const barRect = barRef.current.getBoundingClientRect();
    setAnchorLeft(rect.left - barRect.left);
    setOpenKey(key);
  };

  const totalSelected = Object.values(filters).reduce((a, arr) => a + arr.length, 0);

  return (
    <div ref={barRef} className="filterbar">
      {Object.keys(FILTER_CONFIG).map(key => (
        <FilterButton
          key={key}
          filterKey={key}
          active={openKey === key}
          selected={filters[key] || []}
          onToggle={handleToggle(key)}
        />
      ))}
      {totalSelected > 0 && (
        <button className="filter-reset" onClick={onReset}>
          전체 초기화 · {totalSelected}
        </button>
      )}
      <div style={{ flex: 1 }}></div>
      <div style={{ fontSize: 12, color: 'var(--seed-semantic-color-ink-text-low)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon.Calendar size={12}/> 2026년 4월 기준 · 서울시
      </div>

      {openKey && (
        <FilterPopover
          filterKey={openKey}
          selected={filters[openKey] || []}
          onChange={(next) => setFilters({ ...filters, [openKey]: next })}
          onClose={() => setOpenKey(null)}
          anchorLeft={anchorLeft}
        />
      )}
    </div>
  );
}

window.FilterBar = FilterBarV2;
window.FILTER_CONFIG = FILTER_CONFIG;
