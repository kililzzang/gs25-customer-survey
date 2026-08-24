-- 물빛(Mulbit) — 0021: 크리에이터 링크(블로그/유튜브) — 정보 제공자 수익/유입 도모
-- 승인 대기 없이 즉시 공개하되(로그인 유저 누구나 등록 가능), 부적절한 링크는
-- is_hidden으로 관리자가 사후 비공개 처리할 수 있게만 둡니다.
-- ------------------------------------------------------------------

create table spot_creator_links (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  link_type text not null check (link_type in ('blog', 'youtube', 'other')),
  url text not null,
  title text not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index spot_creator_links_spot_id_idx on spot_creator_links (spot_id, created_at desc);

alter table spot_creator_links enable row level security;

create policy "creator links publicly readable" on spot_creator_links
  for select using (not is_hidden);
create policy "authenticated users can add creator links" on spot_creator_links
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users can delete own creator links" on spot_creator_links
  for delete using (auth.uid() = user_id);

comment on table spot_creator_links is
  '스팟에 관련된 방문자 블로그/유튜브 콘텐츠. 정보 제공자의 트래픽/수익 유인을 위해'
  ' 로그인 유저 누구나 즉시 등록·공개 가능(승인 대기 없음). 허용 도메인 화이트리스트는'
  ' 앱 레벨(lib/creator-links.ts)에서 검증하며, is_hidden은 부적절한 링크의 사후 비공개용.';

insert into feature_flags (key, label, stage, enabled, description) values
  ('creator_links', '크리에이터 링크(블로그/유튜브)', 1, true, '방문자가 남긴 관련 블로그/유튜브 링크를 스팟 페이지에 노출, 정보 제공자 유입 유도')
on conflict (key) do update set label = excluded.label, description = excluded.description;
