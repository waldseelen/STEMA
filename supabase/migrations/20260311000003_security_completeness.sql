create or replace function public.profiles_guard_sensitive_fields()
returns trigger
language plpgsql
as $$
begin
    if tg_op = 'UPDATE'
        and auth.role() = 'authenticated'
        and new.plan is distinct from old.plan then
        raise exception 'plan cannot be updated by clients'
            using errcode = '42501';
    end if;

    return new;
end;
$$;

drop trigger if exists profiles_guard_sensitive_fields on public.profiles;
create trigger profiles_guard_sensitive_fields
before update on public.profiles
for each row execute procedure public.profiles_guard_sensitive_fields();

alter table public.lecture_notes
drop constraint if exists lecture_notes_file_type_check;

alter table public.lecture_notes
add constraint lecture_notes_file_type_check
check (file_type = 'application/pdf');

alter table public.lecture_notes
drop constraint if exists lecture_notes_file_size_check;

alter table public.lecture_notes
add constraint lecture_notes_file_size_check
check (file_size > 0 and file_size <= 52428800);

alter table public.lecture_notes
drop constraint if exists lecture_notes_file_name_check;

alter table public.lecture_notes
add constraint lecture_notes_file_name_check
check (file_name ~* '\.pdf$');

alter table public.lecture_notes
drop constraint if exists lecture_notes_storage_path_check;

alter table public.lecture_notes
add constraint lecture_notes_storage_path_check
check (storage_path like (user_id::text || '/%'));

create unique index if not exists idx_lecture_notes_storage_path
on public.lecture_notes (storage_path);

create or replace function public.validate_units_parent_ownership()
returns trigger
language plpgsql
as $$
declare
    parent_user_id uuid;
begin
    select user_id into parent_user_id
    from public.courses
    where id = new.course_id;

    if parent_user_id is null or parent_user_id <> new.user_id then
        raise exception 'course ownership mismatch for units'
            using errcode = '42501';
    end if;

    return new;
end;
$$;

create or replace function public.validate_tasks_parent_ownership()
returns trigger
language plpgsql
as $$
declare
    course_user_id uuid;
    unit_user_id uuid;
begin
    if new.course_id is not null then
        select user_id into course_user_id
        from public.courses
        where id = new.course_id;

        if course_user_id is null or course_user_id <> new.user_id then
            raise exception 'course ownership mismatch for tasks'
                using errcode = '42501';
        end if;
    end if;

    if new.unit_id is not null then
        select user_id into unit_user_id
        from public.units
        where id = new.unit_id;

        if unit_user_id is null or unit_user_id <> new.user_id then
            raise exception 'unit ownership mismatch for tasks'
                using errcode = '42501';
        end if;
    end if;

    return new;
end;
$$;

create or replace function public.validate_events_parent_ownership()
returns trigger
language plpgsql
as $$
declare
    course_user_id uuid;
begin
    if new.course_id is null then
        return new;
    end if;

    select user_id into course_user_id
    from public.courses
    where id = new.course_id;

    if course_user_id is null or course_user_id <> new.user_id then
        raise exception 'course ownership mismatch for events'
            using errcode = '42501';
    end if;

    return new;
end;
$$;

create or replace function public.validate_lecture_notes_parent_ownership()
returns trigger
language plpgsql
as $$
declare
    course_user_id uuid;
begin
    select user_id into course_user_id
    from public.courses
    where id = new.course_id;

    if course_user_id is null or course_user_id <> new.user_id then
        raise exception 'course ownership mismatch for lecture notes'
            using errcode = '42501';
    end if;

    return new;
end;
$$;

create or replace function public.validate_habit_logs_parent_ownership()
returns trigger
language plpgsql
as $$
declare
    habit_user_id uuid;
begin
    select user_id into habit_user_id
    from public.habits
    where id = new.habit_id;

    if habit_user_id is null or habit_user_id <> new.user_id then
        raise exception 'habit ownership mismatch for habit logs'
            using errcode = '42501';
    end if;

    return new;
end;
$$;

create or replace function public.validate_activities_parent_ownership()
returns trigger
language plpgsql
as $$
declare
    category_user_id uuid;
begin
    select user_id into category_user_id
    from public.categories
    where id = new.category_id;

    if category_user_id is null or category_user_id <> new.user_id then
        raise exception 'category ownership mismatch for activities'
            using errcode = '42501';
    end if;

    return new;
end;
$$;

create or replace function public.validate_activity_scoped_parent_ownership()
returns trigger
language plpgsql
as $$
declare
    activity_user_id uuid;
begin
    if new.activity_id is null then
        return new;
    end if;

    select user_id into activity_user_id
    from public.activities
    where id = new.activity_id;

    if activity_user_id is null or activity_user_id <> new.user_id then
        raise exception 'activity ownership mismatch'
            using errcode = '42501';
    end if;

    return new;
end;
$$;

drop trigger if exists units_validate_parent_ownership on public.units;
create trigger units_validate_parent_ownership
before insert or update on public.units
for each row execute procedure public.validate_units_parent_ownership();

drop trigger if exists tasks_validate_parent_ownership on public.tasks;
create trigger tasks_validate_parent_ownership
before insert or update on public.tasks
for each row execute procedure public.validate_tasks_parent_ownership();

drop trigger if exists events_validate_parent_ownership on public.events;
create trigger events_validate_parent_ownership
before insert or update on public.events
for each row execute procedure public.validate_events_parent_ownership();

drop trigger if exists lecture_notes_validate_parent_ownership on public.lecture_notes;
create trigger lecture_notes_validate_parent_ownership
before insert or update on public.lecture_notes
for each row execute procedure public.validate_lecture_notes_parent_ownership();

drop trigger if exists habit_logs_validate_parent_ownership on public.habit_logs;
create trigger habit_logs_validate_parent_ownership
before insert or update on public.habit_logs
for each row execute procedure public.validate_habit_logs_parent_ownership();

drop trigger if exists activities_validate_parent_ownership on public.activities;
create trigger activities_validate_parent_ownership
before insert or update on public.activities
for each row execute procedure public.validate_activities_parent_ownership();

drop trigger if exists time_sessions_validate_parent_ownership on public.time_sessions;
create trigger time_sessions_validate_parent_ownership
before insert or update on public.time_sessions
for each row execute procedure public.validate_activity_scoped_parent_ownership();

drop trigger if exists goals_validate_parent_ownership on public.goals;
create trigger goals_validate_parent_ownership
before insert or update on public.goals
for each row execute procedure public.validate_activity_scoped_parent_ownership();

drop trigger if exists running_timers_validate_parent_ownership on public.running_timers;
create trigger running_timers_validate_parent_ownership
before insert or update on public.running_timers
for each row execute procedure public.validate_activity_scoped_parent_ownership();

create or replace function public.delete_lecture_note_storage_object()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
    delete from storage.objects
    where bucket_id = 'lecture-notes'
      and name = old.storage_path;

    return old;
end;
$$;

drop trigger if exists lecture_notes_delete_storage_object on public.lecture_notes;
create trigger lecture_notes_delete_storage_object
after delete on public.lecture_notes
for each row execute procedure public.delete_lecture_note_storage_object();

create or replace function public.delete_lecture_note_metadata_on_storage_delete()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
    if old.bucket_id <> 'lecture-notes' then
        return old;
    end if;

    delete from public.lecture_notes
    where storage_path = old.name;

    return old;
end;
$$;

drop trigger if exists lecture_notes_delete_metadata on storage.objects;
create trigger lecture_notes_delete_metadata
after delete on storage.objects
for each row execute procedure public.delete_lecture_note_metadata_on_storage_delete();
