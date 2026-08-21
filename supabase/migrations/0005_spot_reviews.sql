-- 물빛(Mulbit) — 0005: 스팟 후기 (무료 공개 정보)
-- ------------------------------------------------------------------

create table spot_reviews (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  visited_at date,
  created_at timestamptz not null default now(),
  unique (spot_id, user_id)
);

create index spot_reviews_spot_id_idx on spot_reviews (spot_id);

alter table spot_reviews enable row level security;

create policy "reviews are publicly readable" on spot_reviews
  for select using (true);

create policy "authenticated users can write reviews" on spot_reviews
  for insert to authenticated with check (auth.uid() = user_id);

create policy "users can update own reviews" on spot_reviews
  for update using (auth.uid() = user_id);

create policy "users can delete own reviews" on spot_reviews
  for delete using (auth.uid() = user_id);
