-- Add responsible checkup servant to people (references servant_profiles)
alter table
    people
add
    column church_checkup_servant_id uuid references servant_profiles(id);

create index idx_people_checkup_servant on people(church_checkup_servant_id);