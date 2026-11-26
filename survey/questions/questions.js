/* questions.md를 테스트 웹이 읽는 형태로 옮긴 것. 문구를 고치면 questions.md도 함께 고친다.
   type: single | multi | text.  other: '기타 (직접 입력)' 보기를 붙인다.  showIf: 앞 문항 답이 이 중 하나일 때만 보인다.
   exclusive: 복수 선택에서 혼자만 고를 수 있는 보기. */
window.SL_QUESTIONS = {
  // 디자인마다 이 순서로 한다. {target}은 찾을 기록 제목으로 바뀐다
  tasks: [
    { id: 't1', screen: 'doc', title: '문서 보기에서 기록 찾아보기', target: '알림 정책 초안', text: '‘{target}’ 기록을 찾아서 열어 보세요.' },
    { id: 't2', screen: 'space', title: '공간 보기에서 기록 찾아보기', target: '탐사선 아이콘 아이디어', text: '‘{target}’ 기록을 찾아서 열어 보세요.' },
    { id: 't3', screen: 'collector', title: '수집앱 사용해보기', text: '글을 읽다가 기록하고 싶은 게 생겼어요. 수집 앱으로 저장하고 싶은 기록물을 저장해 보세요.' },
  ],
  taskResults: ['완료', '모르겠어요', '건너뛰기'],
  // 태스크가 모두 끝나고 설문 전에 묻는다. 답(A 또는 B)은 태스크 결과와 함께 저장된다
  preference: '어떤 디자인이 더 편하셨나요?',
  intro: '나중에 다시 보려고 자료를 저장하는 습관에 대한 설문입니다. 3분 정도 걸리며, 익명으로 진행됩니다.',
  questions: [
    { id: 'q1', type: 'single', required: true, other: true, text: '현재 어떤 상황이신가요?',
      options: ['부트캠프·직무교육 교육생', '직장인'] },
    { id: 'q2', type: 'multi', required: true, other: true, text: '학습할 때 저장을 주로 어떤 기기로 하시나요?',
      options: ['PC', 'mobile'] },
    { id: 'q3', type: 'multi', required: true, other: true, text: '최근 한 달 동안, 나중에 다시 보려고 자료를 저장한 곳을 모두 골라 주세요.',
      options: ['카카오톡 나에게 보내기', '노션', '메모 앱', '브라우저 북마크', '스크린샷 (사진첩)', 'SNS 저장 (인스타그램, 유튜브 등)', '슬랙·디스코드', 'PC 폴더·클라우드 (구글 드라이브 등)'] },
    { id: 'q4', type: 'single', required: true, text: '최근 한 달 동안, 저장해 둔 자료를 찾으려다 못 찾거나 오래 걸린 적이 있나요?',
      options: ['없다', '1~2번', '3번 이상', '저장한 자료를 찾으려 한 적이 없다'] },
    { id: 'q5', type: 'single', required: true, other: true, showIf: { q: 'q4', in: ['1~2번', '3번 이상'] }, text: '못 찾았거나 오래 걸렸던 가장 큰 이유는 무엇인가요?',
      options: ['어디에 저장했는지 기억나지 않아서', '제목이나 키워드가 기억나지 않아서', '저장한 게 너무 많아서 (스크롤, 검색 결과가 많음)'] },
    { id: 'q6', type: 'single', required: true, other: true, showIf: { q: 'q4', in: ['1~2번', '3번 이상'] }, text: '그때 결국 어떻게 하셨나요?',
      options: ['끝까지 찾았다', '인터넷에서 다시 검색했다', '포기했다'] },
    { id: 'q7', type: 'single', required: true, text: '최근 한 달 동안, 이미 저장해 둔 걸 잊고 같은 자료를 다시 검색하거나 다시 저장한 적이 있나요?',
      options: ['없다', '1~2번', '3번 이상', '잘 모르겠다'] },
    { id: 'q8', type: 'single', required: true, text: '최근 일주일 동안 저장한 자료 중, 다시 열어 본 것은 어느 정도인가요?',
      options: ['최근 일주일 동안 저장한 자료가 없다', '거의 없다', '일부', '절반 정도', '대부분'] },
    { id: 'q9', type: 'single', required: true, other: true, text: '저장만 하고 다시 보지 않은 자료가 있다면, 가장 큰 이유는 무엇인가요?',
      options: ['저장한 사실을 잊어서', '찾기 어렵거나 귀찮아서', '다시 볼 일이 없어서', '다시 보지 않은 자료가 없다'] },
    { id: 'q10', type: 'single', required: true, text: '최근 한 달 동안, 따로 저장한 여러 자료를 한데 모아 함께 다시 본 적이 있나요?',
      hint: '예: 과제나 프로젝트를 할 때 관련 자료를 모아 본 경우', options: ['없다', '1~2번', '3번 이상'] },
    { id: 'q11', type: 'multi', required: true, showIf: { q: 'q10', in: ['1~2번', '3번 이상'] }, exclusive: '없다', text: '기록을 함께 활용하려 했지만 어려움을 겪은 경험이 있나요?',
      options: ['관련 기록이 어디에 있는지 찾기 어려웠다', '여러 앱이나 사이트, 혹은 화면을 오가야 했다', '기록을 다시 가져오고 분류하고 정리하는 것이 번거로웠다', '없다'] },
    { id: 'q12', type: 'single', required: true, text: '최근 한 달 동안, AI(ChatGPT, Claude 등)에게 일을 맡기면서 저장해 둔 자료를 찾아 복사하거나 첨부한 적이 있나요?',
      options: ['없다', '1~2번', '3번 이상', 'AI를 쓰지 않는다'] },
    { id: 'q13', type: 'text', required: false, text: '가장 최근에 저장한 자료를 못 찾았던 때를 떠올려 주세요. 어떤 자료였고, 어떻게 하셨나요?' },
  ],
};
