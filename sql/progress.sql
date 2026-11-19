create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^[1-9][0-9]*$' and lesson_id::integer between 1 and 40),
  completed boolean not null default false,
  score numeric,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.progress enable row level security;
