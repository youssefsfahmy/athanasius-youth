-- Add family_group column to servant_profiles
alter table
    servant_profiles
add
    column family_group text;