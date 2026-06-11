-- 世帯テーブル
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- プロフィールテーブル（auth.usersと1:1）
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  household_id uuid references households(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ジャンルテーブル
create table if not exists genres (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- レシピテーブル
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title text not null,
  body text not null default '',
  genre_id uuid references genres(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- レシピ写真テーブル
create table if not exists recipe_photos (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  storage_path text not null,
  caption text,
  taken_on date,
  created_at timestamptz not null default now()
);

-- updated_atの自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists recipes_updated_at on recipes;
create trigger recipes_updated_at
  before update on recipes
  for each row execute function update_updated_at();

-- RLS有効化
alter table households enable row level security;
alter table profiles enable row level security;
alter table genres enable row level security;
alter table recipes enable row level security;
alter table recipe_photos enable row level security;

-- 自分のhousehold_idを取得するヘルパー関数
create or replace function my_household_id()
returns uuid as $$
  select household_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- RLSポリシー: households
create policy "自世帯のみ参照" on households
  for select using (id = my_household_id());

-- RLSポリシー: profiles
create policy "自世帯のプロフィールを参照" on profiles
  for select using (household_id = my_household_id());

create policy "自分のプロフィールを作成" on profiles
  for insert with check (id = auth.uid());

create policy "自分のプロフィールを更新" on profiles
  for update using (id = auth.uid());

-- RLSポリシー: genres
create policy "自世帯のジャンルを参照" on genres
  for select using (household_id = my_household_id());

create policy "自世帯のジャンルを作成" on genres
  for insert with check (household_id = my_household_id());

create policy "自世帯のジャンルを更新" on genres
  for update using (household_id = my_household_id());

create policy "自世帯のジャンルを削除" on genres
  for delete using (household_id = my_household_id());

-- RLSポリシー: recipes
create policy "自世帯のレシピを参照" on recipes
  for select using (household_id = my_household_id());

create policy "自世帯のレシピを作成" on recipes
  for insert with check (household_id = my_household_id());

create policy "自世帯のレシピを更新" on recipes
  for update using (household_id = my_household_id());

create policy "自世帯のレシピを削除" on recipes
  for delete using (household_id = my_household_id());

-- RLSポリシー: recipe_photos
create policy "自世帯のレシピ写真を参照" on recipe_photos
  for select using (
    recipe_id in (select id from recipes where household_id = my_household_id())
  );

create policy "自世帯のレシピ写真を作成" on recipe_photos
  for insert with check (
    recipe_id in (select id from recipes where household_id = my_household_id())
  );

create policy "自世帯のレシピ写真を削除" on recipe_photos
  for delete using (
    recipe_id in (select id from recipes where household_id = my_household_id())
  );
