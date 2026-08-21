-- 물빛(Mulbit) — 0006: 신규 가입 시 profiles row 자동 생성
-- auth.users 에 새 유저가 생기면(이메일 매직링크 최초 인증, OAuth 최초 로그인 등)
-- profiles 테이블에 대응하는 row를 자동으로 만들어줍니다.
-- ------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_display_name text;
begin
  v_username := lower(coalesce(
    nullif(new.raw_user_meta_data ->> 'user_name', ''),
    nullif(new.raw_user_meta_data ->> 'preferred_username', ''),
    split_part(coalesce(new.email, 'diver'), '@', 1)
  ));
  v_username := regexp_replace(v_username, '[^a-z0-9_]+', '_', 'g');
  if v_username = '' then
    v_username := 'diver';
  end if;

  -- 유저명 충돌 시 유저 id 앞자리를 접미사로 붙여 유니크 보장
  if exists (select 1 from public.profiles where username = v_username) then
    v_username := v_username || '_' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  v_display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    v_username
  );

  insert into public.profiles (id, username, display_name, avatar_url)
  values (new.id, v_username, v_display_name, new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on function public.handle_new_user is
  '신규 auth.users row 생성 시 profiles row를 자동 생성 (이메일/OAuth 메타데이터 기반 username 추출)';
