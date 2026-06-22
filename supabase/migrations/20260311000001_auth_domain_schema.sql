create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null,
    full_name text,
    avatar_url text,
    occupation text,
    student_status text not null default 'other' check (student_status in ('student', 'working', 'both', 'other')),
    school text,
    department text,
    grade text,
    plan text not null default 'free' check (plan in ('free', 'pro')),
    onboarding_completed boolean not null default false,
    profile_completed boolean not null default false,
    preferred_locale text not null default 'tr',
    preferred_theme text not null default 'system',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (
        id,
        email,
        full_name,
        avatar_url
    )
    values (
        new.id,
        coalesce(new.email, ''),
        new.raw_user_meta_data ->> 'full_name',
        coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

create table if not exists public.courses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    code text,
    color text not null default '#8b5cf6',
    bg_gradient text,
    instructor text,
    credits integer,
    semester text,
    archived boolean not null default false,
    order_index integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.units (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    course_id uuid not null references public.courses (id) on delete cascade,
    name text not null,
    description text,
    order_index integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    course_id uuid references public.courses (id) on delete cascade,
    unit_id uuid references public.units (id) on delete cascade,
    title text not null,
    description text,
    completed boolean not null default false,
    completed_at timestamptz,
    due_date date,
    priority text check (priority in ('low', 'medium', 'high')),
    status text not null default 'todo' check (status in ('todo', 'in-progress', 'review', 'done')),
    tags jsonb not null default '[]'::jsonb,
    order_index integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.personal_tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    title text not null,
    description text,
    completed boolean not null default false,
    completed_at timestamptz,
    due_date date,
    priority text check (priority in ('low', 'medium', 'high')),
    status text not null default 'todo' check (status in ('todo', 'in-progress', 'review', 'done')),
    order_index integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    course_id uuid references public.courses (id) on delete cascade,
    title text not null,
    description text,
    type text not null check (type in ('exam', 'midterm', 'final', 'assignment', 'project', 'other')),
    date date not null,
    location text,
    color text,
    completed boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.habits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    description text,
    emoji text not null default '✨',
    habit_type text not null default 'boolean' check (habit_type in ('boolean', 'numeric')),
    target_value numeric,
    target_unit text,
    color text not null default '#8b5cf6',
    frequency text not null check (frequency in ('weeklyTarget', 'specificDays', 'everyXDays')),
    target_days jsonb not null default '{}'::jsonb,
    archived boolean not null default false,
    order_index integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    habit_id uuid not null references public.habits (id) on delete cascade,
    date date not null,
    status text not null check (status in ('done', 'skipped', 'missed')),
    value numeric,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.lecture_notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    course_id uuid not null references public.courses (id) on delete cascade,
    title text not null,
    file_name text not null,
    file_size bigint not null default 0,
    file_type text not null,
    storage_path text not null,
    unit_title text,
    upload_date timestamptz not null default now(),
    order_index integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    color text not null,
    icon text not null,
    archived boolean not null default false,
    created_at bigint not null,
    updated_at bigint not null
);

create table if not exists public.tags (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    color text not null,
    group_id text,
    created_at bigint not null,
    updated_at bigint not null
);

create table if not exists public.activities (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    category_id uuid not null references public.categories (id) on delete cascade,
    name text not null,
    tag_ids jsonb not null default '[]'::jsonb,
    archived boolean not null default false,
    default_goal_ids jsonb not null default '[]'::jsonb,
    created_at bigint not null,
    updated_at bigint not null
);

create table if not exists public.time_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    activity_id uuid not null references public.activities (id) on delete cascade,
    start_at bigint not null,
    end_at bigint not null,
    duration_sec integer not null,
    note text not null default '',
    date_key text not null,
    merged_from_ids jsonb not null default '[]'::jsonb,
    created_at bigint not null,
    updated_at bigint not null
);

create table if not exists public.goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    scope text not null check (scope in ('daily', 'weekly', 'monthly', 'yearly')),
    metric text not null check (metric in ('time', 'count', 'streak')),
    min_target numeric,
    max_target numeric,
    target_value numeric not null,
    activity_id uuid references public.activities (id) on delete set null,
    habit_id uuid,
    enabled boolean not null default true,
    created_at bigint not null,
    updated_at bigint not null
);

create table if not exists public.running_timers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    activity_id uuid not null references public.activities (id) on delete cascade,
    started_at bigint not null,
    paused_at bigint,
    accumulated_sec integer not null default 0,
    mode text not null default 'normal' check (mode in ('normal', 'pomodoro')),
    pomodoro_config_id text,
    created_at bigint not null
);

create index if not exists idx_profiles_updated_at on public.profiles (updated_at desc);
create index if not exists idx_courses_user_id on public.courses (user_id);
create index if not exists idx_units_user_id_course_id on public.units (user_id, course_id);
create index if not exists idx_tasks_user_id_course_id on public.tasks (user_id, course_id);
create index if not exists idx_personal_tasks_user_id on public.personal_tasks (user_id);
create index if not exists idx_events_user_id_date on public.events (user_id, date);
create index if not exists idx_habits_user_id on public.habits (user_id);
create index if not exists idx_habit_logs_user_id_habit_id on public.habit_logs (user_id, habit_id);
create index if not exists idx_lecture_notes_user_id_course_id on public.lecture_notes (user_id, course_id);
create index if not exists idx_categories_user_id on public.categories (user_id);
create index if not exists idx_tags_user_id on public.tags (user_id);
create index if not exists idx_activities_user_id_category_id on public.activities (user_id, category_id);
create index if not exists idx_time_sessions_user_id_activity_id on public.time_sessions (user_id, activity_id);
create index if not exists idx_goals_user_id_activity_id on public.goals (user_id, activity_id);
create index if not exists idx_running_timers_user_id_activity_id on public.running_timers (user_id, activity_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
before update on public.courses
for each row execute procedure public.set_updated_at();

drop trigger if exists units_set_updated_at on public.units;
create trigger units_set_updated_at
before update on public.units
for each row execute procedure public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

drop trigger if exists personal_tasks_set_updated_at on public.personal_tasks;
create trigger personal_tasks_set_updated_at
before update on public.personal_tasks
for each row execute procedure public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute procedure public.set_updated_at();

drop trigger if exists habits_set_updated_at on public.habits;
create trigger habits_set_updated_at
before update on public.habits
for each row execute procedure public.set_updated_at();

drop trigger if exists habit_logs_set_updated_at on public.habit_logs;
create trigger habit_logs_set_updated_at
before update on public.habit_logs
for each row execute procedure public.set_updated_at();

drop trigger if exists lecture_notes_set_updated_at on public.lecture_notes;
create trigger lecture_notes_set_updated_at
before update on public.lecture_notes
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.units enable row level security;
alter table public.tasks enable row level security;
alter table public.personal_tasks enable row level security;
alter table public.events enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.lecture_notes enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.activities enable row level security;
alter table public.time_sessions enable row level security;
alter table public.goals enable row level security;
alter table public.running_timers enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "courses_all_own" on public.courses;
create policy "courses_all_own"
on public.courses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "units_all_own" on public.units;
create policy "units_all_own"
on public.units
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tasks_all_own" on public.tasks;
create policy "tasks_all_own"
on public.tasks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "personal_tasks_all_own" on public.personal_tasks;
create policy "personal_tasks_all_own"
on public.personal_tasks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "events_all_own" on public.events;
create policy "events_all_own"
on public.events
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habits_all_own" on public.habits;
create policy "habits_all_own"
on public.habits
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habit_logs_all_own" on public.habit_logs;
create policy "habit_logs_all_own"
on public.habit_logs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "lecture_notes_all_own" on public.lecture_notes;
create policy "lecture_notes_all_own"
on public.lecture_notes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "categories_all_own" on public.categories;
create policy "categories_all_own"
on public.categories
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tags_all_own" on public.tags;
create policy "tags_all_own"
on public.tags
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "activities_all_own" on public.activities;
create policy "activities_all_own"
on public.activities
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "time_sessions_all_own" on public.time_sessions;
create policy "time_sessions_all_own"
on public.time_sessions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "goals_all_own" on public.goals;
create policy "goals_all_own"
on public.goals
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "running_timers_all_own" on public.running_timers;
create policy "running_timers_all_own"
on public.running_timers
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('lecture-notes', 'lecture-notes', false)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "avatars_upload_own" on storage.objects;
create policy "avatars_upload_own"
on storage.objects
for insert
with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects
for update
using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects
for delete
using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "lecture_notes_select_own" on storage.objects;
create policy "lecture_notes_select_own"
on storage.objects
for select
using (
    bucket_id = 'lecture-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "lecture_notes_upload_own" on storage.objects;
create policy "lecture_notes_upload_own"
on storage.objects
for insert
with check (
    bucket_id = 'lecture-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "lecture_notes_update_own" on storage.objects;
create policy "lecture_notes_update_own"
on storage.objects
for update
using (
    bucket_id = 'lecture-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
    bucket_id = 'lecture-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "lecture_notes_delete_own" on storage.objects;
create policy "lecture_notes_delete_own"
on storage.objects
for delete
using (
    bucket_id = 'lecture-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
);
