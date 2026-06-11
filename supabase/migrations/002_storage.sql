-- Storageバケット作成
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', false)
on conflict (id) do nothing;

-- RLS: 自世帯のレシピ写真のみアクセス可能
create policy "自世帯の写真を参照" on storage.objects
  for select using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] in (
      select household_id::text from profiles where id = auth.uid()
    )
  );

create policy "自世帯の写真をアップロード" on storage.objects
  for insert with check (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] in (
      select household_id::text from profiles where id = auth.uid()
    )
  );

create policy "自世帯の写真を削除" on storage.objects
  for delete using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] in (
      select household_id::text from profiles where id = auth.uid()
    )
  );
