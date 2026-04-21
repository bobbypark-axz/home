// tweaks.jsx — Tweaks 패널 (지도/리스트 모드 토글 등)

function TweaksPanel({ open, mode, setMode, density, setDensity, showLegend, setShowLegend }) {
  return (
    <div className={`tweaks-panel ${open ? 'open' : ''}`}>
      <div className="tweaks-title">
        <span>Tweaks</span>
      </div>

      <div className="tweak-row">
        <span className="tweak-label">보기 모드</span>
        <div className="seg">
          <button className={mode === 'split' ? 'active' : ''} onClick={() => setMode('split')}>
            지도+리스트
          </button>
          <button className={mode === 'list' ? 'active' : ''} onClick={() => setMode('list')}>
            리스트
          </button>
        </div>
      </div>

      <div className="tweak-row">
        <span className="tweak-label">카드 밀도</span>
        <div className="seg">
          <button className={density === 'compact' ? 'active' : ''} onClick={() => setDensity('compact')}>
            compact
          </button>
          <button className={density === 'comfort' ? 'active' : ''} onClick={() => setDensity('comfort')}>
            comfort
          </button>
        </div>
      </div>

      <div className="tweak-row">
        <span className="tweak-label">지도 범례</span>
        <div className="seg">
          <button className={showLegend ? 'active' : ''} onClick={() => setShowLegend(true)}>ON</button>
          <button className={!showLegend ? 'active' : ''} onClick={() => setShowLegend(false)}>OFF</button>
        </div>
      </div>
    </div>
  );
}

window.TweaksPanel = TweaksPanel;
