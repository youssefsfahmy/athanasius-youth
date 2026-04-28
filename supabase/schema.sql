-- ============================================
-- Church Person Record System - Database Schema
-- ============================================
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. servant_profiles
-- ============================================
create table servant_profiles (
    id uuid primary key default uuid_generate_v4(),
    auth_user_id uuid unique not null references auth.users(id) on delete cascade,
    full_name text not null,
    created_at timestamptz default now()
);

-- ============================================
-- 2. people
-- ============================================
create table people (
    id uuid primary key default uuid_generate_v4(),
    full_name text not null,
    -- Contact
    phone_primary text,
    phone_secondary text,
    phone_landline text,
    phone_father text,
    phone_mother text,
    -- Personal
    gender text,
    birth_date date,
    -- Address
    address_area text,
    address_building text,
    address_street text,
    address_details text,
    address_floor text,
    address_apartment text,
    address_landmark text,
    -- Education
    education_college text,
    education_university text,
    education_year text,
    -- Church
    church_confession_father text,
    church_family_group text,
    church_family_servant text,
    church_last_checkup_date date,
    -- Social
    social_facebook_url text,
    -- System
    notes_public text,
    notes_private text,
    image_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ============================================
-- 3. attendance
-- ============================================
create table attendance (
    id uuid primary key default uuid_generate_v4(),
    person_id uuid not null references people(id) on delete cascade,
    event_date date not null,
    event_name text not null,
    status text not null check (status in ('present', 'absent')),
    notes text,
    recorded_by uuid references servant_profiles(id),
    created_at timestamptz default now()
);

-- ============================================
-- 4. checkups
-- ============================================
create table checkups (
    id uuid primary key default uuid_generate_v4(),
    person_id uuid not null references people(id) on delete cascade,
    checkup_date date not null,
    contacted_by uuid references servant_profiles(id),
    method text not null check (method in ('call', 'WhatsApp', 'visit', 'other')),
    comment text,
    follow_up_needed boolean default false,
    next_follow_up_date date,
    created_at timestamptz default now()
);

-- ============================================
-- Indexes
-- ============================================
create index idx_people_full_name on people(full_name);

create index idx_people_education_year on people(education_year);

create index idx_attendance_person_id on attendance(person_id);

create index idx_attendance_event_date on attendance(event_date);

create index idx_checkups_person_id on checkups(person_id);

create index idx_checkups_follow_up on checkups(follow_up_needed, next_follow_up_date);

-- ============================================
-- Auto-update updated_at trigger for people
-- ============================================
create
or replace function update_updated_at() returns trigger as $ $ begin new.updated_at = now();

return new;

end;

$ $ language plpgsql;

create trigger people_updated_at before
update
    on people for each row execute function update_updated_at();

-- ============================================
-- Auto-create servant_profile on user signup
-- ============================================
create
or replace function handle_new_user() returns trigger as $ $ begin
insert into
    public.servant_profiles (auth_user_id, full_name)
values
    (
        new.id,
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            new.email
        )
    );

return new;

end;

$ $ language plpgsql security definer;

create trigger on_auth_user_created
after
insert
    on auth.users for each row execute function handle_new_user();

-- ============================================
-- Row Level Security Policies
-- ============================================
-- servant_profiles
alter table
    servant_profiles enable row level security;

create policy "Authenticated users can read servant_profiles" on servant_profiles for
select
    to authenticated using (true);

create policy "Authenticated users can insert servant_profiles" on servant_profiles for
insert
    to authenticated with check (true);

create policy "Authenticated users can update servant_profiles" on servant_profiles for
update
    to authenticated using (true);

-- people
alter table
    people enable row level security;

create policy "Authenticated users can read people" on people for
select
    to authenticated using (true);

create policy "Authenticated users can insert people" on people for
insert
    to authenticated with check (true);

create policy "Authenticated users can update people" on people for
update
    to authenticated using (true);

create policy "Authenticated users can delete people" on people for delete to authenticated using (true);

-- attendance
alter table
    attendance enable row level security;

create policy "Authenticated users can read attendance" on attendance for
select
    to authenticated using (true);

create policy "Authenticated users can insert attendance" on attendance for
insert
    to authenticated with check (true);

create policy "Authenticated users can update attendance" on attendance for
update
    to authenticated using (true);

create policy "Authenticated users can delete attendance" on attendance for delete to authenticated using (true);

-- checkups
alter table
    checkups enable row level security;

create policy "Authenticated users can read checkups" on checkups for
select
    to authenticated using (true);

create policy "Authenticated users can insert checkups" on checkups for
insert
    to authenticated with check (true);

create policy "Authenticated users can update checkups" on checkups for
update
    to authenticated using (true);

create policy "Authenticated users can delete checkups" on checkups for delete to authenticated using (true);

-- storage
insert into
    storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
values
    (
        'person-images',
        'person-images',
        true,
        5242880,
        array ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    ) on conflict (id) do nothing;

create policy "Authenticated users can view person images" on storage.objects for
select
    to authenticated using (bucket_id = 'person-images');

create policy "Authenticated users can upload person images" on storage.objects for
insert
    to authenticated with check (bucket_id = 'person-images');

create policy "Authenticated users can update person images" on storage.objects for
update
    to authenticated using (bucket_id = 'person-images') with check (bucket_id = 'person-images');

create policy "Authenticated users can delete person images" on storage.objects for delete to authenticated using (bucket_id = 'person-images');