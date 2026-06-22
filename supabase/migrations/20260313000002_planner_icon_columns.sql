alter table public.courses
    add column if not exists icon text;

alter table public.tasks
    add column if not exists icon text;

alter table public.personal_tasks
    add column if not exists icon text;

alter table public.habits
    add column if not exists icon text;
