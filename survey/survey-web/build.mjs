// 배포 폴더(dist)를 만든다: 테스트 웹 + 문항 + 공통 데이터 + 수집앱 + 시안 A(공통 데이터로 교체) + 시안 B.
// 실행: node survey/survey-web/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const survey = path.join(here, '..');
const dist = path.join(here, 'dist');
const data = JSON.parse(fs.readFileSync(path.join(survey, 'shared-data/data.json'), 'utf8'));

fs.rmSync(dist, { recursive: true, force: true });
for (const d of ['a', 'b', 'collector']) fs.mkdirSync(path.join(dist, d), { recursive: true });
const copy = (from, to) => fs.copyFileSync(path.join(survey, from), path.join(dist, to));

for (const f of ['index.html', 'app.js', 'adapters.js', 'style.css', 'config.js']) copy('survey-web/' + f, f);
copy('questions/questions.js', 'questions.js');
for (const f of ['index.html', 'astro-A.webp', 'astro-B.png']) copy('collector/' + f, 'collector/' + f);
for (const f of ['spacelog-home.html', 'universe.html', 'data.js']) copy('design draft_B/' + f, 'b/' + f);
fs.writeFileSync(path.join(dist, 'data.js'), 'window.SL_DATA = ' + JSON.stringify(data) + ';\n');

// 시안 A: 묶음 파일 안의 데이터 스크립트를 찾아, 예시 기록을 공통 데이터로 바꾼다.
const SEED = `
  { const G = ${JSON.stringify(Object.fromEntries(data.groups.map((g) => [g.id === 'p7' ? 'p0' : g.id, g.name])))};
    planets.forEach(p => { if (G[p.id]) p.name = G[p.id]; });
    const D = ${JSON.stringify(data.records)}; stars.length = 0;
    const KIND = { csv: 'file', text: 'text', link: 'link', image: 'image' }, META = { csv: 'CSV · ', text: '텍스트 · ', link: '', image: '' };
    D.forEach(r => { const d = dayStart(now); d.setHours(r.hour, r.minute);
      stars.push({ id: r.id, planet: r.group === 'p7' ? 'p0' : r.group, kind: KIND[r.kind], title: r.title,
        meta: META[r.kind] + r.size, memo: r.memo, addedAt: d.toISOString(),
        ...(r.body ? { body: r.body } : {}), ...(r.csv ? { csv: r.csv } : {}), ...(r.url ? { url: r.url } : {}), ...(r.thumb ? { thumb: r.thumb } : {}) }); }); }
`;
const MARK = '// 데모 시드';
let html = fs.readFileSync(path.join(survey, 'design draft_A/A-SPACELOG.html'), 'utf8');
const open = '<script type="__bundler/manifest">';
const start = html.indexOf(open) + open.length;
const end = html.indexOf('</script>', start);
assert(start >= open.length && end > start, '시안 A: manifest를 찾지 못했습니다');
const manifest = JSON.parse(html.slice(start, end));
let patched = 0;
for (const entry of Object.values(manifest)) {
  if (!/javascript/.test(entry.mime) || !entry.compressed || entry.data.length > 200000) continue;
  const js = zlib.gunzipSync(Buffer.from(entry.data, 'base64')).toString('utf8');
  if (!js.includes('window.SPACELOG = {') || !js.includes(MARK)) continue;
  entry.data = zlib.gzipSync(js.replace(MARK, SEED + '  ' + MARK)).toString('base64');
  patched++;
}
assert.strictEqual(patched, 1, '시안 A: 데이터 스크립트를 하나만 찾아야 합니다 (찾은 수 ' + patched + ')');
html = html.slice(0, start) + JSON.stringify(manifest).replace(/<\//g, '<\\/') + html.slice(end);
fs.writeFileSync(path.join(dist, 'a/index.html'), html);
console.log('dist 완료:', fs.readdirSync(dist).join(', '));
