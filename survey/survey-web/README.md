# survey-web

시안 A와 B를 한 웹에서 차례로 써 보고 설문까지 하는 테스트 페이지입니다.

## 흐름

안내 → 태스크 6개(디자인 2개 × 문서 보기 · 공간 보기 · 수집앱) → 더 편한 디자인 고르기(A/B) → 설문 13문항 → 저장

고른 디자인은 태스크 결과와 같은 줄(`kind = 'tasks'`, `payload.preference`)에 저장됩니다.

- 디자인 A를 먼저, 디자인 B를 다음에 합니다. 화면 위쪽에 지금 디자인이 표시됩니다. 주소 끝에 `?order=BA`를 붙이면 B부터 합니다.
- 첫 번째 디자인(A)에서는 태스크마다 마우스가 움직이는 튜토리얼이 먼저 뜹니다. 단계는 `adapters.js`의 `GUIDES`에 있고, 닫는 순간부터 시간을 잽니다. 두 번째 디자인(B)은 바로 시작하고 `튜토리얼` 버튼으로만 봅니다.
- 찾기 태스크는 `questions.js`의 `target` 기록을 찾게 합니다. 수집 태스크는 저장하지 않아도 `완료`를 누를 수 있고, 저장했는지는 결과의 `record`에 남습니다.
- 찾기 태스크에서는 다른 보기로 넘어가는 버튼(A의 1D/3D 스위치, B의 ‘우주로 들어가기’ · ‘홈’)을 숨깁니다.

## 다른 모듈과 주고받는 것

| 모듈 | 받는 것 |
|---|---|
| `questions/questions.js` | 태스크 문구와 설문 문항 |
| `shared-data/data.json` | 두 시안이 함께 쓰는 그룹 · 기록 |
| `collector/index.html` | 수집앱 화면. 저장한 기록을 `postMessage({ type: 'sl-record', record })`로 넘겨 줌 |
| `design draft_A`, `design draft_B` | 시안 파일. 원본은 고치지 않고 `adapters.js`와 `build.mjs`가 데이터를 넣음 |
| `survey results/schema.sql` | 응답을 넣는 표 |

시안 파일이 바뀌어 연결이 깨지면 `adapters.js`(저장 키, 숨길 버튼)와 `build.mjs`(시안 A 데이터 교체)만 고치면 됩니다.

## 로컬에서 보기

```
node survey/survey-web/build.mjs
cd survey/survey-web/dist && python3 -m http.server 4173
```

`http://localhost:4173` 을 엽니다. 파일을 고치면 빌드를 다시 돌립니다.

## 배포

1. Supabase 프로젝트의 SQL 편집기에서 `survey results/schema.sql`을 실행합니다.
2. `config.js`에 프로젝트 URL과 publishable 키를 적습니다.
3. Vercel에서 이 저장소를 연결합니다. 빌드 설정은 저장소 맨 위 `vercel.json`에 있습니다.
