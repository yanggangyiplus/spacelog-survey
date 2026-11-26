/* 테스트 웹: 안내 → 태스크 6개(디자인 2개 × 3개) → 설문 → 저장.
   문항은 questions.js, 시안 연결은 adapters.js, 저장 위치는 config.js가 정한다. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var Q = window.SL_QUESTIONS, A = window.SL_ADAPT, C = window.SL_CONFIG;

  var pid = crypto.randomUUID();
  // 디자인 A를 먼저, 디자인 B를 다음에 한다. 주소에 ?order=BA를 붙이면 B부터 한다
  var forced = (new URLSearchParams(location.search).get('order') || '').toUpperCase();
  var order = /^(AB|BA)$/.test(forced) ? forced : 'AB';
  var steps = [];
  order.split('').forEach(function (design, round) { Q.tasks.forEach(function (t) { steps.push({ design: design, round: round + 1, task: t }); }); });
  var at = -1, startedAt = 0, results = [], saved = {}, tasksSent = false, preference = null;
  var frame = $('frame');

  function show(id) { ['intro', 'test', 'prefer', 'survey', 'done'].forEach(function (k) { $(k).hidden = k !== id; }); scrollTo(0, 0); }

  /* ---------- 태스크 ---------- */
  function next() {
    at++;
    if (at >= steps.length) { frame.src = 'about:blank'; $('preferText').textContent = Q.preference; return show('prefer'); }
    var s = steps[at], collector = s.task.screen === 'collector';
    $('step').textContent = '태스크 ' + (at + 1) + ' / ' + steps.length;
    $('design').textContent = '디자인 ' + s.design; $('design').dataset.d = s.design;
    $('taskTitle').textContent = s.task.title;
    $('taskText').textContent = s.task.text.replace('{target}', s.task.target || '');
    $('acts').innerHTML = '';
    Q.taskResults.forEach(function (label, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pill' + (i === 0 ? ' main' : ''); b.textContent = label;
      b.addEventListener('click', function () { finish(label); });
      $('acts').appendChild(b);
    });
    // 튜토리얼은 첫 번째 디자인에서만 저절로 뜬다(두 디자인의 기능이 같다). 두 번째 디자인은 바로 시작하고, 필요하면 '튜토리얼' 버튼으로 본다
    frameReady = false;
    if (s.round === 1) { startedAt = 0; openGuide(); } else { demo++; $('guide').hidden = true; startedAt = Date.now(); }
    frame.src = collector ? 'collector/index.html?design=' + s.design : A.viewUrl(s.design, s.task.screen);
  }
  /* ---------- 튜토리얼: 화면 위에서 마우스가 움직이며 할 일을 시연한다. 닫는 순간부터 시간을 잰다 ---------- */
  var demo = 0, frameReady = false;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  // 단계의 대상(시안 화면 속 요소 또는 비율 자리)을 화면 좌표의 네모로 바꾼다
  function rectOf(find, at) {
    var st = $('stage').getBoundingClientRect(), el = null;
    try { el = find && find(frame.contentDocument); } catch (e) { /* 아직 안 열림 */ }
    var r = el && el.getBoundingClientRect();
    // 대상이 화면 밖(아래쪽)에 있으면 시안 화면을 스크롤해서 보이게 한다
    if (r && r.width && (r.top < 0 || r.bottom > st.height)) { el.scrollIntoView({ block: 'center' }); r = el.getBoundingClientRect(); }
    if (r && r.width && r.bottom > 0 && r.top < st.height && r.right > 0 && r.left < st.width) return { x: r.left, y: r.top, w: r.width, h: r.height };
    return { x: st.width * at[0] - 60, y: st.height * at[1] - 30, w: 120, h: 60 };
  }
  function mid(r) { return [r.x + r.w / 2, r.y + r.h / 2]; }
  function moveTo(el, p, dx, dy) { el.style.transform = 'translate(' + (p[0] + (dx || 0)) + 'px,' + (p[1] + (dy || 0)) + 'px)'; }
  function ring(r) { var g = $('ring'); if (!r) { g.classList.remove('on'); return; } g.style.transform = 'translate(' + (r.x - 6) + 'px,' + (r.y - 6) + 'px)'; g.style.width = r.w + 12 + 'px'; g.style.height = r.h + 12 + 'px'; g.classList.add('on'); }
  function press() { var c = $('cursor'); c.classList.remove('press'); void c.getBoundingClientRect(); c.classList.add('press'); }
  async function playStep(st, i) {
    $('guideCap').innerHTML = st.text; // adapters.js의 고정 글
    Array.prototype.forEach.call($('guideDots').children, function (d, k) { d.classList.toggle('on', k === i); });
    var to = rectOf(st.to, st.at), cur = $('cursor'), ghost = $('ghost'), keys = $('keys');
    ring(null); ghost.hidden = true; keys.hidden = true;
    if (st.act === 'keys') {
      keys.innerHTML = st.keys.map(function (k) { return '<kbd>' + k + '</kbd>'; }).join('');
      keys.style.left = mid(to)[0] + 'px'; keys.style.top = mid(to)[1] + 'px'; keys.hidden = false;
      moveTo(cur, [mid(to)[0], mid(to)[1] + 70]); await sleep(1200);
      if (st.drag) { var s2 = $('stage').getBoundingClientRect(); press(); moveTo(cur, [s2.width * st.drag[0], s2.height * st.drag[1]]); }
      await sleep(2200);
    } else if (st.act === 'drag') {
      var from = rectOf(st.from, [0.3, 0.5]);
      moveTo(cur, mid(from)); ring(from); await sleep(1300);
      press(); ghost.textContent = st.label; ghost.style.transition = 'none'; moveTo(ghost, mid(from), 14, 14); ghost.hidden = false; void ghost.getBoundingClientRect(); ghost.style.transition = '';
      await sleep(350);
      cur.style.transitionDuration = '1.3s'; moveTo(cur, mid(to)); moveTo(ghost, mid(to), 14, 14); ring(to);
      await sleep(1500); cur.style.transitionDuration = ''; ghost.hidden = true; press(); await sleep(1100);
    } else {
      moveTo(cur, mid(to)); await sleep(950); ring(to);
      if (!st.noPress) { await sleep(350); press(); }
      await sleep(1900);
    }
  }
  async function playDemo() {
    var my = ++demo, s = steps[at], list = A.guide(s.design, s.task.screen);
    $('guideDots').innerHTML = list.map(function () { return '<i></i>'; }).join('');
    $('guideCap').textContent = '화면을 불러오는 중이에요.';
    while (my === demo && !frameReady) await sleep(200);
    if (s.task.screen !== 'collector') await sleep(1500); // 시안 화면이 그려질 시간
    for (var i = 0; my === demo; i = (i + 1) % list.length) { await playStep(list[i], i); }
  }
  function openGuide() {
    var s = steps[at];
    $('guideTitle').textContent = '디자인 ' + s.design + ' · ' + s.task.title;
    $('guideGoal').textContent = s.task.text.replace('{target}', s.task.target || '');
    $('guide').hidden = false; $('guideGo').focus();
    playDemo();
  }
  function closeGuide() { demo++; $('guide').hidden = true; try { frame.contentWindow.scrollTo(0, 0); } catch (e) { /* 시연하며 내린 스크롤을 처음 자리로 */ } if (!startedAt) startedAt = Date.now(); }
  $('guideGo').addEventListener('click', closeGuide);
  $('guideOpen').addEventListener('click', openGuide);
  function finish(label) {
    var s = steps[at];
    closeGuide();
    results.push({ design: s.design, round: s.round, task: s.task.id, screen: s.task.screen, target: s.task.target || null, result: label, ms: Date.now() - startedAt, record: saved[s.design] || null });
    next();
  }
  frame.addEventListener('load', function () {
    var s = steps[at]; frameReady = true;
    if (s && s.task.screen !== 'collector') { try { A.lock(s.design, frame); } catch (e) { console.warn('화면 잠금 실패', e); } }
  });
  // 수집앱이 기록을 넘겨 주면 지금 디자인에 넣는다
  addEventListener('message', function (e) {
    var s = steps[at], r = e.data && e.data.record;
    if (e.origin !== location.origin || e.source !== frame.contentWindow || !s || e.data.type !== 'sl-record' || !r || typeof r.title !== 'string') return;
    A.upsert(s.design, r);
    saved[s.design] = r.title;
  });

  /* ---------- 저장 (Supabase) ---------- */
  function save(kind, payload) {
    try { localStorage.setItem('sl_backup_' + kind, JSON.stringify(payload)); } catch (e) { /* 백업 없이 진행 */ }
    if (!C.supabaseUrl || !C.supabaseKey) return Promise.reject(new Error('config.js에 Supabase 값이 없어요'));
    return fetch(C.supabaseUrl + '/rest/v1/survey_responses', {
      method: 'POST',
      headers: { apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ participant_id: pid, kind: kind, design_order: order, payload: payload }),
    }).then(function (res) { if (!res.ok) throw new Error('저장 실패 ' + res.status); });
  }
  function sendTasks() {
    if (tasksSent) return Promise.resolve();
    return save('tasks', { preference: preference, preference_reason: $('preferWhy').value.trim() || null, tasks: results, ua: navigator.userAgent, width: innerWidth }).then(function () { tasksSent = true; });
  }

  /* ---------- 설문 ---------- */
  var OTHER = '기타 (직접 입력)';
  // 어떤 디자인이 더 편했는지 고르면 태스크 결과와 함께 저장하고 설문으로 넘어간다
  document.querySelectorAll('[data-pick]').forEach(function (b) { b.addEventListener('click', function () {
    preference = b.dataset.pick; $('preferGo').disabled = false;
    document.querySelectorAll('[data-pick]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  }); });
  $('preferGo').addEventListener('click', openSurvey);
  function openSurvey() {
    sendTasks().catch(function () { /* 설문을 낼 때 다시 보낸다 */ });
    $('surveyIntro').textContent = Q.intro;
    var form = $('form'); form.innerHTML = '';
    Q.questions.forEach(function (q, i) {
      var fs = document.createElement('fieldset'); fs.id = 'fs_' + q.id;
      var lg = document.createElement('legend'); lg.textContent = 'Q' + (i + 1) + '. ' + q.text;
      var tag = document.createElement('small'); tag.textContent = (q.type === 'multi' ? '복수 선택' : q.type === 'single' ? '하나만 선택' : '주관식') + (q.required ? '' : ' · 선택');
      lg.appendChild(tag); fs.appendChild(lg);
      if (q.hint) { var h = document.createElement('p'); h.className = 'fine'; h.textContent = q.hint; fs.appendChild(h); }
      if (q.type === 'text') { var ta = document.createElement('textarea'); ta.name = q.id; ta.maxLength = 1000; ta.setAttribute('aria-label', q.text); fs.appendChild(ta); }
      else q.options.concat(q.other ? [OTHER] : []).forEach(function (o) {
        var lb = document.createElement('label'); lb.className = 'opt';
        var inp = document.createElement('input'); inp.type = q.type === 'multi' ? 'checkbox' : 'radio'; inp.name = q.id; inp.value = o;
        lb.appendChild(inp); lb.appendChild(document.createTextNode(o)); fs.appendChild(lb);
        if (o === OTHER) { var tx = document.createElement('input'); tx.className = 'other'; tx.name = q.id + '_other'; tx.maxLength = 200; tx.hidden = true; tx.setAttribute('aria-label', q.text + ' 기타 내용'); fs.appendChild(tx); }
      });
      form.appendChild(fs);
    });
    var err = document.createElement('p'); err.className = 'err'; err.id = 'formErr'; err.setAttribute('role', 'alert'); form.appendChild(err);
    var sub = document.createElement('button'); sub.type = 'submit'; sub.className = 'pill main'; sub.id = 'submit'; sub.textContent = '제출하기'; form.appendChild(sub);
    form.addEventListener('change', onChange); onChange();
    show('survey');
  }
  function picked(q) { return Array.prototype.map.call($('form').querySelectorAll('input[name="' + q.id + '"]:checked'), function (i) { return i.value; }); }
  function visible(q) { if (!q.showIf) return true; var p = Q.questions.find(function (x) { return x.id === q.showIf.q; }); return picked(p).some(function (v) { return q.showIf.in.indexOf(v) >= 0; }); }
  function onChange(e) {
    Q.questions.forEach(function (q) {
      // 혼자만 고를 수 있는 보기(예: '없다')를 고르면 나머지를 풀고, 다른 보기를 고르면 그 보기를 푼다
      if (q.exclusive && e && e.target.name === q.id && e.target.checked) $('form').querySelectorAll('input[name="' + q.id + '"]').forEach(function (i) { if ((i.value === q.exclusive) !== (e.target.value === q.exclusive)) i.checked = false; });
      $('fs_' + q.id).hidden = !visible(q);
      var o = $('form').elements[q.id + '_other']; if (o) o.hidden = picked(q).indexOf(OTHER) < 0;
    });
  }
  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = $('form'), answers = {}, firstBad = null;
    Q.questions.forEach(function (q) {
      var fs = $('fs_' + q.id), ok = true, val = null;
      if (visible(q)) {
        if (q.type === 'text') { val = form.elements[q.id].value.trim() || null; ok = !q.required || !!val; }
        else {
          var other = form.elements[q.id + '_other'], otherText = other ? other.value.trim() : '';
          var p = picked(q); ok = !q.required || p.length > 0;
          if (p.indexOf(OTHER) >= 0 && !otherText) ok = false;
          p = p.map(function (v) { return v === OTHER ? '기타: ' + otherText : v; });
          val = q.type === 'multi' ? p : p[0] || null;
        }
      }
      fs.classList.toggle('bad', !ok); if (!ok && !firstBad) firstBad = fs;
      answers[q.id] = val; // 보이지 않은 문항은 null
    });
    if (firstBad) { $('formErr').textContent = '답하지 않은 문항이 있어요. 기타를 골랐다면 내용도 적어 주세요.'; firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    $('formErr').textContent = ''; $('submit').disabled = true; $('submit').textContent = '저장하는 중';
    sendTasks().then(function () { return save('survey', { answers: answers }); }).then(function () { testing = false; show('done'); }, function (er) {
      $('submit').disabled = false; $('submit').textContent = '다시 제출하기';
      $('formErr').textContent = '응답을 저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요. (' + er.message + ')';
    });
  });

  /* ---------- 시작 ---------- */
  var testing = false;
  addEventListener('beforeunload', function (e) { if (testing) e.preventDefault(); }); // 진행 중 새로고침으로 답이 날아가지 않게
  // 처음부터 다시: 새로 열면 안내 화면부터 시작하고, 시작할 때 저장 값이 모두 비워진다
  document.querySelectorAll('[data-restart]').forEach(function (b) { b.addEventListener('click', function () { testing = false; location.href = location.pathname + location.search; }); });
  $('start').addEventListener('click', function () { A.reset(); testing = true; show('test'); next(); });
})();
