create or replace function public.compute_profile_completed(
    profile_full_name text,
    profile_occupation text,
    profile_student_status text,
    profile_school text,
    profile_department text
)
returns boolean
language sql
immutable
as $$
    select
        nullif(btrim(profile_full_name), '') is not null
        and nullif(btrim(profile_occupation), '') is not null
        and coalesce(profile_student_status, '') in ('student', 'working', 'both', 'other')
        and (
            profile_student_status not in ('student', 'both')
            or (
                nullif(btrim(profile_school), '') is not null
                and nullif(btrim(profile_department), '') is not null
            )
        );
$$;

create or replace function public.set_profile_completion()
returns trigger
language plpgsql
as $$
begin
    new.profile_completed := public.compute_profile_completed(
        new.full_name,
        new.occupation,
        new.student_status,
        new.school,
        new.department
    );

    return new;
end;
$$;

drop trigger if exists profiles_set_profile_completion on public.profiles;
create trigger profiles_set_profile_completion
before insert or update on public.profiles
for each row execute procedure public.set_profile_completion();

update public.profiles
set profile_completed = public.compute_profile_completed(
    full_name,
    occupation,
    student_status,
    school,
    department
);

alter table public.profiles
drop constraint if exists profiles_preferred_locale_check;

alter table public.profiles
add constraint profiles_preferred_locale_check
check (preferred_locale in ('tr', 'en'));

alter table public.profiles
drop constraint if exists profiles_preferred_theme_check;

alter table public.profiles
add constraint profiles_preferred_theme_check
check (preferred_theme in ('light', 'dark', 'system'));

drop policy if exists "profiles_insert_own" on public.profiles;

create unique index if not exists idx_habit_logs_user_habit_date
on public.habit_logs (user_id, habit_id, date);

insert into storage.buckets (id, name, public)
values ('lecture-notes', 'lecture-notes', false)
on conflict (id) do nothing;

drop policy if exists "lecture_notes_read_own" on storage.objects;
create policy "lecture_notes_read_own"
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
