alter table if exists public.activities
    add column if not exists color text,
    add column if not exists icon text;
