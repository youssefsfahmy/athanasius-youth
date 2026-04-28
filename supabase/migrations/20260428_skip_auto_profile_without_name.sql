-- Only auto-create servant_profile when full_name metadata is provided.
-- Invited users (no metadata) will set up their profile on first login.
create
or replace function handle_new_user() returns trigger as $ $ begin if new.raw_user_meta_data ->> 'full_name' is not null then
insert into
    public.servant_profiles (auth_user_id, full_name)
values
    (new.id, new.raw_user_meta_data ->> 'full_name');

end if;

return new;

end;

$ $ language plpgsql security definer;