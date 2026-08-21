-- 물빛(Mulbit) — 0008: 잠금정보 열람 조건을 "로그인"으로 전환
-- (MVP 단계에서는 광고 SDK를 붙이지 않고 로그인 게이트로 시작.
--  운영 중 트래픽이 붙으면 app_settings.detail_unlock_condition 값만 바꿔서
--  광고 게이트/광고+즉시열람 병행으로 코드 변경 없이 전환 가능하도록 설계)
-- ------------------------------------------------------------------

create type unlock_condition as enum ('login', 'ad', 'ad_or_login', 'premium_only');

-- 사이트 전역 기본 잠금 해제 조건 (싱글턴 테이블)
create table app_settings (
  id boolean primary key default true check (id),
  detail_unlock_condition unlock_condition not null default 'login',
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values (true);

-- 운영자 설정값이라 클라이언트에 직접 노출하지 않음(security definer 함수를 통해서만 참조).
alter table app_settings enable row level security;

comment on table app_settings is
  '사이트 전역 설정 싱글턴. detail_unlock_condition을 바꾸면 배포 없이'
  ' 상세정보 열람 조건(로그인/광고/광고+로그인/프리미엄전용)을 전환할 수 있음.';

-- 특정 스팟만 전역 설정과 다른 조건을 걸고 싶을 때의 오버라이드
alter table spots add column unlock_condition_override unlock_condition;

comment on column spots.unlock_condition_override is
  '이 스팟만 app_settings.detail_unlock_condition과 다른 조건을 적용하고 싶을 때 사용.'
  ' null이면 전역 설정을 따름.';

-- ------------------------------------------------------------------
-- can_unlock_spot_details — 현재 유저가 이 스팟의 잠금정보를 볼 수 있는지 판정
-- spot_locked_info RPC 뿐 아니라 spot_access_steps/spot_parking_options 등
-- "정확한 위치와 접근 방법" 관련 테이블의 RLS 정책에서 공통으로 재사용.
-- ------------------------------------------------------------------

create or replace function can_unlock_spot_details(p_spot_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_condition unlock_condition;
begin
  if auth.uid() is null then
    return false;
  end if;

  select coalesce(s.unlock_condition_override, a.detail_unlock_condition)
    into v_condition
  from spots s, app_settings a
  where s.id = p_spot_id;

  if v_condition is null then
    return false; -- 존재하지 않는 스팟
  end if;

  return case v_condition
    when 'login' then true
    when 'ad_or_login' then true -- 로그인 유저는 광고 없이 즉시 (비로그인 경로는 클라이언트에서 광고 목업 처리)
    when 'premium_only' then is_premium_member(auth.uid())
    when 'ad' then (
      is_premium_member(auth.uid())
      or exists (
        select 1 from ad_unlocks
        where user_id = auth.uid() and spot_id = p_spot_id and expires_at > now()
      )
    )
    else false
  end;
end;
$$;

comment on function can_unlock_spot_details is
  '로그인/광고/프리미엄 등 unlock_condition에 따라 현재 유저가 스팟 상세 위치/접근정보를'
  ' 볼 수 있는지 판정. spot_locked_info RPC 및 spot_access_steps 등 관련 테이블 RLS에서 공용 사용.';

-- ------------------------------------------------------------------
-- unlock_spot_details RPC 재작성 — can_unlock_spot_details 기반으로 단순화
-- ------------------------------------------------------------------

create or replace function unlock_spot_details(p_spot_id uuid)
returns table (
  exact_lat double precision,
  exact_lng double precision,
  access_route text,
  parking_tip text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not can_unlock_spot_details(p_spot_id) then
    raise exception 'unlock required: sign in to view exact location and access details';
  end if;

  return query
    select sli.exact_lat, sli.exact_lng, sli.access_route, sli.parking_tip
    from spot_locked_info sli
    where sli.spot_id = p_spot_id;
end;
$$;
