/* 시안마다 다른 저장 방식을 한곳에서 맞춘다. 테스트 웹(app.js)은 이 파일만 부르고 시안 내부는 건드리지 않는다.
   - 시안 A: localStorage `spacelog_inbox_v1`(새 기록), `spacelog_view_v1`(1D/3D)
   - 시안 B: sessionStorage `spacelog.abtest.v1`(그룹 · 기록 전체) */
window.SL_ADAPT = (function () {
  var D = window.SL_DATA;
  var B_KEY = 'spacelog.abtest.v1', A_INBOX = 'spacelog_inbox_v1';
  // 시안 B의 그룹 색(디자인 값이라 데이터가 아닌 여기 둔다. design draft_B/data.js와 같다)
  var B_COLORS = { p1: [11, '#4f8dff'], p2: [5, '#ffb13b'], p3: [4, '#c29bff'], p4: [6, '#ff6fb5'], p5: [3, '#8fdc5a'], p6: [2, '#5ec8ff'], p7: [8, '#9aa7ff'] };

  function csvPreview(c) {
    return [c.cols.join(', ')].concat(c.rows.slice(0, 2).map(function (r) { return r.join(', '); })).join('\n') + '\n… 모두 ' + c.rows.length + '행';
  }
  function todayAt(h, m) { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate(), h, m).toISOString(); }
  function read(store, key, fallback) { try { return JSON.parse(store.getItem(key)) || fallback; } catch (e) { return fallback; } }

  // 시안 B의 기록은 글(text) 아니면 CSV 두 가지다. 링크 · 사진 · 파일은 글 기록에 첨부로 붙인다(시안 B가 직접 만드는 모양과 같다)
  function bStar(rec) {
    var att = rec.kind === 'link' ? [{ id: 'l-' + rec.id, kind: 'link', file_name: null, file_ext: null, file_size: null, url: rec.body, link_title: rec.title, has_thumb: false }]
      : rec.kind === 'image' || (rec.kind === 'file' && !rec.csv) ? [{ id: 'a-' + rec.id, kind: rec.kind, file_name: rec.title, file_ext: (rec.title.split('.').pop() || ''), file_size: 204800, url: null, link_title: null, has_thumb: false }] : [];
    return { id: rec.id, title: rec.title, kind: rec.csv ? 'csv' : 'text', size: rec.meta, planet: rec.group, fav: !!rec.fav, at: rec.at,
      body: rec.csv ? csvPreview(rec.csv) : rec.kind === 'text' ? [rec.body, rec.memo].filter(Boolean).join('\n\n') : rec.memo || '',
      memo: rec.csv ? rec.memo || '' : '', notes: [], attachments: att };
  }

  /** 참가자마다 같은 처음 상태로 만든다 */
  function reset() {
    Object.keys(localStorage).filter(function (k) { return /^(spacelog|sl_)/.test(k); }).forEach(function (k) { localStorage.removeItem(k); });
    // 시안 A가 처음 열릴 때 한 번 도는 정리 코드가 수집한 기록을 지우지 않게, 이미 돈 것으로 표시한다
    ['spacelog_reset_1112', 'spacelog_reset_links_1124', 'spacelog_clean_icons_1125', 'spacelog_seedlink_off_v1'].forEach(function (k) { localStorage.setItem(k, '1'); });
    sessionStorage.setItem(B_KEY, JSON.stringify({
      seq: 100,
      planets: D.groups.map(function (g) { return { id: g.id, name: g.name, color_index: B_COLORS[g.id][0], color: B_COLORS[g.id][1] }; }),
      stars: D.records.map(function (r) {
        return bStar({ id: r.id, title: r.title, kind: r.kind === 'csv' ? 'file' : r.kind, meta: r.size, group: r.group, fav: r.fav, at: todayAt(r.hour, r.minute), body: r.body || r.url || '', csv: r.csv, memo: r.memo });
      }),
      character: null,
    }));
  }

  /** 수집앱이 만든 기록 { id, kind: text|link|file|image, title, meta, body, memo, group, csv?, at }을 그 시안에 넣거나 고친다 */
  function upsert(design, rec) {
    if (design === 'A') {
      var list = read(localStorage, A_INBOX, []).filter(function (x) { return x.id !== rec.id; });
      var a = { id: rec.id, planet: rec.group === 'p7' ? 'p0' : rec.group, kind: rec.kind, title: rec.title, meta: rec.meta, memo: rec.memo || '', addedAt: rec.at };
      if (rec.body) a.body = rec.body;
      if (rec.csv) a.csv = rec.csv;
      if (rec.thumb) a.thumb = rec.thumb;
      if (rec.kind === 'link') a.url = rec.body;
      localStorage.setItem(A_INBOX, JSON.stringify(list.concat([a])));
    } else {
      var st = read(sessionStorage, B_KEY, null);
      if (!st) { reset(); st = read(sessionStorage, B_KEY, null); }
      st.stars = st.stars.filter(function (x) { return x.id !== rec.id; });
      st.stars.push(bStar(rec));
      sessionStorage.setItem(B_KEY, JSON.stringify(st));
    }
  }

  /** 그 시안을 문서 보기(doc) 또는 공간 보기(space)로 여는 주소 */
  function viewUrl(design, view) {
    if (design === 'A') { localStorage.setItem('spacelog_view_v1', view === 'doc' ? 'doc' : '2.5d'); return 'a/index.html'; }
    return view === 'doc' ? 'b/spacelog-home.html' : 'b/universe.html';
  }

  /** 시안 화면이 열린 뒤: 다른 보기로 넘어가는 길을 숨기고, 시안 B 챗봇 답을 공통 데이터로 바꾼다 */
  function lock(design, frame) {
    var doc = frame.contentDocument, win = frame.contentWindow;
    var css = doc.createElement('style');
    if (design === 'A') {
      css.textContent = '[data-sl-lock]{display:none!important}';
      // 1D/3D 스위치: '1D'와 '3D' 버튼을 함께 가진 가장 가까운 묶음을 숨긴다 (화면이 다시 그려져도 유지)
      var hide = function () {
        var hit = Array.prototype.filter.call(doc.querySelectorAll('button,[role=button],[role=tab]'), function (b) { return /^(1D|3D)$/.test(b.textContent.trim()); });
        if (hit.length >= 2 && hit[0].parentElement && hit[0].parentElement.contains(hit[1])) hit[0].parentElement.setAttribute('data-sl-lock', '');
      };
      new win.MutationObserver(hide).observe(doc.documentElement, { childList: true, subtree: true });
      hide();
    } else {
      css.textContent = '[data-act="enter"],section:has(#enterBtn) .hint,#goHome{display:none!important}'; // 홈 → 우주, 우주 → 홈 버튼
      if (win.SPACELOG_TEST) win.SPACELOG_TEST.chat.answers = D.chat;
    }
    doc.head.appendChild(css);
  }

  /** 튜토리얼: 그 화면에서 마우스가 "어디에서 무엇을 어떻게" 하는지 시연할 단계. 시안 화면이 바뀌면 여기만 고친다.
      act: click(가리키고 누름) | drag(from에서 to로 끌어다 놓음) | keys(키보드 그림).
      to · from은 화면에서 요소를 찾는 함수이고, 못 찾으면 at([가로, 세로] 비율) 자리를 쓴다 */
  // 글자가 같은 요소가 여럿이면 pick('left' = 가장 왼쪽, 'right' = 가장 오른쪽)으로 고른다
  function byText(text, pick) {
    return function (doc) {
      var hits = Array.prototype.filter.call(doc.querySelectorAll('button,a,li,span,div,p,b,td,h1,h2,h3,label'), function (el) {
        return el.children.length < 3 && el.textContent.trim() === text && el.getClientRects().length > 0;
      }).sort(function (a, b) { return a.getBoundingClientRect().left - b.getBoundingClientRect().left; });
      return (pick === 'right' ? hits[hits.length - 1] : hits[0]) || null;
    };
  }
  function sel(q) { return function (doc) { return doc.querySelector(q); }; }
  var GUIDES = {
    A: {
      doc: [
        { act: 'click', to: byText('마케팅'), at: [0.12, 0.6], text: '왼쪽 <b>목록 창</b>에서 그룹을 누르면 그 그룹의 기록만 보여요.' },
        { act: 'click', to: sel('input[placeholder*="찾기"]'), at: [0.42, 0.08], text: '위쪽 <b>검색창</b>에 제목을 적어 찾을 수도 있어요.' },
        { act: 'click', to: byText('광고 채널별 성과.csv'), at: [0.5, 0.6], text: '목록에서 기록을 누르면 <b>상세</b>가 열려요.' },
      ],
      space: [
        { act: 'click', to: byText('마케팅', 'right'), at: [0.3, 0.4], text: '<b>행성 하나가 그룹 하나</b>예요. 행성을 누르면 날아가서 착륙해요.' },
        { act: 'keys', keys: ['W', 'A', 'S', 'D'], from: null, at: [0.45, 0.5], to: null, drag: [0.65, 0.42], text: '키보드 <b>W · A · S · D</b>로 날고, 마우스를 끌어 둘러봐요.' },
        { act: 'click', to: null, at: [0.86, 0.45], text: '착륙하면 오른쪽에 <b>그룹 창</b>이 열려요. 거기서 기록을 누르면 상세가 열려요.' },
      ],
    },
    B: {
      doc: [
        { act: 'click', to: sel('#q'), at: [0.4, 0.3], text: '<b>검색창</b>에 제목을 적어 찾아요.' },
        { act: 'click', to: byText('마케팅', 'left'), at: [0.15, 0.7], text: '왼쪽 <b>행성 고르기</b>에서 행성(그룹)을 누르면 그 행성의 기록만 보여요.' },
        { act: 'click', to: byText('광고 채널별 성과.csv'), at: [0.5, 0.6], text: '목록에서 기록을 누르면 <b>상세</b>가 열려요.' },
      ],
      space: [
        { act: 'keys', keys: ['W', 'A', 'S', 'D'], at: [0.45, 0.5], drag: [0.65, 0.42], text: '<b>행성 하나가 그룹 하나</b>예요. <b>W · A · S · D</b>로 날고, 마우스를 끌어 둘러봐요.' },
        { act: 'keys', keys: ['Enter'], at: [0.55, 0.45], text: '행성 가까이에서 <b>Enter</b>를 누르면 착륙해요.' },
        { act: 'click', to: byText('마케팅'), at: [0.12, 0.45], text: '왼쪽 <b>‘행성으로 바로 날아가기’</b>에서 행성을 눌러도 돼요. 착륙하면 기록 목록이 보여요.' },
      ],
    },
    collector: [
      { act: 'click', to: sel('#pet'), at: [0.9, 0.8], noPress: true, text: '바탕화면에 떠 있는 <b>우주 비행사가 수집 앱</b>이에요. 다른 일을 하다가도 언제든 쓸 수 있어요.' },
      { act: 'drag', from: sel('#win blockquote'), to: sel('#pet'), at: [0.9, 0.8], label: '글', text: '기록하고 싶은 <b>글 · 이미지 · 주소</b>를 우주 비행사 위에 끌어다 놓으면 저장돼요.' },
      { act: 'drag', from: sel('#icons .item'), to: sel('#pet'), at: [0.9, 0.8], label: '파일', text: '바탕화면의 <b>파일</b>도 끌어다 놓을 수 있어요.' },
      { act: 'click', to: sel('#pet'), at: [0.9, 0.8], text: '우주 비행사를 <b>누르면 메뉴</b>가 열려요. ‘지금 내 생각 적기’나 ‘캡처’도 해 보세요.' },
    ],
  };
  function guide(design, screen) { return screen === 'collector' ? GUIDES.collector : GUIDES[design][screen]; }

  return { reset: reset, upsert: upsert, viewUrl: viewUrl, lock: lock, guide: guide };
})();
