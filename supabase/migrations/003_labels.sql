-- ラベルグループテーブル（旧ジャンル）
create table if not exists label_groups (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ラベルテーブル（ラベルグループの子）
create table if not exists labels (
  id uuid primary key default gen_random_uuid(),
  label_group_id uuid not null references label_groups(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- レシピテーブルにlabel_idカラムを追加
alter table recipes add column if not exists label_id uuid references labels(id) on delete set null;

-- 既存ジャンルをラベルグループに移行（同一UUIDで）
insert into label_groups (id, household_id, name, sort_order, created_at)
select id, household_id, name, sort_order, created_at from genres
on conflict (id) do nothing;

-- 各ラベルグループに対してラベルを1件作成し、レシピのlabel_idを更新
with inserted_labels as (
  insert into labels (label_group_id, household_id, name, sort_order)
  select id, household_id, name, 0 from genres
  returning id, label_group_id
)
update recipes r
set label_id = il.id
from inserted_labels il
where il.label_group_id = r.genre_id;

-- RLS有効化
alter table label_groups enable row level security;
alter table labels enable row level security;

-- RLSポリシー: label_groups
create policy "自世帯のラベルグループを参照" on label_groups
  for select using (household_id = my_household_id());

create policy "自世帯のラベルグループを作成" on label_groups
  for insert with check (household_id = my_household_id());

create policy "自世帯のラベルグループを更新" on label_groups
  for update using (household_id = my_household_id());

create policy "自世帯のラベルグループを削除" on label_groups
  for delete using (household_id = my_household_id());

-- RLSポリシー: labels
create policy "自世帯のラベルを参照" on labels
  for select using (household_id = my_household_id());

create policy "自世帯のラベルを作成" on labels
  for insert with check (household_id = my_household_id());

create policy "自世帯のラベルを更新" on labels
  for update using (household_id = my_household_id());

create policy "自世帯のラベルを削除" on labels
  for delete using (household_id = my_household_id());

-- genre_idカラムを削除（label_idに移行済み）
alter table recipes drop column if exists genre_id;

-- ジャンルテーブルを削除
drop table if exists genres;
