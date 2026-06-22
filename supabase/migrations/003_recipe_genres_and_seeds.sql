-- レシピ×ラベル 中間テーブル（多対多）
create table if not exists recipe_labels (
  recipe_id uuid not null references recipes(id) on delete cascade,
  label_id  uuid not null references labels(id)  on delete cascade,
  primary key (recipe_id, label_id)
);

-- 既存の label_id データを移行
insert into recipe_labels (recipe_id, label_id)
select id, label_id from recipes where label_id is not null
on conflict do nothing;

-- RLS
alter table recipe_labels enable row level security;

create policy "自世帯のレシピラベルを参照" on recipe_labels
  for select using (
    recipe_id in (select id from recipes where household_id = my_household_id())
  );

create policy "自世帯のレシピラベルを作成" on recipe_labels
  for insert with check (
    recipe_id in (select id from recipes where household_id = my_household_id())
  );

create policy "自世帯のレシピラベルを削除" on recipe_labels
  for delete using (
    recipe_id in (select id from recipes where household_id = my_household_id())
  );

-- タネテーブル
create table if not exists seeds (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title        text not null,
  body         text not null default '',
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists seeds_updated_at on seeds;
create trigger seeds_updated_at
  before update on seeds
  for each row execute function update_updated_at();

alter table seeds enable row level security;

create policy "自世帯のタネを参照" on seeds
  for select using (household_id = my_household_id());

create policy "自世帯のタネを作成" on seeds
  for insert with check (household_id = my_household_id());

create policy "自世帯のタネを更新" on seeds
  for update using (household_id = my_household_id());

create policy "自世帯のタネを削除" on seeds
  for delete using (household_id = my_household_id());
