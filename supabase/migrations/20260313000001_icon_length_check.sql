-- Limit icon column length to prevent storage exhaustion.
-- Lucide icon names are ≤48 chars; 64 gives comfortable headroom.

alter table public.courses
    add constraint courses_icon_length check (char_length(icon) <= 64);

alter table public.tasks
    add constraint tasks_icon_length check (char_length(icon) <= 64);

alter table public.personal_tasks
    add constraint personal_tasks_icon_length check (char_length(icon) <= 64);

alter table public.habits
    add constraint habits_icon_length check (char_length(icon) <= 64);

alter table public.activities
    add constraint activities_icon_length check (char_length(icon) <= 64);
