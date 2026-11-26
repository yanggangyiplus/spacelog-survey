/* spaceLog 비교 테스트용 더미 데이터와 흉내 챗봇. 테스트 홈(spacelog-home.html)과 3D 우주(universe.html)가 함께 읽는다.
   일반 <script>로 읽는다(모듈이 아니라 파일을 더블클릭해 열어도 동작한다). window.SPACELOG_TEST 하나만 만든다.

   - 상태(행성 · 기록 · 캐릭터)는 sessionStorage 한 곳(KEY)에 둔다: 홈에서 바꾼 것이 우주에서도, 우주에서 바꾼 것이 홈에서도 보인다.
     탭을 닫으면 처음 상태로 돌아간다(참가자마다 같은 상태에서 시작).
   - 날짜는 "여는 날의 오늘"로 맞춘다(기록 11개가 모두 오늘 들어온 것으로 보인다).
   - 챗봇 답(chat)은 화면과 떼어 둔 데이터다. 저쪽 시안에 챗봇을 붙인다면 이 묶음을 그대로 쓰면 같은 답이 나온다. */
(function () {
  var KEY = 'spacelog.abtest.v1';

  /* 행성 7개. color_index는 앱의 PLANET_COLORS 번호(util.js)이고 color는 그 face 색이다 */
  var PLANETS = [
    { id: 'p1', name: '제품 기획', color_index: 11, color: '#4f8dff' },
    { id: 'p2', name: '읽은 것들', color_index: 5, color: '#ffb13b' },
    { id: 'p3', name: '생각 조각', color_index: 4, color: '#c29bff' },
    { id: 'p4', name: '디자인 레퍼런스', color_index: 6, color: '#ff6fb5' },
    { id: 'p5', name: '회의록', color_index: 3, color: '#8fdc5a' },
    { id: 'p6', name: 'CSV 데이터', color_index: 2, color: '#5ec8ff' },
    { id: 'p7', name: '분류 안 된 기록', color_index: 8, color: '#9aa7ff' },
  ];
  /* 앱의 행성 색 16개(util.js PLANET_COLORS의 face, 1번부터 차례로). 새 행성 만들기 · 꾸미기에서 고른다.
     3D 우주(mockApi.js)도 color_index로 이 표에서 색을 찾는다 */
  var COLORS = ['#ff7a59', '#5ec8ff', '#8fdc5a', '#c29bff', '#ffb13b', '#ff6fb5', '#4fd1c5', '#9aa7ff', '#ff5a5a', '#7cf0b0', '#4f8dff', '#d96bff', '#c6e84a', '#ffc9a3', '#b9c6e0', '#c98a5a'];
  /* 색 이름(앱과 같은 순서): 색 원의 이름표 */
  var COLOR_NAMES = ['주황', '하늘', '연두', '연보라', '호박', '분홍', '청록', '남보라', '빨강', '민트', '파랑', '자주', '라임', '살구', '은회색', '코코아'];

  /* 기록 본문. CSV는 앞 몇 줄, 글은 내용. 상세 미리보기와 챗봇 답이 이 글을 쓴다 */
  var BODY = {
    s1: '날짜, 운동, 시간(분), 강도\n11/18, 러닝, 32, 중\n11/19, 근력, 45, 상\n11/20, 요가, 40, 하\n… 모두 30행',
    s2: '탐사선 아이콘은 둥근 몸통에 안테나 하나. 별을 실어 나르는 느낌이 나게 뒤에 작은 짐칸을 단다. 색은 노랑에 잉크 외곽선.',
    s3: '제목, 가수, 장르, 들은 횟수\n밤편지, 아이유, 발라드, 42\nHype Boy, NewJeans, 댄스, 37\n… 모두 20행',
    s4: '제목, 개봉 연도, 장르, 별점\n인터스텔라, 2014, SF, 5\n패스트 라이브즈, 2023, 드라마, 4.5\n… 모두 24행',
    s5: '1. 첫 화면에서 우주로 들어가기 전에 기록이 몇 개인지 보이면 좋겠다.\n2. 알림은 하루 한 번만, 저녁 9시.\n3. 챗봇 답에는 근거가 된 기록을 꼭 보여 줄 것.\n4. 행성 이름은 20자까지.',
    s6: '수업명, 요일, 시간, 강사\nAI 기초, 월, 19:00, 김하늘\n데이터 시각화, 수, 19:30, 이도윤\n… 모두 60행',
    s7: '이름, 동네, 콘센트, 와이파이, 별점\n별빛다방, 연남, 있음, 있음, 4.5\n오르빗커피, 성수, 없음, 있음, 4.0\n… 모두 24행',
    s8: '알림은 하루 최대 한 번. 기본 시간은 저녁 9시이고 설정에서 바꿀 수 있다. "7일 전 오늘의 기록"을 다시 보여 주는 알림만 보낸다. 밤 11시부터 아침 8시까지는 보내지 않는다.',
    s9: '제목, 저자, 읽은 날, 별점\n아주 희미한 빛으로도, 최은영, 11/02, 5\n도둑맞은 집중력, 요한 하리, 11/10, 4\n… 모두 24행',
    s10: '기록을 별로 띄우면 다시 찾을 때 우주를 날아다니는 재미가 생기지 않을까?',
    s11: '"AI에게 일을 맡길 때는 결과물보다 판단 기준을 먼저 건네라."\n"좋은 질문은 맥락 세 줄과 원하는 형식 한 줄이면 충분하다."',
  };

  /* 기록 11개. kind: 'csv'(파일) | 'text'(글). at: 오늘의 시:분 */
  var STARS = [
    ['s1', 'workouts.csv', 'csv', '30행', 'p6', false, 9, 5],
    ['s2', '탐사선 아이콘 아이디어', 'text', '90자', 'p3', false, 9, 2],
    ['s3', 'songs.csv', 'csv', '20행', 'p6', false, 8, 58],
    ['s4', 'movies.csv', 'csv', '24행', 'p6', false, 8, 51],
    ['s5', 'PRD 2차 의견', 'text', '520자', 'p1', false, 8, 44],
    ['s6', 'classes.csv', 'csv', '60행', 'p6', false, 8, 40],
    ['s7', 'cafes.csv', 'csv', '24행', 'p6', true, 8, 33],
    ['s8', '알림 정책 초안', 'text', '230자', 'p1', true, 8, 21],
    ['s9', 'books.csv', 'csv', '24행', 'p6', true, 8, 12],
    ['s10', '지하철에서 떠오른 생각', 'text', '38자', 'p7', false, 7, 48],
    ['s11', '「AI와 일하는 법」 밑줄', 'text', '150자', 'p2', false, 7, 30],
  ];

  function seed() {
    var now = new Date();
    return {
      seq: 100,
      planets: PLANETS.map(function (p) { return Object.assign({}, p); }),
      stars: STARS.map(function (r) {
        return {
          id: r[0], title: r[1], kind: r[2], size: r[3], planet: r[4], fav: r[5],
          at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), r[6], r[7]).toISOString(),
          body: BODY[r[0]] || '', memo: '', notes: [],
        };
      }),
      character: null,
    };
  }

  /* 상태 읽기 · 쓰기. 저장소를 못 쓰면(사생활 보호 창 등) 이 페이지 안에서만 유지된다 */
  var mem = null;
  function load() {
    if (mem) return mem;
    try {
      var raw = sessionStorage.getItem(KEY);
      if (raw) mem = JSON.parse(raw);
    } catch (e) { /* 처음 상태로 */ }
    if (!mem || !Array.isArray(mem.stars) || !Array.isArray(mem.planets)) mem = seed();
    return mem;
  }
  function save(state) {
    mem = state;
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 이 페이지 안에서만 */ }
  }
  function reset() {
    mem = null;
    try { sessionStorage.removeItem(KEY); } catch (e) { /* 없음 */ }
  }

  /* ---------- 흉내 챗봇 ----------
     질문의 낱말이 가장 많이 맞는 답을 고른다. 없으면 "오늘 · 이번 주 요약", "'행성' 요약" 같은 질문을 기록으로 만들어 답하고,
     그래도 없으면 기록 제목 · 본문 · 메모에서 낱말로 찾는다. 그래도 없으면 못 찾았다고 말한다. 출처는 기록 id로 적는다. */
  var CHAT = {
    quick: ['이번 주 운동 기록 요약해 줘', '알림 정책 핵심이 뭐야?', '「AI와 일하는 법」에서 밑줄 친 문장 알려 줘', '콘센트 있는 카페 몇 곳이야?'],
    answers: [
      { keys: ['운동', 'workout', '러닝', '근력', '요가'], sources: ['s1'],
        text: 'workouts.csv에 운동 기록 30개가 있어요. 러닝이 12번으로 가장 많고, 근력 10번, 요가 8번이에요. 한 번에 평균 38분 운동했어요.' },
      { keys: ['알림', '푸시', '저녁'], sources: ['s8', 's5'],
        text: '알림은 하루 한 번, 기본 저녁 9시에 보내요. "7일 전 오늘의 기록"을 다시 보여 주는 알림만 보내고, 밤 11시부터 아침 8시까지는 보내지 않아요.\nPRD 2차 의견에도 "알림은 하루 한 번만"이라는 의견이 있어요.' },
      { keys: ['밑줄', 'ai와', '일하는', '문장', '인용'], sources: ['s11'],
        text: '「AI와 일하는 법」에서 밑줄 친 문장은 두 개예요.\n1. "AI에게 일을 맡길 때는 결과물보다 판단 기준을 먼저 건네라."\n2. "좋은 질문은 맥락 세 줄과 원하는 형식 한 줄이면 충분하다."' },
      { keys: ['카페', '콘센트', '와이파이', 'cafe'], sources: ['s7'],
        text: 'cafes.csv의 카페 24곳 중 콘센트가 있는 곳은 15곳이에요. 와이파이까지 되는 곳은 12곳이고, 별점이 가장 높은 곳은 연남의 별빛다방(4.5)이에요.' },
      { keys: ['탐사선', '아이콘'], sources: ['s2', 's10'],
        text: '탐사선 아이콘은 둥근 몸통에 안테나 하나, 뒤에 작은 짐칸을 단 모양이에요. 색은 노랑에 잉크 외곽선이에요.\n지하철에서 떠오른 생각에도 "기록을 별로 띄우면 우주를 날아다니는 재미"라는 메모가 있어요.' },
      { keys: ['prd', '의견'], sources: ['s5'],
        text: 'PRD 2차 의견은 네 가지예요. 첫 화면에 기록 개수 보이기, 알림은 하루 한 번 저녁 9시, 챗봇 답에 근거 기록 보여 주기, 행성 이름 20자 제한.' },
      { keys: ['책', '독서', 'books'], sources: ['s9'],
        text: 'books.csv에 책 24권이 있어요. 가장 최근에 읽은 책은 11월 10일의 「도둑맞은 집중력」(별점 4)이에요.' },
      { keys: ['영화', 'movies'], sources: ['s4'],
        text: 'movies.csv에 영화 24편이 있어요. 별점 5점은 「인터스텔라」예요.' },
      { keys: ['노래', '음악', 'songs'], sources: ['s3'],
        text: 'songs.csv에 노래 20곡이 있어요. 가장 많이 들은 곡은 아이유의 「밤편지」(42번)예요.' },
      { keys: ['수업', '강의', 'classes'], sources: ['s6'],
        text: 'classes.csv에 수업 60개가 있어요. 예를 들어 월요일 19:00에 「AI 기초」, 수요일 19:30에 「데이터 시각화」가 있어요.' },
    ],
    notFound: '모아 둔 별에서 답을 찾지 못했어요. 기록 이름이나 내용을 넣어 물어보세요.',
  };

  function words(t) { return (String(t).toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || []); }

  /** 질문 → { text, sources: [기록 id], notFound? }. state는 load()가 준 상태 */
  function answerFor(q, state) {
    var lq = String(q).toLowerCase();
    var stars = state.stars;
    var has = function (id) { return stars.some(function (x) { return x.id === id; }); };
    var best = null, bestN = 0;
    CHAT.answers.forEach(function (a) {
      var n = a.keys.filter(function (k) { return lq.indexOf(k) >= 0; }).length;
      if (n > bestN) { best = a; bestN = n; }
    });
    if (best) return { text: best.text, sources: best.sources.filter(has) };

    // "'행성' 요약" — 행성 이름이 들어 있으면 그 행성의 기록을 정리한다
    var planet = state.planets.find(function (p) { return lq.indexOf(p.name.toLowerCase()) >= 0; });
    if (planet) {
      var ps = stars.filter(function (x) { return x.planet === planet.id; });
      if (!ps.length) return { text: "'" + planet.name + "' 행성에는 아직 별이 없어요.", sources: [], notFound: true };
      return {
        text: "'" + planet.name + "' 행성에 별 " + ps.length + '개가 있어요.\n' + ps.slice(0, 5).map(function (x) { return '• ' + x.title; }).join('\n'),
        sources: ps.slice(0, 5).map(function (x) { return x.id; }),
      };
    }
    // "오늘 · 이번 주 · 이번 달 … 요약 / 정리" — 행성별 개수로 정리한다
    if (/(오늘|이번 ?주|이번 ?달|최근|전체)/.test(lq) && /(요약|정리|뭐|무엇)/.test(lq)) {
      var by = {};
      stars.forEach(function (x) { by[x.planet] = (by[x.planet] || 0) + 1; });
      var lines = state.planets.filter(function (p) { return by[p.id]; }).map(function (p) { return '• ' + p.name + ' ' + by[p.id] + '개'; });
      return {
        text: '띄운 별은 모두 ' + stars.length + '개예요.\n' + lines.join('\n'),
        sources: stars.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }).slice(0, 3).map(function (x) { return x.id; }),
      };
    }
    // 미리 써 둔 답이 없다: 기록 제목 · 본문 · 메모에서 낱말로 찾는다
    var ws = words(q);
    var hits = stars
      .map(function (x) {
        var hay = (x.title + ' ' + x.body + ' ' + x.memo).toLowerCase();
        return { x: x, n: ws.filter(function (w) { return hay.indexOf(w) >= 0; }).length };
      })
      .filter(function (h) { return h.n > 0; })
      .sort(function (a, b) { return b.n - a.n; })
      .slice(0, 3);
    if (!hits.length) return { text: CHAT.notFound, sources: [], notFound: true };
    return {
      text: '관련 있어 보이는 별 ' + hits.length + '개를 찾았어요.\n' + hits.map(function (h) { return '• ' + h.x.title + ': ' + String(h.x.body).split('\n')[0].slice(0, 40); }).join('\n'),
      sources: hits.map(function (h) { return h.x.id; }),
    };
  }

  window.SPACELOG_TEST = { KEY: KEY, COLORS: COLORS, COLOR_NAMES: COLOR_NAMES, load: load, save: save, reset: reset, chat: CHAT, answerFor: answerFor };
})();
