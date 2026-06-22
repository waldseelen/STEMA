-- Fix events.type check constraint to include 'event' type.
-- The app uses type='event' for general calendar events,
-- but the original constraint only allowed exam/midterm/final/assignment/project/other.

alter table public.events
    drop constraint if exists events_type_check;

alter table public.events
    add constraint events_type_check
    check (type in ('exam', 'midterm', 'final', 'assignment', 'project', 'other', 'event'));
