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