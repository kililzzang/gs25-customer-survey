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
export type GuideTier = "newbie" | "explorer" | "local_guide" | "master";
export type ReportType =
  | "new_spot"
  | "detail_route"
  | "detail_parking"
  | "correction"
  | "revalidation";
export type ReportStatus = "pending" | "approved" | "rejected";
export type LeaderboardTrack = "general" | "core";

export type SpotRow = {
  id: string;
  slug: string;
  name: string;
  region: RegionCode;
  description: string | null;
  approx_lat: number;
  approx_lng: number;
  depth_min_m: number | null;
  depth_max_m: number | null;
  visibility_m: number | null;
  current_level: CurrentLevel;
  water_temp_c: number | null;
  is_hidden: boolean;
  status: SpotStatus;
  trust_score: number;
  last_verified_at: string | null;
  like_count: number;
  first_reporter_id: string | null;
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
  contributor_id: string | null;
  updated_at: string;
}

export type SpotPhotoRow = {
  id: string;
  spot_id: string;
  uploader_id: string | null;
  storage_path: string;
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
  listing_type: "rental" | "tour";
  banner_url: string | null;
  cta_url: string | null;
  cta_label: string | null;
  is_active: boolean;
  priority: number;
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
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export type LeaderboardScoreRow = {
  id: string;
  user_id: string;
  track: LeaderboardTrack;
  period: string;
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
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
