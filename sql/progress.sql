create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^[1-9][0-9]*$' and lesson_id::integer between 1 and 40),
  completed boolean not null default false,
  score numeric,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.progress enable row level security;

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^[1-9][0-9]*$' and lesson_id::integer between 1 and 40),
  identification_answers jsonb not null check (jsonb_typeof(identification_answers) = 'array'),
  multiple_choice_answers jsonb not null check (jsonb_typeof(multiple_choice_answers) = 'array'),
  essay_answer text not null,
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  passed boolean not null,
  created_at timestamptz not null default now()
);

alter table public.exam_attempts enable row level security;

create or replace function public.record_exam_attempt(
  p_user_id uuid,
  p_lesson_id text,
  p_identification_answers jsonb,
  p_multiple_choice_answers jsonb,
  p_essay_answer text,
  p_score integer,
  p_total integer,
  p_passed boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.exam_attempts (
    user_id,
    lesson_id,
    identification_answers,
    multiple_choice_answers,
    essay_answer,
    score,
    total,
    passed
  ) values (
    p_user_id,
    p_lesson_id,
    p_identification_answers,
    p_multiple_choice_answers,
    p_essay_answer,
    p_score,
    p_total,
    p_passed
  );

  if p_passed then
    insert into public.progress (user_id, lesson_id, completed, score, updated_at)
    values (p_user_id, p_lesson_id, true, p_score, now())
    on conflict (user_id, lesson_id) do update
      set completed = true,
          score = excluded.score,
          updated_at = excluded.updated_at;
  end if;
end;
$$;

revoke all on function public.record_exam_attempt(uuid, text, jsonb, jsonb, text, integer, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.record_exam_attempt(uuid, text, jsonb, jsonb, text, integer, integer, boolean)
  to service_role;
