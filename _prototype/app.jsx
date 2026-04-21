// app.jsx — 전체 앱 조립

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "split",
  "density": "comfort",
  "showLegend": true
}/*EDITMODE-END*/;

function App() {
  // 필터
  const [filters, setFilters] = React.useState({
    type: [], status: [], transit: [], eligibility: [], timing: [],
  });
  const [sort, setSort] = React.useState('deadline');
  const [activeDistrict, setActiveDistrict] = React.useState(null);
  const [hoveredId, setHoveredId] = React.useState(null);
  const [selectedId, setSelectedId] = React.useState(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  // Tweaks
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [eliOpen, setEliOpen] = React.useState(false);
  const [mode, setMode] = React.useState(TWEAK_DEFAULTS.mode);
  const [density, setDensity] = React.useState(TWEAK_DEFAULTS.density);
  const [showLegend, setShowLegend] = React.useState(TWEAK_DEFAULTS.showLegend);

  // Edit-mode protocol
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const persistTweak = (keys) => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: keys }, '*');
  };

  // Filter + sort 적용
  const filtered = React.useMemo(() => {
    let list = window.LISTINGS.slice();
    if (filters.type.length)        list = list.filter(x => filters.type.includes(x.type));
    if (filters.status.length)      list = list.filter(x => filters.status.includes(x.status));
    if (filters.transit.length) {
      list = list.filter(x =>
        filters.transit.some(t => x.features.includes(t) || x.transit.includes(t === '역세권' ? '도보' : '버스'))
      );
    }
    if (filters.eligibility.length) list = list.filter(x => x.eligible.some(e => filters.eligibility.includes(e)));
    // timing filter is dummy
    if (activeDistrict) list = list.filter(x => x.districtId === activeDistrict);

    // sort
    if (sort === 'deadline') {
      list.sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));
    } else if (sort === 'low-rent') {
      list.sort((a, b) => a.rent - b.rent);
    } else if (sort === 'low-depo') {
      list.sort((a, b) => a.deposit - b.deposit);
    } else {
      list.sort((a, b) => a.id.localeCompare(b.id));
    }
    return list;
  }, [filters, sort, activeDistrict]);

  // 구별 집계 (활성 구가 없을 때 사용)
  const districtCounts = React.useMemo(() => {
    const map = {};
    // 구 필터 없이, 현재 필터만 적용한 리스트를 기준으로 집계
    let list = window.LISTINGS.slice();
    if (filters.type.length)        list = list.filter(x => filters.type.includes(x.type));
    if (filters.status.length)      list = list.filter(x => filters.status.includes(x.status));
    if (filters.eligibility.length) list = list.filter(x => x.eligible.some(e => filters.eligibility.includes(e)));
    list.forEach(x => {
      map[x.districtId] = (map[x.districtId] || 0) + (x.districtId === 'gangseo' ? 8 : x.districtId === 'songpa' ? 10 : 6) + 1;
    });
    // 실제 리스트 개수와 상관없이 전체 구별 모집중 단지수 목업 (매물 수보다 큼)
    window.DISTRICTS.forEach(d => {
      if (!map[d.id]) map[d.id] = 0;
      // blend with mocked district.count
      if (map[d.id] > 0) map[d.id] = Math.max(map[d.id], Math.round(d.count * 0.5));
      else if (filters.type.length === 0 && filters.status.length === 0 && filters.eligibility.length === 0) {
        map[d.id] = d.count;
      }
    });
    return map;
  }, [filters]);

  const resetFilters = () => setFilters({ type: [], status: [], transit: [], eligibility: [], timing: [] });

  const selectedItem = filtered.find(x => x.id === selectedId) || window.LISTINGS.find(x => x.id === selectedId);

  const handleSelect = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div className="app">
      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">보</div>
          <span className="brand-name">보금</span>
          <span className="brand-gov">공공임대</span>
        </div>
        <button className="region-btn">
          <Icon.Pin size={13}/>
          서울특별시 전체
          <Icon.Chevron size={9}/>
        </button>
        <div className="topbar-spacer"/>
        <button className="topbar-cta" onClick={() => setEliOpen(true)}>
          <span className="dot"/> 내 자격 확인
        </button>
        <div className="topbar-auth">
          <button className="ghost">내 청약 내역</button>
          <button className="ghost">관심 목록</button>
          <button className="primary">로그인 / 회원가입</button>
        </div>
      </header>

      {/* Filters */}
      <FilterBar filters={filters} setFilters={setFilters} onReset={resetFilters}/>

      {/* Main */}
      <div className={`main ${mode === 'list' ? 'list-mode' : ''}`}>
        <ListingPanel
          items={filtered}
          sort={sort}
          setSort={setSort}
          hoveredId={hoveredId}
          selectedId={selectedId}
          activeDistrict={activeDistrict}
          onHover={setHoveredId}
          onSelect={handleSelect}
        />

        {mode === 'split' && (
          <MapView
            districtCounts={districtCounts}
            activeDistrict={activeDistrict}
            onDistrictClick={(id) => { setActiveDistrict(id); }}
            onDistrictClear={() => setActiveDistrict(null)}
            pins={filtered}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onPinHover={setHoveredId}
            onPinClick={handleSelect}
          />
        )}

        <DetailPanel
          item={selectedItem}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        />

        {/* Mode toggle — on map only */}
        {mode === 'split' && (
          <div className="mode-toggle">
            <button className={mode === 'split' ? 'active' : ''} onClick={() => { setMode('split'); persistTweak({ mode: 'split' }); }}>
              <Icon.Map size={13}/> 지도
            </button>
            <button className={mode === 'list' ? 'active' : ''} onClick={() => { setMode('list'); persistTweak({ mode: 'list' }); }}>
              <Icon.List size={13}/> 리스트
            </button>
          </div>
        )}
        {mode === 'list' && (
          <button
            onClick={() => { setMode('split'); persistTweak({ mode: 'split' }); }}
            style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(33,33,36,.92)', color: 'white',
              padding: '10px 18px', borderRadius: 999,
              fontSize: 13, fontWeight: 600, display: 'inline-flex',
              alignItems: 'center', gap: 6, zIndex: 10,
              boxShadow: '0 6px 20px rgba(0,0,0,.2)',
            }}
          >
            <Icon.Map size={13}/> 지도로 보기
          </button>
        )}
      </div>

      <EligibilityModal
        open={eliOpen}
        onClose={() => setEliOpen(false)}
        onApplyFilter={(types) => setFilters({ ...filters, type: types })}
      />

      <TweaksPanel
        open={tweaksOpen}
        mode={mode} setMode={(v) => { setMode(v); persistTweak({ mode: v }); }}
        density={density} setDensity={(v) => { setDensity(v); persistTweak({ density: v }); }}
        showLegend={showLegend} setShowLegend={(v) => { setShowLegend(v); persistTweak({ showLegend: v }); }}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
