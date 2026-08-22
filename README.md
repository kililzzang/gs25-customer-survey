# 물빛 (Mulbit)

국내외 해양 액티비티 스팟(스노클링·바다수영·서핑·프리다이빙·스쿠버다이빙)을 지역별로
탐색하고, 수심·시야·조류·수온 등 컨디션 데이터와 커뮤니티 검증을 통해 믿을 수 있는
포인트를 찾을 수 있는 가이드 서비스입니다. 스노클링 전문 서비스로 시작해 액티비티
통합 가이드로 확장되었습니다 — 자세한 내용은 [해양 액티비티 통합 가이드 확장](#해양-액티비티-통합-가이드-확장) 참고.

## 기술 스택

- **Next.js** (App Router, React, TypeScript)
- **Supabase** (Postgres + Auth + Storage)
- **Tailwind CSS v4**
- 지도: 스키매틱 타일맵(MVP) → 카카오맵 API(국내 실좌표) → Google Maps(해외) 확장

## 디자인 톤

딥씨 네이비 & 아쿠아 톤의 다이빙 게이지 콘셉트.

| 토큰 | 색상 |
|---|---|
| navy | `#0A2E36` |
| navyDeep | `#061E24` |
| teal | `#14636B` |
| tealLight | `#1F8890` |
| foam | `#8FE3D8` |
| sand | `#F3ECDC` |
| coral | `#FF6F5E` |

헤드라인은 세리프(Noto Serif KR), 본문은 산세리프(Noto Sans KR), 수치 데이터(수심/시야 등)는
모노스페이스(JetBrains Mono)로 다이빙 게이지 느낌을 표현합니다.

## 시작하기

```bash
npm install
cp .env.local.example .env.local  # Supabase/카카오맵 키 입력
npm run dev
```

환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)가 없으면
`lib/mock-data.ts`의 목업 데이터로 자동 폴백하여 UI를 바로 확인할 수 있습니다.

## Supabase 스키마

`supabase/migrations/`에 마이그레이션이 순서대로 정리되어 있습니다.

1. `0001_core_schema.sql` — enum, profiles, spots, 잠금정보, 안전정보, 사진, 제휴 배너
2. `0002_reports_scoring_engagement.sql` — 제보, 검증, 신고, 점수 원장, 리더보드, 좋아요,
   방문 스탬프, 챌린지, 광고 언락 캐시, 알림, 멤버십
3. `0003_rls_and_functions.sql` — RLS 정책, `unlock_spot_details` RPC, 자동화 함수
   (EXIF 검증, 클러스터 승격, 신뢰도 감쇠, 자동 비공개, 유저 신뢰도 재계산)
4. `0004_leaderboard_and_storage.sql` — 제보 승인 시 자동 점수 적립 트리거, 리더보드 집계
   함수, 스토리지 버킷
5. `0005_spot_reviews.sql` — 스팟 후기(무료 공개)
6. `0006_handle_new_user.sql` — 신규 가입 시 profiles row 자동 생성 트리거
7. `0007_spot_metadata_flags.sql` — `coordinates_verified`(좌표 실사 검증 여부, 기본 false),
   `synthetic_test`(성능 테스트용 더미 여부), `difficulty`, `subregion` 컬럼 추가
8. `0008_unlock_condition_gate.sql` — `unlock_condition` enum, `app_settings` 싱글턴,
   `can_unlock_spot_details()`, `unlock_spot_details` RPC를 로그인 게이트 기준으로 재작성
9. `0009_access_and_facilities.sql` — "정확한 위치와 접근 방법" 1단계: `spot_access_steps`
   (단계별 접근 카드), `spot_parking_options`(무료/유료 주차), `spot_emergency_facilities`
   (최인접 응급실/보건소, 게이트 예외), `spot_locked_info` 확장(소요시간/화장실/샤워실),
   `spot_reviews.crowd_tag`(혼잡도 태그)
10. `0010_feature_flags.sql` — 스팟 상세 로드맵 1~3단계 30개 기능 on/off 스위치
    (`feature_flags` 테이블, 1단계만 기본 활성화)
11. `0011_stage2_conditions.sql` — `spot_transit_stops`(대중교통), `spot_conditions_cache`
    (물때/파고·풍속/자외선 통합 캐시, 게이트 예외), `partner_listings`에 경로기반
    (`route_food`/`route_cafe`) 타입 추가
12. `0012_stage3_participatory.sql` — `spot_checkins`(체크인), `species`/`spot_species`
    (생물 도감), `spot_access_step_revisions`(변경 이력), `spot_photos.season_month`,
    그 외 스토리지/리얼타임이 필요한 기능(영상/파노라마/동행공유/오프라인지도/위성감지/
    인근방문자지도)의 스키마
13. `0013_feature_flags_stage23_activation.sql` — 외부 API 없이 실제로 동작하는
    2·3단계 기능만 활성화
14. `0014_anti_scraping.sql` — `rate_limit_events`/`anomaly_flags`, `check_rate_limit()`
    (계정/IP 기준 rate limit + 이상 탐지 자동 플래그), `unlock_spot_details` RPC에 적용
15. `0015_photo_storage_originals.sql` — 비공개 원본 사진 버킷(`spot-photos-originals`),
    `spot_photos.original_storage_path`
16. `0016_activities_core.sql` — `activity_type` enum(5종), `spots.activities`(배열, GIN
    인덱스), `spots.terrain`, `spot_activity_difficulty`(액티비티별 난이도, 기존
    `spots.difficulty`는 하위호환용으로 유지하며 스노클링 값으로 백필)
17. `0017_activity_condition_tables.sql` — `spot_surf_conditions`(파고/스웰주기/바람방향/
    브레이크타입), `spot_freedive_conditions`(안전라인/부이), `spot_scuba_conditions`
    (수중지형/요구 자격레벨/최대심도)
18. `0018_activity_scoring_and_safety.sql` — `reports`/`score_events`/`leaderboard_scores`에
    `activity` 컬럼 추가(핵심 트랙 액티비티별 서브랭킹), `activity_safety_templates`
    (액티비티별 공통 안전정보 템플릿, 5종 시딩)
19. `0019_certifications_and_community.sql` — `user_certifications`(PADI/AIDA 등 공인
    자격증, 관리자 수동 인증), `community_posts`/`community_replies`(액티비티별 게시판, 신규)
20. `0020_activity_feature_flags.sql` — 액티비티 순차 오픈용 `feature_flags` 6개 시딩

### 무단 크롤링/스크래핑 방지

클라이언트 단 텍스트 복사방지(CSS user-select 차단 등)는 넣지 않았습니다 — 우회가 쉽고
UX만 저해합니다. 대신 실제로 강제되는 API 레벨 방어를 이중으로 두었습니다.

1. **계정 기준 rate limit (주 방어, 우회 불가)** — `unlock_spot_details` RPC와
   GPX 다운로드 라우트 내부에서 `auth.uid()` 기준 분당 요청 수를 체크합니다. DB 레벨이라
   Supabase REST를 직접 호출해도 피할 수 없습니다 (`check_rate_limit()`, 0014).
2. **IP 기준 보조 rate limit** — `proxy.ts`가 `/spots/:slug`, `/api/spots/*` 요청에 대해
   해시된 IP 기준으로 분당 60건까지 허용합니다 (`lib/supabase/proxy.ts`의
   `checkIpRateLimitForRequest`). 원문 IP는 저장하지 않고 SHA-256 해시만 기록합니다.
3. **`app/robots.ts`** — `/api/`, `/auth/`, `/spots/*/contribute`를 크롤러에 명시적으로
   차단. 스팟 상세 페이지 자체(공개 정보)는 계속 색인 허용.
4. **이상 탐지 자동 플래그** — rate limit 초과, 짧은 시간 내 다수 스팟 순차 조회(5분 내
   15곳 이상) 패턴을 `anomaly_flags`에 자동 기록합니다(자동 차단 아님, 관리자 검토용).
   기존 자동화 배치(`auto_hide_flagged_spots`, `apply_trust_decay` 등)와 동일한
   Postgres 함수 + 테이블 패턴을 재사용했습니다.

### 사진 워터마크

유저가 업로드하는 사진은 `app/api/uploads/photo`에서 서버가 처리합니다
(`lib/watermark.ts`, `sharp` 사용, Node.js 런타임 필요):

1. 원본을 비공개 버킷(`spot-photos-originals`)에 저장 — `lib/supabase/admin.ts`의
   service-role 클라이언트만 접근 가능 (검증/분쟁 대응용).
2. 우측 하단에 "물빛 · {스팟명}" 텍스트 워터마크를 합성한 버전만 공개 버킷
   (`spot-photos`)에 저장 — 상세페이지에는 이 워터마크본만 노출됩니다.
3. EXIF GPS는 클라이언트 신고값을 신뢰하지 않고, 서버가 원본 파일에서 `exifr`로
   직접 재추출한 뒤 `verify_photo_gps` RPC로 스팟 좌표 대비 오차를 검증합니다.

현재 `/spots/[slug]/contribute` 폼에서 실제로 동작합니다. 신규 스팟 제보(`/submit`)는
제보 시점에 아직 `spots` row가 없어(승인 후 생성) 연결하지 않았습니다 — `spot_photos.spot_id`를
nullable로 바꾸는 등 스키마/승인 플로우에 영향을 주는 결정이 필요해 보류했습니다
(코드 주석에 명시).

로고 이미지 파일이 없어 텍스트 워터마크로 구현했습니다. 실제 로고 이미지가 생기면
`lib/watermark.ts`의 SVG 텍스트 부분을 `<image>` composite로 교체하면 됩니다.

### 정확한 위치와 접근 방법 (스팟 상세 로드맵)

상세 위치/접근 정보(정확한 좌표, 접근 스텝, 주차 옵션, GPX, 변경이력)는 **로그인 게이트**를
적용합니다(광고 SDK는 아직 붙이지 않음). `app_settings.detail_unlock_condition`을
`'ad' | 'ad_or_login' | 'premium_only'`로 바꾸면 배포 없이 다른 조건으로 전환됩니다.
안전 정보(응급연락처/조류경고/최인접 응급실/SOS 버튼)는 게이트 예외로 항상 무료 공개입니다.

30개 기능(1~3단계)은 `feature_flags` 테이블로 관리합니다. `lib/feature-flags.ts`의
`FEATURE_FLAG_DEFAULTS`가 Supabase 미연결 시 폴백값입니다.

**현재 활성화 상태**

| 상태 | 기능 |
|---|---|
| ✅ 1단계 전체 | 지도 핀/경로, 로드뷰, 접근 스텝카드, 주차 세분화, 난이도 태그, 소요시간, 화장실/샤워실, 최인접 응급실, SOS 버튼, 리뷰 혼잡도 태그 |
| ✅ 2·3단계 중 외부 API 불필요 | 일출일몰(`lib/sun.ts` 순수 계산), GPX 다운로드, 경로기반 제휴처 추천, 지도 클러스터링(카카오 키 필요), 실시간 체크인, 생물도감, 접근로 변경이력 |
| ⏸️ 외부 API 연동 대기 (스키마만 준비) | 대중교통 정보, 물때 경고, 파고·풍속 오버레이, 자외선 지수, 위성사진 갱신감지 — 카카오/네이버 대중교통, 국립해양조사원, 기상청 API 연동 필요 |
| ⏸️ 무거운 인프라 대기 (스키마만 준비) | 진입로 영상, 360 파노라마, 동행자 위치공유, 오프라인 지도, AR 길찾기, 음성 안내, 실시간 인근 방문자 지도 — 스토리지/리얼타임/AR 파이프라인 필요 |

"연동 대기" 항목들은 `feature_flags.enabled = false` 상태이며 UI에도 아직 노출하지
않습니다. DB 스키마(캐시 테이블 등)만 미리 준비되어 있어, 실제 API 키/인프라가 붙으면
데이터를 채워 넣고 `feature_flags`만 켜면 됩니다(배포 코드 변경 최소화).

카카오맵/로드뷰는 `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`가 없으면 "API 키가 설정되지
않았습니다" 안내만 표시하고 조용히 비활성화됩니다.

로컬 개발 시 시드 데이터:

```bash
supabase db reset  # migrations + seed.sql 적용 (실제 스팟 33곳)
```

### 성능/부하 테스트용 더미 데이터

`supabase/seed_synthetic_test_data.sql`은 `supabase db reset`에 포함되지 않는 **별도 파일**입니다.
UI/리더보드/필터/지도 성능을 테스트할 때만 수동으로 실행하세요:

```bash
supabase db execute -f supabase/seed_synthetic_test_data.sql
```

7개 지역에 고르게 분산된 `synthetic_test = true` 더미 스팟 240개(`테스트 스팟 #001`~`#240`)가
생성됩니다. **실제 서비스 오픈 전 반드시 전량 삭제**하세요:

```sql
delete from spots where synthetic_test = true;
```

로컬(Supabase 미연결) 개발 중 이 더미 데이터를 화면에서 보고 싶다면
`.env.local`에 `NEXT_PUBLIC_INCLUDE_SYNTHETIC_TEST_SPOTS=true`를 설정하세요
(`lib/mock-data.ts`의 `MOCK_SYNTHETIC_TEST_SPOTS`를 사용, 기본은 꺼져 있음).

### 해양 액티비티 통합 가이드 확장

스노클링 전문에서 5종 액티비티(스노클링/바다수영/서핑/프리다이빙/스쿠버다이빙) 통합
가이드로 확장했습니다. `lib/activities.ts`에 액티비티 메타데이터(라벨/아이콘/색상/설명/
컨디션 신호등 판정 함수)가 모여 있습니다.

**콘텐츠 우선순위 (순차 오픈, `feature_flags`)**

| 순서 | 액티비티 | 상태 | 비고 |
|---|---|---|---|
| 1차 | 스노클링 | ✅ 항상 활성 | 플래그 없음(기존 서비스) |
| 1차 | 바다수영 | ✅ 기본 활성 | 스노클링과 동일 컨디션 필드 재사용 |
| 2차 | 서핑 | ⏸️ 기본 비활성 | 강원 양양 시드 스팟 2곳 존재, 파고/스웰/브레이크타입 컨디션 |
| 3차 | 프리다이빙 | ⏸️ 기본 비활성 | 안전라인 데이터 확보 전, 시드 스팟 없음 |
| 3차 | 스쿠버다이빙 | ⏸️ 기본 비활성 | 인증레벨 데이터 확보 전, 시드 스팟 없음 |

플래그 켜는 법은 기존 30개 기능과 동일하게 `feature_flags` 테이블의 `enabled`만
바꾸면 됩니다(배포 불필요). `community_board`(신규 커뮤니티 게시판)와
`certifications_profile`(프로필 자격증 표시)도 같은 마이그레이션(0020)에서 함께 시딩됩니다.

**로그인 게이트는 액티비티 무관하게 동일합니다** — 정확한 좌표/접근로는 여전히 로그인
후 열람, 안전정보(액티비티별 템플릿 포함)는 항상 무료 공개입니다.

**URL 라우팅 메모** — 원 요청은 `/spots/[region]/[activity]`였지만, 이미
`/spots/[slug]`가 스팟 상세 페이지 경로로 쓰이고 있어 `[slug]`와 `[region]`이 같은
깊이의 형제 동적 세그먼트로 충돌합니다(Next.js는 이를 허용하지 않음). 그래서 SEO
랜딩 페이지는 `/regions/[region]/[activity]`에 배치했고, 기존 `/spots/[slug]` URL은
그대로입니다.

아직 순차 오픈 전인 액티비티의 랜딩 페이지(`/regions/[region]/[activity]`)는 404
대신 "준비 중" 상태로 보여주고 `noindex`를 설정합니다 — URL 구조는 미리 존재하되
검색엔진에는 아직 노출되지 않습니다.

### 좌표 정확도 안내

현재 시딩된 모든 스팟의 좌표(`approx_lat`/`approx_lng`)는 지도 기준 추정치이며
`coordinates_verified = false` 상태입니다. 상세 페이지에도 "좌표 미검증" 안내가 표시됩니다.
런칭 전 현장 실사로 정확한 좌표를 확인한 뒤 운영자가 해당 컬럼을 `true`로 갱신해야 합니다.

## 페이지 구조

```
/                          홈 — 지역 타일맵, 인기/히든 스팟, 오늘 뭐가 좋을까(계절 추천)
/onboarding                액티비티+지역 2단계 선택 온보딩
/regions/[region]          지역별 스팟 탐색 (모든 액티비티, 카카오맵 색상 핀 + 레이어 토글)
/regions/[region]/[activity]  지역×액티비티 SEO 랜딩 페이지 (순차 오픈 전은 "준비 중")
/spots/[slug]              스팟 상세 (게이지, 액티비티 뱃지, 안전정보, 광고 게이트, 후기)
/spots/[slug]/contribute   상세정보(좌표/접근로/주차팁) 기여
/submit                    신규 스팟 제보 (EXIF GPS 자동 파싱)
/leaderboard                리더보드 (일반 트랙 / 핵심 트랙 — 핵심 트랙은 액티비티별 필터)
/community                 액티비티별 커뮤니티 게시판 (신규, community_board 플래그)
/community/[id]            게시글 상세 + 댓글
/profile/[username]        방문 스탬프, 뱃지, 칭호, 제보 이력, 공인 자격증
/membership                프리미엄 멤버십
/challenges                챌린지 이벤트
/login                     Supabase Auth (이메일 매직링크 / Google OAuth)
```

## 인증 (Supabase Auth)

이메일 매직링크(OTP) 로그인과 Google OAuth를 지원합니다.

- `proxy.ts` — Next.js 16부터 `middleware.ts`가 `proxy.ts`로 개명되었습니다. 요청마다
  Supabase 세션 쿠키를 갱신합니다 (`lib/supabase/proxy.ts`).
- `app/auth/confirm/route.ts` — 매직링크 클릭 시 `token_hash`를 검증하고 세션을 생성합니다.
- `app/auth/callback/route.ts` — Google OAuth 콜백에서 `code`를 세션으로 교환합니다(PKCE).
- `app/auth/signout/route.ts` — 로그아웃.
- `supabase/migrations/0006_handle_new_user.sql` — `auth.users`에 신규 유저가 생성되면
  트리거로 `profiles` row를 자동 생성합니다(이메일/OAuth 메타데이터로 username 추출).

Supabase 대시보드에서 필요한 설정:

1. Authentication → URL Configuration에 Redirect URLs로
   `http://localhost:3000/auth/confirm`, `http://localhost:3000/auth/callback`
   (배포 도메인도 동일하게) 등록
2. Google 로그인을 쓰려면 Authentication → Providers → Google 활성화 후 클라이언트 ID/Secret 등록

## 배포

Vercel 배포를 기본 타겟으로 합니다. 환경변수는 Vercel 프로젝트 설정에 동일하게 등록하세요.
