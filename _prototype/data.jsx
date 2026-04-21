// data.jsx — 공공임대주택 목업 데이터
// 모든 좌표는 style에 설정된 .map-wrap 기준 0~100% (배경 SVG 위)
// Seoul districts layout 기준: 용산/서대문/성동/강남/송파/동대문 등

const DISTRICTS = [
  // name, mapX%, mapY%, count
  { id: 'gangseo',  name: '강서구',  x: 10,   y: 52, count: 42 },
  { id: 'yangcheon',name: '양천구',  x: 18,   y: 62, count: 28 },
  { id: 'guro',     name: '구로구',  x: 22,   y: 70, count: 36 },
  { id: 'geumcheon',name: '금천구',  x: 30,   y: 82, count: 19 },
  { id: 'gwanak',   name: '관악구',  x: 40,   y: 78, count: 31 },
  { id: 'dongjak',  name: '동작구',  x: 44,   y: 66, count: 23 },
  { id: 'yeongdeungpo', name: '영등포구', x: 30, y: 60, count: 54 },
  { id: 'mapo',     name: '마포구',  x: 32,   y: 42, count: 46 },
  { id: 'eunpyeong',name: '은평구',  x: 30,   y: 22, count: 38 },
  { id: 'seodaemun',name: '서대문구', x: 40,   y: 34, count: 29 },
  { id: 'jongno',   name: '종로구',  x: 49,   y: 32, count: 18 },
  { id: 'junggu',   name: '중구',    x: 53,   y: 42, count: 14 },
  { id: 'yongsan',  name: '용산구',  x: 50,   y: 52, count: 22 },
  { id: 'seongbuk', name: '성북구',  x: 56,   y: 26, count: 34 },
  { id: 'gangbuk',  name: '강북구',  x: 52,   y: 14, count: 27 },
  { id: 'dobong',   name: '도봉구',  x: 62,   y:  8, count: 21 },
  { id: 'nowon',    name: '노원구',  x: 72,   y: 16, count: 49 },
  { id: 'jungnang', name: '중랑구',  x: 74,   y: 30, count: 33 },
  { id: 'dongdaemun', name: '동대문구', x: 62, y: 38, count: 26 },
  { id: 'seongdong',name: '성동구',  x: 60,   y: 50, count: 31 },
  { id: 'gwangjin', name: '광진구',  x: 70,   y: 52, count: 24 },
  { id: 'gangdong', name: '강동구',  x: 88,   y: 54, count: 37 },
  { id: 'songpa',   name: '송파구',  x: 80,   y: 66, count: 58 },
  { id: 'gangnam',  name: '강남구',  x: 70,   y: 68, count: 25 },
  { id: 'seocho',   name: '서초구',  x: 58,   y: 72, count: 30 },
];

// 임대 유형
const HOUSING_TYPES = [
  { id: 'happy',  name: '행복주택',     badge: 'happy'  },
  { id: 'nation', name: '국민임대',     badge: 'nation' },
  { id: 'integ',  name: '통합공공임대', badge: 'integ'  },
];

const AGENCIES = ['LH', 'SH', 'GH'];

const STATUS_LABELS = {
  open:     { text: '모집중',     color: '#1aa174' },
  upcoming: { text: '모집예정',   color: '#c27f29' },
  closing:  { text: '마감임박',   color: '#ff4133' },
  closed:   { text: '마감',       color: '#868b94' },
};

// 매물 데이터
function genListings() {
  const seed = [
    ['행복주택 가양9단지',     'happy',  'SH', 'gangseo',       '서울 강서구 가양동', [1500,  90], '19.2㎡', '원룸', 'open',     '2026.04.30', ['청년','신혼'], ['역세권','1인가구'], '가양역 도보 4분', 20.7],
    ['국민임대 마곡엠밸리3단지', 'nation', 'LH', 'gangseo',       '서울 강서구 마곡동', [4800, 180], '46.9㎡', '투룸', 'open',     '2026.05.12', ['신혼','자녀'], ['초품아','신축'],  '마곡나루역 도보 7분', 12.4],
    ['통합공공임대 구로항동',    'integ',  'LH', 'guro',          '서울 구로구 항동',   [6200, 220], '59.8㎡', '쓰리룸','open',    '2026.05.03', ['가구','다자녀'],['공원','신축'],     '천왕역 도보 9분', 6.8],
    ['행복주택 금천한내',        'happy',  'SH', 'geumcheon',     '서울 금천구 독산동', [2100, 110], '26.5㎡', '투룸', 'closing',  '2026.04.22', ['청년','신혼'], ['역세권','편의'],   '독산역 도보 6분', 18.2],
    ['국민임대 관악신림',        'nation', 'LH', 'gwanak',        '서울 관악구 신림동', [3400, 150], '39.7㎡', '투룸', 'open',     '2026.05.20', ['신혼','자녀'], ['역세권'],          '신림역 도보 5분', 9.5],
    ['행복주택 영등포당산',      'happy',  'SH', 'yeongdeungpo',  '서울 영등포구 당산동',[1800,  95], '17.4㎡', '원룸', 'open',     '2026.05.08', ['청년'],        ['역세권','버스'],   '당산역 도보 3분', 25.3],
    ['통합공공임대 영등포문래',  'integ',  'SH', 'yeongdeungpo',  '서울 영등포구 문래동',[5500, 200], '49.3㎡', '투룸', 'upcoming', '2026.06.01', ['가구','신혼'], ['공원','편의'],     '문래역 도보 8분', null],
    ['국민임대 상암월드컵',      'nation', 'SH', 'mapo',          '서울 마포구 상암동', [4200, 170], '44.2㎡', '투룸', 'open',     '2026.05.15', ['신혼','자녀'], ['공원','학군'],     '월드컵경기장역 도보 6분', 7.1],
    ['행복주택 은평뉴타운',      'happy',  'SH', 'eunpyeong',     '서울 은평구 진관동', [2400, 120], '29.8㎡', '투룸', 'open',     '2026.04.29', ['청년','신혼'], ['공원','신축'],     '구파발역 도보 10분', 15.6],
    ['국민임대 서대문홍은',      'nation', 'LH', 'seodaemun',     '서울 서대문구 홍은동',[3800, 160], '41.1㎡', '투룸', 'closing',  '2026.04.25', ['신혼','자녀'], ['학군'],            '홍제역 도보 12분', 11.2],
    ['통합공공임대 용산청파',    'integ',  'LH', 'yongsan',       '서울 용산구 청파동', [6800, 240], '46.5㎡', '투룸', 'open',     '2026.05.18', ['가구','신혼'], ['역세권','신축'],   '남영역 도보 4분', 5.3],
    ['행복주택 성북장위',        'happy',  'SH', 'seongbuk',      '서울 성북구 장위동', [2000, 105], '18.9㎡', '원룸', 'open',     '2026.05.06', ['청년','1인'],   ['역세권','편의'],   '돌곶이역 도보 7분', 22.8],
    ['국민임대 노원중계',        'nation', 'LH', 'nowon',         '서울 노원구 중계동', [3200, 140], '38.6㎡', '투룸', 'open',     '2026.05.22', ['신혼','자녀'], ['학군','공원'],     '중계역 도보 8분', 10.4],
    ['행복주택 도봉창동',        'happy',  'SH', 'dobong',        '서울 도봉구 창동',   [1900, 100], '17.8㎡', '원룸', 'closing',  '2026.04.23', ['청년'],         ['역세권'],          '창동역 도보 3분', 28.5],
    ['통합공공임대 중랑면목',    'integ',  'LH', 'jungnang',      '서울 중랑구 면목동', [5200, 190], '52.7㎡', '투룸', 'open',     '2026.05.25', ['가구','자녀'], ['초품아'],          '사가정역 도보 9분', 8.2],
    ['국민임대 동대문전농',      'nation', 'SH', 'dongdaemun',    '서울 동대문구 전농동',[4100, 175], '42.8㎡', '투룸', 'open',     '2026.05.10', ['신혼','자녀'], ['역세권','학군'],   '청량리역 도보 11분', 9.8],
    ['행복주택 성수뚝섬',        'happy',  'SH', 'seongdong',     '서울 성동구 성수동', [2600, 130], '22.4㎡', '원룸', 'closing',  '2026.04.21', ['청년','신혼'], ['역세권','편의'],   '뚝섬역 도보 5분', 31.2],
    ['통합공공임대 광진자양',    'integ',  'SH', 'gwangjin',      '서울 광진구 자양동', [5800, 210], '56.3㎡', '쓰리룸','open',    '2026.06.03', ['가구','다자녀'],['공원','학군'],    '건대입구역 도보 10분', null],
    ['국민임대 강동성내',        'nation', 'LH', 'gangdong',      '서울 강동구 성내동', [3900, 165], '42.1㎡', '투룸', 'upcoming', '2026.06.08', ['신혼','자녀'], ['공원'],            '강동구청역 도보 7분', null],
    ['행복주택 송파문정',        'happy',  'SH', 'songpa',        '서울 송파구 문정동', [2800, 140], '26.8㎡', '투룸', 'open',     '2026.05.17', ['청년','신혼'], ['역세권','신축'],   '문정역 도보 4분', 19.4],
    ['국민임대 송파거여',        'nation', 'LH', 'songpa',        '서울 송파구 거여동', [4500, 185], '45.7㎡', '투룸', 'open',     '2026.05.29', ['신혼','자녀'], ['학군','공원'],     '거여역 도보 8분', 8.9],
    ['행복주택 강남세곡',        'happy',  'SH', 'gangnam',       '서울 강남구 세곡동', [2500, 125], '24.6㎡', '원룸', 'open',     '2026.04.28', ['청년'],        ['공원'],            '수서역 도보 14분', 26.7],
    ['통합공공임대 서초내곡',    'integ',  'SH', 'seocho',        '서울 서초구 내곡동', [6400, 235], '58.2㎡', '쓰리룸','open',    '2026.05.28', ['가구','다자녀'],['공원','학군'],    '양재시민의숲역 도보 15분', 6.2],
    ['행복주택 동작상도',        'happy',  'SH', 'dongjak',       '서울 동작구 상도동', [2200, 115], '21.3㎡', '원룸', 'closing',  '2026.04.24', ['청년','신혼'], ['역세권'],          '상도역 도보 6분', 24.1],
    ['국민임대 양천목동',        'nation', 'SH', 'yangcheon',     '서울 양천구 목동',   [4400, 180], '43.8㎡', '투룸', 'open',     '2026.05.11', ['신혼','자녀'], ['학군','공원'],     '목동역 도보 9분', 11.8],
    ['행복주택 종로창신',        'happy',  'SH', 'jongno',        '서울 종로구 창신동', [2100, 108], '19.6㎡', '원룸', 'open',     '2026.05.04', ['청년','1인'],   ['역세권'],          '동묘앞역 도보 5분', 23.5],
  ];

  return seed.map((row, i) => {
    const [title, type, agency, districtId, address, [deposit, rent], area, layout, status, deadline, eligible, features, transit, competition] = row;
    const dist = DISTRICTS.find(d => d.id === districtId);
    return {
      id: 'listing-' + (i + 1),
      title, type, agency, districtId,
      district: dist?.name || '',
      // 해당 구 중심 + 살짝의 jitter
      mapX: (dist?.x || 50) + (Math.sin(i * 2.3) * 2.5),
      mapY: (dist?.y || 50) + (Math.cos(i * 1.7) * 2.5),
      address,
      deposit, rent,
      area, layout,
      status, deadline,
      eligible, features, transit,
      competition,
      thumbSeed: i,
    };
  });
}

const LISTINGS = genListings();

// 지도의 서울 배경 — 간단한 stylized shape
const SEOUL_MAP_SVG = `
<svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
      <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(0,0,0,.025)" stroke-width=".2"/>
    </pattern>
    <linearGradient id="landGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f4f6ee"/>
      <stop offset="100%" stop-color="#eaf1e3"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#landGrad)"/>
  <rect width="100" height="100" fill="url(#grid)"/>
  <!-- Han River -->
  <path d="M -2,56 Q 12,52 22,56 Q 34,62 44,58 Q 54,52 62,54 Q 72,56 80,58 Q 90,60 102,58 L 102,64 Q 90,66 80,64 Q 72,62 62,60 Q 54,58 44,62 Q 34,66 22,62 Q 12,58 -2,62 Z"
        fill="#cce3f4" stroke="#a8d3ee" stroke-width=".3"/>
  <!-- abstract district outlines (dashed, very subtle) -->
  <g fill="none" stroke="rgba(0,0,0,.08)" stroke-width=".15" stroke-dasharray="0.6 0.4">
    <path d="M 0,30 L 25,28 L 30,12 L 42,8 L 50,22 L 60,18 L 70,10 L 78,20 L 80,35 L 90,40 L 95,30 L 100,38" />
    <path d="M 10,48 L 18,50 L 25,55 L 36,48 L 42,54 L 52,48 L 60,50 L 65,42 L 72,48 L 80,52 L 90,48" />
    <path d="M 0,72 L 15,68 L 22,76 L 35,72 L 44,76 L 52,70 L 60,76 L 68,70 L 78,74 L 90,72 L 100,78" />
    <path d="M 20,88 L 32,90 L 44,86 L 55,90 L 66,88 L 78,92 L 88,88" />
  </g>
  <!-- Labels for neighborhoods -->
  <g fill="rgba(68,76,92,.55)" font-size="2.2" font-family="Pretendard, sans-serif" font-weight="500" text-anchor="middle">
    <text x="30" y="20">은평</text>
    <text x="50" y="30">종로</text>
    <text x="65" y="26">성북</text>
    <text x="75" y="16">노원</text>
    <text x="32" y="46">마포</text>
    <text x="52" y="50">용산</text>
    <text x="62" y="50">성동</text>
    <text x="72" y="52">광진</text>
    <text x="30" y="64">영등포</text>
    <text x="45" y="68">동작</text>
    <text x="70" y="68">강남</text>
    <text x="80" y="66">송파</text>
    <text x="88" y="56">강동</text>
    <text x="40" y="80">관악</text>
    <text x="30" y="84">금천</text>
    <text x="58" y="74">서초</text>
  </g>
</svg>
`;

// Thumbnail placeholder — abstract architectural
function thumbnailSVG(seed, type) {
  const palettes = {
    happy:  ['#ffd2b9', '#ffbc97', '#ff9e66', '#cc4700'],
    nation: ['#d2edfa', '#87d7ff', '#57c7ff', '#0088cc'],
    integ:  ['#c7f2e4', '#96ebc3', '#6adeac', '#077a5e'],
  };
  const p = palettes[type] || palettes.happy;
  const sky = p[0];
  const bg  = p[1];
  const fg  = p[2];
  const ac  = p[3];
  const variant = seed % 3;
  let buildings;
  if (variant === 0) {
    buildings = `
      <rect x="10" y="40" width="28" height="55" fill="${fg}" rx="1"/>
      <rect x="44" y="28" width="24" height="67" fill="${bg}" rx="1"/>
      <rect x="74" y="48" width="20" height="47" fill="${fg}" rx="1"/>
      <g fill="${ac}" opacity=".75">
        <rect x="14" y="46" width="3" height="3"/><rect x="20" y="46" width="3" height="3"/><rect x="26" y="46" width="3" height="3"/><rect x="32" y="46" width="3" height="3"/>
        <rect x="14" y="54" width="3" height="3"/><rect x="20" y="54" width="3" height="3"/><rect x="26" y="54" width="3" height="3"/><rect x="32" y="54" width="3" height="3"/>
        <rect x="14" y="62" width="3" height="3"/><rect x="20" y="62" width="3" height="3"/><rect x="26" y="62" width="3" height="3"/><rect x="32" y="62" width="3" height="3"/>
        <rect x="14" y="70" width="3" height="3"/><rect x="20" y="70" width="3" height="3"/><rect x="26" y="70" width="3" height="3"/><rect x="32" y="70" width="3" height="3"/>
        <rect x="14" y="78" width="3" height="3"/><rect x="20" y="78" width="3" height="3"/><rect x="26" y="78" width="3" height="3"/><rect x="32" y="78" width="3" height="3"/>
        <rect x="48" y="34" width="3" height="3"/><rect x="54" y="34" width="3" height="3"/><rect x="60" y="34" width="3" height="3"/>
        <rect x="48" y="42" width="3" height="3"/><rect x="54" y="42" width="3" height="3"/><rect x="60" y="42" width="3" height="3"/>
        <rect x="48" y="50" width="3" height="3"/><rect x="54" y="50" width="3" height="3"/><rect x="60" y="50" width="3" height="3"/>
        <rect x="48" y="58" width="3" height="3"/><rect x="54" y="58" width="3" height="3"/><rect x="60" y="58" width="3" height="3"/>
        <rect x="48" y="66" width="3" height="3"/><rect x="54" y="66" width="3" height="3"/><rect x="60" y="66" width="3" height="3"/>
        <rect x="48" y="74" width="3" height="3"/><rect x="54" y="74" width="3" height="3"/><rect x="60" y="74" width="3" height="3"/>
        <rect x="48" y="82" width="3" height="3"/><rect x="54" y="82" width="3" height="3"/><rect x="60" y="82" width="3" height="3"/>
        <rect x="78" y="54" width="3" height="3"/><rect x="84" y="54" width="3" height="3"/>
        <rect x="78" y="62" width="3" height="3"/><rect x="84" y="62" width="3" height="3"/>
        <rect x="78" y="70" width="3" height="3"/><rect x="84" y="70" width="3" height="3"/>
        <rect x="78" y="78" width="3" height="3"/><rect x="84" y="78" width="3" height="3"/>
      </g>
    `;
  } else if (variant === 1) {
    buildings = `
      <polygon points="8,95 24,35 40,95" fill="${fg}"/>
      <polygon points="35,95 52,22 68,95" fill="${bg}"/>
      <polygon points="62,95 78,45 94,95" fill="${fg}"/>
      <g fill="${ac}" opacity=".7">
        <circle cx="24" cy="50" r="1.2"/><circle cx="24" cy="60" r="1.2"/><circle cx="24" cy="70" r="1.2"/><circle cx="24" cy="80" r="1.2"/>
        <circle cx="52" cy="38" r="1.2"/><circle cx="52" cy="48" r="1.2"/><circle cx="52" cy="58" r="1.2"/><circle cx="52" cy="68" r="1.2"/><circle cx="52" cy="78" r="1.2"/>
        <circle cx="78" cy="58" r="1.2"/><circle cx="78" cy="68" r="1.2"/><circle cx="78" cy="78" r="1.2"/>
      </g>
    `;
  } else {
    buildings = `
      <rect x="5"  y="50" width="18" height="45" fill="${bg}"/>
      <rect x="25" y="35" width="20" height="60" fill="${fg}"/>
      <rect x="47" y="20" width="22" height="75" fill="${bg}"/>
      <rect x="71" y="42" width="16" height="53" fill="${fg}"/>
      <rect x="89" y="55" width="10" height="40" fill="${bg}"/>
      <g fill="${ac}" opacity=".75">
        <rect x="8" y="58" width="2" height="2"/><rect x="14" y="58" width="2" height="2"/><rect x="8" y="66" width="2" height="2"/><rect x="14" y="66" width="2" height="2"/><rect x="8" y="74" width="2" height="2"/><rect x="14" y="74" width="2" height="2"/>
        <rect x="28" y="42" width="2" height="2"/><rect x="34" y="42" width="2" height="2"/><rect x="40" y="42" width="2" height="2"/><rect x="28" y="50" width="2" height="2"/><rect x="34" y="50" width="2" height="2"/><rect x="40" y="50" width="2" height="2"/>
        <rect x="28" y="58" width="2" height="2"/><rect x="34" y="58" width="2" height="2"/><rect x="40" y="58" width="2" height="2"/><rect x="28" y="66" width="2" height="2"/><rect x="34" y="66" width="2" height="2"/><rect x="40" y="66" width="2" height="2"/>
        <rect x="50" y="28" width="2" height="2"/><rect x="56" y="28" width="2" height="2"/><rect x="62" y="28" width="2" height="2"/><rect x="50" y="36" width="2" height="2"/><rect x="56" y="36" width="2" height="2"/><rect x="62" y="36" width="2" height="2"/>
        <rect x="50" y="44" width="2" height="2"/><rect x="56" y="44" width="2" height="2"/><rect x="62" y="44" width="2" height="2"/><rect x="50" y="52" width="2" height="2"/><rect x="56" y="52" width="2" height="2"/><rect x="62" y="52" width="2" height="2"/>
        <rect x="50" y="60" width="2" height="2"/><rect x="56" y="60" width="2" height="2"/><rect x="62" y="60" width="2" height="2"/><rect x="50" y="68" width="2" height="2"/><rect x="56" y="68" width="2" height="2"/><rect x="62" y="68" width="2" height="2"/>
        <rect x="74" y="48" width="2" height="2"/><rect x="80" y="48" width="2" height="2"/><rect x="74" y="58" width="2" height="2"/><rect x="80" y="58" width="2" height="2"/><rect x="74" y="68" width="2" height="2"/><rect x="80" y="68" width="2" height="2"/>
      </g>
    `;
  }
  return `
    <svg viewBox="0 0 100 95" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="95" fill="${sky}"/>
      <circle cx="78" cy="18" r="6" fill="#fff" opacity=".6"/>
      ${buildings}
    </svg>
  `;
}

// 자격 요건 매핑
const ELIGIBILITY_LABELS = {
  '청년':   '만 19-39세 청년',
  '신혼':   '신혼부부·예비부부',
  '자녀':   '자녀 있는 세대',
  '다자녀': '다자녀 세대',
  '1인':    '1인 가구',
  '가구':   '일반 세대',
  '고령':   '고령자 세대',
};

// Expose to global
window.DISTRICTS = DISTRICTS;
window.HOUSING_TYPES = HOUSING_TYPES;
window.AGENCIES = AGENCIES;
window.STATUS_LABELS = STATUS_LABELS;
window.LISTINGS = LISTINGS;
window.SEOUL_MAP_SVG = SEOUL_MAP_SVG;
window.thumbnailSVG = thumbnailSVG;
window.ELIGIBILITY_LABELS = ELIGIBILITY_LABELS;
