// detail.jsx — 우측 슬라이드인 상세 패널

function DetailPanel({ item, open, onClose }) {
  const [liked, setLiked] = React.useState(false);
  if (!item) return <div className={`detail-panel ${open ? 'open' : ''}`}/>;

  const svg = window.thumbnailSVG(item.thumbSeed, item.type);
  const status = window.STATUS_LABELS[item.status];

  const calcDday = () => {
    const [y, m, d] = item.deadline.split('.').map(Number);
    const diff = Math.round((new Date(y, m - 1, d) - new Date(2026, 3, 19)) / 86400000);
    if (diff < 0) return '마감';
    if (diff === 0) return 'D-DAY';
    return `D-${diff}`;
  };

  // 임대 조건표 dummy
  const unitTable = [
    { type: '전용 24㎡', units: 18, deposit: Math.round(item.deposit * 0.6), rent: Math.round(item.rent * 0.55) },
    { type: `전용 ${item.area}`, units: 42, deposit: item.deposit, rent: item.rent },
    { type: '전용 51㎡', units: 24, deposit: Math.round(item.deposit * 1.3), rent: Math.round(item.rent * 1.25) },
  ];

  return (
    <aside className={`detail-panel ${open ? 'open' : ''}`}>
      <button className="detail-close" onClick={onClose}>
        <Icon.Close size={16}/>
      </button>

      <div className="detail-hero" dangerouslySetInnerHTML={{ __html: svg }}>
      </div>

      <div className="detail-body">
        <div className="detail-eyebrow">
          <span className="detail-agency-tag">{item.agency} · {item.district}</span>
        </div>
        <h1 className="detail-title">{item.title}</h1>
        <div className="detail-address">{item.address}</div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {window.HOUSING_TYPES.find(t => t.id === item.type) && (
            <span className={`badge ${window.HOUSING_TYPES.find(t => t.id === item.type).badge}`} style={{ fontSize: 12, padding: '4px 9px' }}>
              {window.HOUSING_TYPES.find(t => t.id === item.type).name}
            </span>
          )}
          <span className="badge agency" style={{ fontSize: 12, padding: '4px 9px' }}>{item.agency} 공급</span>
          <span className="badge" style={{
            fontSize: 12, padding: '4px 9px',
            background: status.color + '22',
            color: status.color,
          }}>
            · {status.text}
          </span>
        </div>

        <div className="detail-deadline">
          <div>
            <div className="detail-deadline-label">모집 마감</div>
            <div className="detail-deadline-date">{item.deadline.replace(/\./g, '. ')} 18:00까지</div>
          </div>
          <div className="detail-deadline-dday">{calcDday()}</div>
        </div>

        <div className="detail-price">
          <div className="detail-price-cell">
            <div className="detail-price-label">보증금</div>
            <div className="detail-price-value">{item.deposit.toLocaleString()}만원</div>
          </div>
          <div className="detail-price-cell">
            <div className="detail-price-label">월 임대료</div>
            <div className="detail-price-value">{item.rent}만원</div>
          </div>
          <div className="detail-price-cell">
            <div className="detail-price-label">관리비</div>
            <div className="detail-price-value">별도</div>
          </div>
        </div>

        <section className="detail-section">
          <h3>입주 자격</h3>
          <div className="detail-eligibility">
            {item.eligible.map(e => (
              <span key={e} className={`eli-pill ${e === '청년' ? 'match' : ''}`}>
                {e === '청년' && '✓'} {window.ELIGIBILITY_LABELS[e] || e}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--seed-semantic-color-ink-text-low)', marginTop: 6 }}>
            · 소득 기준 전년도 도시근로자 월평균 소득 100~150% 이하 · 무주택 세대구성원
          </div>
        </section>

        <section className="detail-section">
          <h3>기본 정보</h3>
          <dl className="detail-specs">
            <dt>공급 규모</dt><dd>총 84세대 (전용 24·{item.area}·51㎡)</dd>
            <dt>구조</dt><dd>{item.layout} · 전용 {item.area}</dd>
            <dt>준공</dt><dd>2024년 11월 (신축)</dd>
            <dt>세대당 주차</dt><dd>0.8대</dd>
            <dt>난방</dt><dd>개별난방 · 도시가스</dd>
            <dt>엘리베이터</dt><dd>있음</dd>
            <dt>계약 기간</dt><dd>기본 2년 · 갱신 최대 10년</dd>
            <dt>입주 예정</dt><dd>2026년 8월</dd>
          </dl>
        </section>

        <section className="detail-section">
          <h3>호실별 임대 조건 <span className="count">총 {unitTable.reduce((a,u) => a+u.units, 0)}세대</span></h3>
          <table className="detail-unit-table">
            <thead>
              <tr><th>구조</th><th>세대수</th><th>보증금(만원)</th><th>월세(만원)</th></tr>
            </thead>
            <tbody>
              {unitTable.map((u, i) => (
                <tr key={i}>
                  <td>{u.type}</td>
                  <td>{u.units}</td>
                  <td>{u.deposit.toLocaleString()}</td>
                  <td className={i === 1 ? 'pop' : ''}>{u.rent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="detail-section">
          <h3>입지·편의</h3>
          <div className="detail-feat-row">
            <div className="feat-chip"><Icon.Train size={12}/>{item.transit}</div>
            {item.features.map(f => (
              <div key={f} className="feat-chip">#{f}</div>
            ))}
            {item.competition && (
              <div className="feat-chip" style={{
                borderColor: 'var(--seed-scale-color-carrot-200)',
                background: 'var(--seed-semantic-color-primary-low)',
                color: 'var(--seed-scale-color-carrot-700)',
                fontWeight: 600,
              }}>
                지난 회차 경쟁률 {item.competition}:1
              </div>
            )}
          </div>
        </section>

        <section className="detail-section">
          <h3>신청 방법</h3>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.75, color: 'var(--seed-semantic-color-ink-text)' }}>
            <li>{item.agency} 청약 플랫폼에서 회원가입 및 공인인증</li>
            <li>모집공고 기간 내 온라인 청약 신청서 제출</li>
            <li>서류 제출 (주민등록, 소득 증빙 등)</li>
            <li>소득·자산 조사 및 당첨자 발표</li>
            <li>계약 체결 및 입주</li>
          </ol>
        </section>

        <div className="detail-actions">
          <button
            className={`icon-btn ${liked ? 'active' : ''}`}
            onClick={() => setLiked(!liked)}
            aria-label="관심 목록"
          >
            <Icon.Heart size={20} filled={liked}/>
          </button>
          <button className="secondary">공고문 원문 보기</button>
          <button className="primary">청약 신청하기 →</button>
        </div>
      </div>
    </aside>
  );
}

window.DetailPanel = DetailPanel;
