# 물빛 (Mulbit)

국내외 스노클링 스팟을 지역별로 탐색하고, 수심·시야·조류·수온 데이터와 커뮤니티 검증을
통해 믿을 수 있는 포인트를 찾을 수 있는 가이드 서비스입니다.

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

로컬 개발 시 시드 데이터:

```bash
supabase db reset  # migrations + seed.sql 적용
```

## 페이지 구조

```
/                          홈 — 지역 타일맵, 인기/히든 스팟
/regions/[region]          지역별 스팟 탐색
/spots/[slug]              스팟 상세 (게이지, 안전정보, 광고 게이트, 후기)
/spots/[slug]/contribute   상세정보(좌표/접근로/주차팁) 기여
/submit                    신규 스팟 제보 (EXIF GPS 자동 파싱)
/leaderboard                리더보드 (일반 트랙 / 핵심 트랙)
/profile/[username]        방문 스탬프, 뱃지, 칭호, 제보 이력
/membership                프리미엄 멤버십
/challenges                챌린지 이벤트
/login                     Supabase Auth (예정)
```

## 배포

Vercel 배포를 기본 타겟으로 합니다. 환경변수는 Vercel 프로젝트 설정에 동일하게 등록하세요.
