-- 물빛(Mulbit) — 0015: 사진 워터마크 + 원본 비공개 보관
--
-- 유저가 업로드하는 사진은 서버에서 자동으로 워터마크(스팟명 + "물빛" 텍스트)를
-- 우측 하단에 삽입한 버전만 공개 버킷(spot-photos)에 저장하고, 원본은 별도
-- 비공개 버킷(spot-photos-originals)에 보관합니다 (추후 검증/분쟁 대응용).
-- 실제 처리는 app/api/uploads/photo/route.ts (Node.js 런타임, sharp) 참고.
-- ------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('spot-photos-originals', 'spot-photos-originals', false)
on conflict (id) do nothing;

-- 비공개 버킷은 의도적으로 public/authenticated SELECT·INSERT 정책을 두지 않습니다.
-- service-role(관리자 전용 클라이언트, lib/supabase/admin.ts)만 RLS를 우회해 접근합니다.

alter table spot_photos add column original_storage_path text;

comment on column spot_photos.storage_path is
  '공개 버킷(spot-photos)에 저장된 워터마크 처리본 경로. 상세페이지에는 이 경로만 노출.';
comment on column spot_photos.original_storage_path is
  '비공개 버킷(spot-photos-originals)에 저장된 원본 경로. 검증/분쟁 대응용,'
  ' service-role(관리자)만 접근 가능.';
