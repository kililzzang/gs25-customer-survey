/**
 * Supabase 테이블 타입 정의 (손으로 작성한 초기 버전).
 *
 * 실제 프로젝트 연결 후에는 아래 명령으로 자동 생성된 타입으로 교체하는 것을 권장합니다:
 *   npx supabase gen types typescript --project-id <project-id> > lib/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type RegionCode =
  | "gyeonggi"
  | "gangwon"
  | "chungcheong"
  | "gyeongbuk"
  | "gyeongnam"
  | "jeolla"
  | "jeju"
  | "overseas";

export type SpotStatus = "pending" | "verified" | "needs_update" | "hidden" | "rejected";
export type CurrentLevel = "calm" | "moderate" | "strong" | "unknown";
export type SpotDifficulty = "beginner" | "intermediate" | "advanced";
export type GuideTier = "newbie" | "explorer" | "local_guide" | "master";
export type ReportType =
  | "new_spot"
  | "detail_route"
  | "detail_parking"
  | "correction"
  | "revalidation";
export type ReportStatus = "pending" | "approved" | "rejected";
export type LeaderboardTrack = "general" | "core";
export type UnlockCondition = "login" | "ad" | "ad_or_login" | "premium_only";
export type TerrainType = "flat" | "stairs" | "rock" | "sand";
export type ParkingType = "free" | "paid";
export type CrowdTag = "quiet" | "moderate" | "crowded";
export type EmergencyFacilityType = "hospital" | "clinic" | "health_center";
export type SpeciesFrequency = "common" | "occasional" | "rare";
export type PartnerListingType = "rental" | "tour" | "route_food" | "route_cafe";
export type ActivityType = "snorkeling" | "sea_swimming" | "surfing" | "freediving" | "scuba";
export type SpotTerrainType = "sand_beach" | "rocky_shore" | "breakwater" | "reef_zone";
export type SurfBreakType = "beach_break" | "reef_break" | "point_break";
export type ScubaUnderwaterTerrain = "wreck" | "wall" | "reef" | "cave" | "artificial_reef";
export type ScubaCertLevel = "open_water" | "advanced" | "rescue" | "divemaster";
export type CertOrg = "PADI" | "AIDA" | "SSI" | "NAUI" | "KOSDA" | "other";
/** 'all' = 액티비티 무관 전체 합산 트랙 */
export type LeaderboardActivity = "all" | ActivityType;

export type SpotRow = {
  id: string;
  slug: string;
  name: string;
  region: RegionCode;
  /** 시/군 단위 세부 지역명 (예: "삼척", "울진"). region enum보다 세분화된 표시용 텍스트. */
  subregion: string | null;
  description: string | null;
  approx_lat: number;
  approx_lng: number;
  /** 좌표가 실사(GPS 현장 측정)로 검증되었는지 여부. false면 지도 기준 추정치. */
  coordinates_verified: boolean;
  depth_min_m: number | null;
  depth_max_m: number | null;
  visibility_m: number | null;
  current_level: CurrentLevel;
  water_temp_c: number | null;
  /** @deprecated 하위호환용 스노클링 기준 난이도. 신규 코드는 spot_activity_difficulty를 사용하세요. */
  difficulty: SpotDifficulty | null;
  /** 이 스팟에서 가능한 액티비티 목록(다중 선택). */
  activities: ActivityType[];
  /** 입수 지형(백사장/갯바위/방파제/암초지대). activities와 독립적인 속성. */
  terrain: SpotTerrainType | null;
  is_hidden: boolean;
  status: SpotStatus;
  trust_score: number;
  last_verified_at: string | null;
  like_count: number;
  first_reporter_id: string | null;
  /** 성능/부하 테스트용 자동 생성 더미 스팟 여부. 오픈 전 전량 삭제 대상. */
  synthetic_test: boolean;
  /** 이 스팟만 app_settings.detail_unlock_condition과 다른 조건을 적용. null이면 전역 설정 따름. */
  unlock_condition_override: UnlockCondition | null;
  created_at: string;
  updated_at: string;
}

export type SpotSafetyInfoRow = {
  spot_id: string;
  emergency_contacts: { label: string; phone: string }[];
  current_warning: string | null;
  updated_at: string;
}

export type SpotLockedInfoRow = {
  spot_id: string;
  exact_lat: number | null;
  exact_lng: number | null;
  access_route: string | null;
  parking_tip: string | null;
  estimated_walk_minutes: number | null;
  has_restroom: boolean | null;
  has_shower: boolean | null;
  contributor_id: string | null;
  updated_at: string;
}

export type SpotAccessStepRow = {
  id: string;
  spot_id: string;
  step_order: number;
  title: string;
  description: string | null;
  photo_storage_path: string | null;
  lat: number | null;
  lng: number | null;
  terrain_type: TerrainType | null;
  created_at: string;
  updated_at: string;
}

export type SpotParkingOptionRow = {
  id: string;
  spot_id: string;
  label: string;
  parking_type: ParkingType;
  lat: number | null;
  lng: number | null;
  note: string | null;
  is_primary: boolean;
  created_at: string;
}

export type SpotEmergencyFacilityRow = {
  id: string;
  spot_id: string;
  name: string;
  phone: string | null;
  facility_type: EmergencyFacilityType;
  distance_km: number | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export type FeatureFlagRow = {
  key: string;
  label: string;
  stage: 1 | 2 | 3;
  enabled: boolean;
  description: string | null;
  updated_at: string;
}

export type SpotActivityDifficultyRow = {
  spot_id: string;
  activity: ActivityType;
  difficulty: SpotDifficulty;
}

export type SpotSurfConditionsRow = {
  spot_id: string;
  wave_height_min_m: number | null;
  wave_height_max_m: number | null;
  swell_period_sec: number | null;
  wind_direction: string | null;
  break_type: SurfBreakType | null;
  updated_at: string;
}

export type SpotFreediveConditionsRow = {
  spot_id: string;
  max_depth_zone_m: number | null;
  has_safety_line: boolean | null;
  has_buoy: boolean | null;
  notes: string | null;
  updated_at: string;
}

export type SpotScubaConditionsRow = {
  spot_id: string;
  underwater_terrain: ScubaUnderwaterTerrain | null;
  required_cert_level: ScubaCertLevel | null;
  max_depth_m: number | null;
  notes: string | null;
  updated_at: string;
}

export type ActivitySafetyTemplateRow = {
  activity: ActivityType;
  title: string;
  body: string;
}

export type UserCertificationRow = {
  id: string;
  user_id: string;
  org: CertOrg;
  level: string;
  cert_number: string | null;
  issued_at: string | null;
  verified: boolean;
  created_at: string;
}

export type CommunityPostRow = {
  id: string;
  author_id: string;
  username?: string;
  activity: ActivityType;
  title: string;
  body: string;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export type CommunityReplyRow = {
  id: string;
  post_id: string;
  author_id: string;
  username?: string;
  body: string;
  created_at: string;
}

export type CreatorLinkType = "blog" | "youtube" | "other";

export type SpotCreatorLinkRow = {
  id: string;
  spot_id: string;
  user_id: string;
  username?: string;
  link_type: CreatorLinkType;
  url: string;
  title: string;
  is_hidden: boolean;
  created_at: string;
}

export type SpotPhotoRow = {
  id: string;
  spot_id: string;
  uploader_id: string | null;
  storage_path: string;
  /** 비공개 원본 버킷(spot-photos-originals) 경로. 검증/분쟁 대응용, service-role만 접근. */
  original_storage_path: string | null;
  exif_lat: number | null;
  exif_lng: number | null;
  exif_gps_delta_m: number | null;
  gps_verified: boolean | null;
  is_cover: boolean;
  created_at: string;
}

export type PartnerListingRow = {
  id: string;
  spot_id: string | null;
  partner_name: string;
  listing_type: PartnerListingType;
  banner_url: string | null;
  cta_url: string | null;
  cta_label: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export type SpeciesRow = {
  id: string;
  name: string;
  scientific_name: string | null;
  category: string | null;
  icon: string | null;
  created_at: string;
}

export type SpotSpeciesRow = {
  spot_id: string;
  species_id: string;
  frequency: SpeciesFrequency | null;
}

export type SpotCheckinRow = {
  id: string;
  spot_id: string;
  user_id: string;
  checked_in_at: string;
  expires_at: string;
}

export type SpotAccessStepRevisionRow = {
  id: string;
  spot_id: string;
  reason: string;
  snapshot: Json;
  changed_by: string | null;
  created_at: string;
}

export type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  trust_score: number;
  guide_tier: GuideTier;
  created_at: string;
  updated_at: string;
}

export type ReportRow = {
  id: string;
  spot_id: string | null;
  reporter_id: string;
  type: ReportType;
  payload: Json;
  status: ReportStatus;
  activity: ActivityType | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export type LeaderboardScoreRow = {
  id: string;
  user_id: string;
  track: LeaderboardTrack;
  period: string;
  activity: LeaderboardActivity;
  score: number;
  breakdown: Json;
  rank: number | null;
  updated_at: string;
}

export type VisitStampRow = {
  id: string;
  user_id: string;
  spot_id: string;
  visited_at: string;
  note: string | null;
  created_at: string;
}

export type BadgeRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export type SpotReviewRow = {
  id: string;
  spot_id: string;
  user_id: string;
  username?: string;
  rating: number;
  body: string;
  crowd_tag: CrowdTag | null;
  visited_at: string | null;
  created_at: string;
}

export type ChallengeRow = {
  id: string;
  title: string;
  description: string | null;
  region: RegionCode | null;
  criteria: Json;
  reward_badge_id: string | null;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

type TableShape<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      spots: TableShape<SpotRow>;
      spot_safety_info: TableShape<SpotSafetyInfoRow>;
      spot_locked_info: TableShape<SpotLockedInfoRow>;
      spot_photos: TableShape<SpotPhotoRow>;
      partner_listings: TableShape<PartnerListingRow>;
      profiles: TableShape<ProfileRow>;
      reports: TableShape<ReportRow>;
      leaderboard_scores: TableShape<LeaderboardScoreRow>;
      visit_stamps: TableShape<VisitStampRow>;
      badges: TableShape<BadgeRow>;
      challenges: TableShape<ChallengeRow>;
      spot_reviews: TableShape<SpotReviewRow>;
      spot_access_steps: TableShape<SpotAccessStepRow>;
      spot_parking_options: TableShape<SpotParkingOptionRow>;
      spot_emergency_facilities: TableShape<SpotEmergencyFacilityRow>;
      feature_flags: TableShape<FeatureFlagRow>;
      species: TableShape<SpeciesRow>;
      spot_species: TableShape<SpotSpeciesRow>;
      spot_checkins: TableShape<SpotCheckinRow>;
      spot_access_step_revisions: TableShape<SpotAccessStepRevisionRow>;
      spot_activity_difficulty: TableShape<SpotActivityDifficultyRow>;
      spot_surf_conditions: TableShape<SpotSurfConditionsRow>;
      spot_freedive_conditions: TableShape<SpotFreediveConditionsRow>;
      spot_scuba_conditions: TableShape<SpotScubaConditionsRow>;
      activity_safety_templates: TableShape<ActivitySafetyTemplateRow>;
      user_certifications: TableShape<UserCertificationRow>;
      community_posts: TableShape<CommunityPostRow>;
      community_replies: TableShape<CommunityReplyRow>;
      spot_creator_links: TableShape<SpotCreatorLinkRow>;
    };
    Views: Record<string, never>;
    Functions: {
      unlock_spot_details: {
        Args: { p_spot_id: string };
        Returns: {
          exact_lat: number | null;
          exact_lng: number | null;
          access_route: string | null;
          parking_tip: string | null;
          estimated_walk_minutes: number | null;
          has_restroom: boolean | null;
          has_shower: boolean | null;
        }[];
      };
      check_rate_limit: {
        Args: {
          p_identity_key: string;
          p_path: string | null;
          p_spot_id: string | null;
          p_limit_per_minute: number;
        };
        Returns: boolean;
      };
      verify_photo_gps: {
        Args: { p_photo_id: string; p_threshold_m: number };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
