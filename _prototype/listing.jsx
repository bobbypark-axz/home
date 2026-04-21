// listing.jsx — 좌측 리스트 패널

function statusPill(status) {
  const s = window.STATUS_LABELS[status];
  if (!s) return null;
  const cls = status === 'closing' ? 'card-status-pill urgent' : 'card-status-pill';
  return <div className={cls}>{s.text}</div>;
}

function typeBadge(type) {
  const t = window.HOUSING_TYPES.find(x => x.id === type);
  if (!t) return null;
  return <span className={`badge ${t.badge}`}>{t.name}</span>;
}

function dDayText(deadline, status) {
  if (status === 'upcoming') return '모집 예정';
  if (status === 'closed') return '마감';
  const [y, m, d] = deadline.split('.').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date(2026, 3, 19);
  const diff = Math.round((target - today) / 86400000);
  if (diff < 0) return '마감';
  if (diff === 0) return 'D-DAY';
  return `D-${diff}`;
}

function ListingCard({ item, hovered, selected, onHover, onClick }) {
  const svg = window.thumbnailSVG(item.thumbSeed, item.type);
  return (
    <article
      className={`card ${hovered ? 'hovered' : ''} ${selected ? 'selected' : ''}`}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(item.id)}
    >
      <div className="card-thumb" dangerouslySetInnerHTML={{ __html: svg }}>
      </div>
      <div className="card-body">
        <div className="card-type-row">
          {typeBadge(item.type)}
          <span className="badge agency">{item.agency}</span>
          <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: window.STATUS_LABELS[item.status]?.color }}>
            {dDayText(item.deadline, item.status)}
          </div>
        </div>
        <div className="card-title">{item.title}</div>
        <div className="card-price">
          <strong>보증금 {item.deposit.toLocaleString()}만</strong>
          <span className="sep">·</span>
          <span>월세 {item.rent}만</span>
        </div>
        <div className="card-meta">
          {item.layout}
          <span className="dot">·</span>
          {item.area}
          <span className="dot">·</span>
          {item.district}
        </div>
        <div className="card-foot">
          <span className="eligibility">
            {item.eligible.map(e => window.ELIGIBILITY_LABELS[e]?.split('·')[0] || e).slice(0, 2).join(' · ')}
          </span>
          {item.competition && (
            <>
              <span style={{ color: 'var(--seed-scale-color-gray-400)' }}>·</span>
              <span>전년 경쟁률 {item.competition}:1</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function ListingPanel({ items, sort, setSort, hoveredId, selectedId, onHover, onSelect, activeDistrict }) {
  const [loadedCount, setLoadedCount] = React.useState(15);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    setLoadedCount(15); // reset on filter change
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [items.length, activeDistrict]);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      setLoadedCount(c => Math.min(c + 10, items.length));
    }
  };

  const visible = items.slice(0, loadedCount);

  const sortOptions = [
    { id: 'recent',   label: '최신순' },
    { id: 'deadline', label: '마감임박' },
    { id: 'low-rent', label: '월세 낮은순' },
    { id: 'low-depo', label: '보증금 낮은순' },
  ];

  return (
    <div className="listing" ref={scrollRef} onScroll={handleScroll}>
      <div className="listing-head">
        <div className="listing-count">
          총 <em>{items.length.toLocaleString()}</em>개의 공공임대 매물
        </div>
        <div className="listing-sort">
          {sortOptions.map(opt => (
            <button
              key={opt.id}
              className={`sort-chip ${sort === opt.id ? 'active' : ''}`}
              onClick={() => setSort(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="listing-items">
        {visible.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--seed-semantic-color-ink-text-low)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>조건에 맞는 매물이 없어요</div>
            <div style={{ fontSize: 12 }}>필터를 조정하거나 지도에서 다른 구를 눌러보세요.</div>
          </div>
        )}
        {visible.map(item => (
          <ListingCard
            key={item.id}
            item={item}
            hovered={hoveredId === item.id}
            selected={selectedId === item.id}
            onHover={onHover}
            onClick={onSelect}
          />
        ))}
        {loadedCount < items.length && (
          <div className="scroll-sentinel">
            <div className="spinner" style={{
              width: 20, height: 20, margin: '0 auto 8px',
              border: '2px solid var(--seed-scale-color-gray-200)',
              borderTopColor: 'var(--seed-semantic-color-primary)',
              borderRadius: '50%', animation: 'spin .8s linear infinite',
            }}/>
            더 불러오는 중…
          </div>
        )}
        {loadedCount >= items.length && items.length > 0 && (
          <div className="scroll-sentinel">
            · 모든 매물을 확인했어요 ·
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

window.ListingPanel = ListingPanel;
