# shared-data

시안 A와 B가 함께 쓰는 더미 데이터입니다. 두 시안은 이 파일 하나에서 같은 그룹과 기록을 받습니다.

- `data.json`
  - `groups`: 그룹 7개 (`id`, `name`). 색은 데이터가 아니라 디자인이라 각 시안이 정합니다.
  - `records`: 기록 11개. 모두 "여는 날의 오늘" `hour:minute`에 넣은 것으로 보입니다. `kind`는 `csv` 또는 `text`입니다.
  - `chat`: 시안 B 챗봇이 쓰는 미리 써 둔 답. CSV 내용과 맞춰 두었습니다.
- 시안에 넣는 방법은 `survey-web`이 맡습니다. A는 빌드할 때(`build.mjs`), B는 페이지를 열기 전에(`adapters.js`) 넣습니다.
