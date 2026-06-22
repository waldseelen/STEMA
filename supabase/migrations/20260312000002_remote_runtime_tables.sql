create table if not exists public.settings (
    user_id uuid not null references auth.users (id) on delete cascade,
    key text not null,
    value jsonb not null default 'null'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, key)
);

create table if not exists public.pomodoro_configs (
    user_id uuid not null references auth.users (id) on delete cascade,
    id text not null,
    name text not null,
    work_duration integer not null,
    short_break_duration integer not null,
    long_break_duration integer not null,
    sessions_before_long_break integer not null,
    is_default boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, id)
);

create table if not exists public.rules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    trigger text not null,
    conditions jsonb not null default '[]'::jsonb,
    actions jsonb not null default '[]'::jsonb,
    enabled boolean not null default true,
    created_at bigint not null,
    updated_at bigint not null
);

create table if not exists public.reminders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    kind text not null,
    habit_id uuid,
    activity_id uuid references public.activities (id) on delete set null,
    title text not null,
    message text not null,
    schedule jsonb not null default '{}'::jsonb,
    enabled boolean not null default true,
    created_at bigint not null,
    updated_at bigint not null
);

create table if not exists public.completion_records (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    task_id uuid not null references public.tasks (id) on delete cascade,
    completed_at timestamptz not null,
    date_key text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_settings_user_id on public.settings (user_id);
create index if not exists idx_pomodoro_configs_user_id on public.pomodoro_configs (user_id);
create index if not exists idx_rules_user_id_trigger on public.rules (user_id, trigger);
create index if not exists idx_reminders_user_id on public.reminders (user_id);
create index if not exists idx_completion_records_user_id_task_id on public.completion_records (user_id, task_id);
create index if not exists idx_completion_records_user_id_date_key on public.completion_records (user_id, date_key);

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
before update on public.settings
for each row execute procedure public.set_updated_at();

drop trigger if exists pomodoro_configs_set_updated_at on public.pomodoro_configs;
create trigger pomodoro_configs_set_updated_at
before update on public.pomodoro_configs
for each row execute procedure public.set_updated_at();

drop trigger if exists completion_records_set_updated_at on public.completion_records;
create trigger completion_records_set_updated_at
before update on public.completion_records
for each row execute procedure public.set_updated_at();

alter table public.settings enable row level security;
alter table public.pomodoro_configs enable row level security;
alter table public.rules enable row level security;
alter table public.reminders enable row level security;
alter table public.completion_records enable row level security;

drop policy if exists "settings_all_own" on public.settings;
create policy "settings_all_own"
on public.settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "pomodoro_configs_all_own" on public.pomodoro_configs;
create policy "pomodoro_configs_all_own"
on public.pomodoro_configs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "rules_all_own" on public.rules;
create policy "rules_all_own"
on public.rules
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reminders_all_own" on public.reminders;
create policy "reminders_all_own"
on public.reminders
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "completion_records_all_own" on public.completion_records;
create policy "completion_records_all_own"
on public.completion_records
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
