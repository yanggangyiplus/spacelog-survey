-- 테스트 · 설문 응답 표. 웹(익명)은 "넣기"만 할 수 있고, 읽기 · 고치기 · 지우기는 못 한다.
-- kind = 'tasks': 태스크 6개 결과(참가자가 설문을 끝내지 않아도 남는다) / 'survey': 설문 답
create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  participant_id uuid not null,
  kind text not null check (kind in ('tasks', 'survey')),
  design_order text not null check (design_order in ('AB', 'BA')),
  payload jsonb not null check (pg_column_size(payload) < 20000)
);
alter table public.survey_responses enable row level security;
drop policy if exists "anon can insert" on public.survey_responses;
create policy "anon can insert" on public.survey_responses for insert to anon with check (true);
