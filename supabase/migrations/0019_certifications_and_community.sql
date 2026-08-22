-- 물빛(Mulbit) — 0019: 공인 자격증 등록 + 액티비티별 커뮤니티 게시판 (4/5)
-- ------------------------------------------------------------------

create type cert_org as enum ('PADI', 'AIDA', 'SSI', 'NAUI', 'KOSDA', 'other');

create table user_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  org cert_org not null,
  level text not null, -- 예: 'Open Water', 'Advanced', 'Freediver Level 2'
  cert_number text,
  issued_at date,
  verified boolean not null default false, -- 관리자가 수동 확인 후 true로 전환 (외부 인증 API 연동 없음)
  created_at timestamptz not null default now()
);

create index user_certifications_user_id_idx on user_certifications (user_id);

alter table user_certifications enable row level security;

create policy "certifications publicly readable" on user_certifications
  for select using (true);
create policy "users manage own certifications" on user_certifications
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own certifications" on user_certifications
  for update using (auth.uid() = user_id);
create policy "users delete own certifications" on user_certifications
  for delete using (auth.uid() = user_id);

comment on table user_certifications is
  '유저가 등록한 PADI/AIDA 등 공인 자격증. verified=true 전환은 관리자 수동 확인'
  ' (외부 인증기관 API 연동 없음). verified 전환 시 트리거로 "인증된 전문가" 뱃지 자동 부여.';

-- verified 전환 시 "인증된 전문가" 뱃지 자동 부여
insert into badges (key, name, description, icon) values
  ('verified_professional', '인증된 전문가', 'PADI/AIDA 등 공인 자격증이 확인되었어요', '🎓')
on conflict (key) do nothing;

create or replace function award_badge_on_cert_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verified and (tg_op = 'INSERT' or old.verified is distinct from true) then
    insert into user_badges (user_id, badge_id)
    select new.user_id, id from badges where key = 'verified_professional'
    on conflict (user_id, badge_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger user_certifications_award_badge
  after insert or update on user_certifications
  for each row execute function award_badge_on_cert_verified();

-- ------------------------------------------------------------------
-- community_posts / community_replies — 액티비티별 서브 게시판
-- 기존에 게시판 기능 자체가 없어서(후기/제보는 게시판이 아님) 신규로 설계합니다.
-- ------------------------------------------------------------------

create table community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  activity activity_type not null,
  title text not null,
  body text not null,
  reply_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_posts_activity_idx on community_posts (activity, created_at desc);

create table community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index community_replies_post_id_idx on community_replies (post_id, created_at);

alter table community_posts enable row level security;
alter table community_replies enable row level security;

create policy "community posts publicly readable" on community_posts for select using (true);
create policy "authenticated users can post" on community_posts
  for insert to authenticated with check (auth.uid() = author_id);
create policy "authors can edit own posts" on community_posts
  for update using (auth.uid() = author_id);
create policy "authors can delete own posts" on community_posts
  for delete using (auth.uid() = author_id);

create policy "community replies publicly readable" on community_replies for select using (true);
create policy "authenticated users can reply" on community_replies
  for insert to authenticated with check (auth.uid() = author_id);
create policy "authors can delete own replies" on community_replies
  for delete using (auth.uid() = author_id);

create or replace function sync_community_reply_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update community_posts set reply_count = reply_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update community_posts set reply_count = greatest(reply_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger community_replies_sync_count
  after insert or delete on community_replies
  for each row execute function sync_community_reply_count();
