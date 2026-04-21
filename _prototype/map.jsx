// map.jsx — 지도 영역: 구별 집계 마커 + 선택된 구의 개별 매물 핀

const { useMemo: useMemoMap } = React;

function MapView({
  districtCounts, activeDistrict, onDistrictClick, onDistrictClear,
  pins, hoveredId, selectedId, onPinHover, onPinClick,
}) {
  // 마커 크기 단계
  const sizeClass = (count) => {
    if (count >= 50) return 'size-lg';
    if (count >= 25) return 'size-md';
    return 'size-sm';
  };

  const activeDistObj = activeDistrict
    ? window.DISTRICTS.find(d => d.id === activeDistrict)
    : null;

  return (
    <div className="map-wrap">
      <div
        className="map-svg"
        dangerouslySetInnerHTML={{ __html: window.SEOUL_MAP_SVG }}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* 구별 집계 마커 (활성 구가 없을 때만) */}
      {!activeDistrict && window.DISTRICTS.map(d => {
        const count = districtCounts[d.id] || 0;
        if (count === 0) return null;
        return (
          <div
            key={d.id}
            className="map-marker-wrap"
            style={{ left: `${d.x}%`, top: `${d.y}%` }}
            onClick={() => onDistrictClick(d.id)}
          >
            <div className={`map-marker ${sizeClass(count)}`}>
              {count}
              <span className="label">{d.name.replace('구','')}</span>
            </div>
          </div>
        );
      })}

      {/* 개별 매물 핀 (활성 구가 있을 때) */}
      {activeDistrict && pins.map(p => (
        <div
          key={p.id}
          className={`map-pin-wrap ${hoveredId === p.id ? 'hovered' : ''} ${selectedId === p.id ? 'selected' : ''}`}
          style={{ left: `${p.mapX}%`, top: `${p.mapY}%` }}
          onMouseEnter={() => onPinHover(p.id)}
          onMouseLeave={() => onPinHover(null)}
          onClick={() => onPinClick(p.id)}
        >
          <div className="map-pin">
            보 {p.deposit.toLocaleString()} / 월 {p.rent}
          </div>
        </div>
      ))}

      {/* 활성 구 배너 */}
      {activeDistObj && (
        <div className="map-active-region">
          <Icon.Pin size={13}/>
          {activeDistObj.name} · <strong style={{ color: 'var(--seed-semantic-color-primary)' }}>{pins.length}건</strong>
          <button className="close" onClick={onDistrictClear} aria-label="전체 보기로 돌아가기">
            <Icon.Close size={10}/>
          </button>
        </div>
      )}

      {/* 범례 */}
      {!activeDistrict && (
        <div className="map-legend">
          <div className="legend-title">모집중 단지 수</div>
          <div className="legend-row"><span className="legend-dot sm" style={{ background: '#ff6f0f' }}/>~24개</div>
          <div className="legend-row"><span className="legend-dot" style={{ background: '#ff6f0f' }}/>25~49개</div>
          <div className="legend-row"><span className="legend-dot lg" style={{ background: '#ff6f0f' }}/>50개 이상</div>
        </div>
      )}

      {/* 줌 컨트롤 */}
      <div className="map-zoom">
        <button>+</button>
        <button>−</button>
      </div>

      {/* 내 위치 */}
      <button className="map-recenter">
        <Icon.Locate size={13}/> 내 위치
      </button>
    </div>
  );
}

window.MapView = MapView;
