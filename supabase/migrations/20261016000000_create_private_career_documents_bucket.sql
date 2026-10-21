insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'career-documents',
  'career-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can view their career documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'career-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can upload their career documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'career-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update their career documents"
on storage.objects for update
to authenticated
using (
  bucket_id = 'career-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'career-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete their career documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'career-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
