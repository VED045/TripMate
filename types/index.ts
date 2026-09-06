// =============================================================================
// TypeScript Type Definitions for TripMate
// =============================================================================

// ---- Database Row Types ----

export interface Trip {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  cover_image_path: string | null;
  currency: string;
  access_code: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  trip_id: string;
  name: string;
  avatar_url: string | null;
  upi_id: string | null;
  is_admin: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  trip_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  amount_paise: number;
  paid_by: string;
  split_type: 'equal' | 'exact' | 'percentage' | 'shares';
  category_id: string | null;
  note: string | null;
  expense_date: string;
  receipt_url: string | null;
  receipt_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  member_id: string;
  amount_paise: number;
  percentage: number | null;
  shares: number | null;
  created_at: string;
}

export interface Settlement {
  id: string;
  trip_id: string;
  from_member_id: string;
  to_member_id: string;
  amount_paise: number;
  upi_ref: string | null;
  note: string | null;
  settled_at: string;
  recorded_by: string | null;
  created_at: string;
}

export interface SimplifiedDebt {
  fromMemberId: string;
  toMemberId: string;
  amountPaise: number;
}

export interface Media {
  id: string;
  trip_id: string;
  uploader_id: string | null;
  storage_provider: 'cloudinary' | 'supabase' | 'google_drive';
  storage_path: string;
  external_file_id: string | null;
  filename: string;
  original_filename: string;
  mime_type: string;
  media_type: 'photo' | 'video';
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  url: string | null;
  thumbnail_url: string | null;
  is_favorite: boolean;
  taken_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaTag {
  id: string;
  media_id: string;
  member_id: string;
  tagged_by: string | null;
  created_at: string;
}

export interface Album {
  id: string;
  trip_id: string;
  name: string;
  description: string | null;
  cover_media_id: string | null;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlbumMedia {
  id: string;
  album_id: string;
  media_id: string;
  added_by: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  trip_id: string;
  event_type: 'manual' | 'expense_created' | 'media_uploaded' | 'album_created' | 'member_added' | 'settlement_recorded' | 'trip_started' | 'trip_ended';
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  event_time: string;
  expense_id: string | null;
  media_id: string | null;
  album_id: string | null;
  member_id: string | null;
  settlement_id: string | null;
  created_by: string | null;
  created_at: string;
}

// ---- Enriched/Joined Types ----

export interface ExpenseWithDetails extends Expense {
  paid_by_member: Member;
  splits: (ExpenseSplit & { member: Member })[];
  category: Category | null;
}

export interface MediaWithDetails extends Media {
  uploader: Member | null;
  tags: (MediaTag & { member: Member })[];
  albums: (AlbumMedia & { album: Album })[];
}

export interface AlbumWithMedia extends Album {
  media: MediaWithDetails[];
  media_count: number;
  cover_media: Media | null;
}

export interface MemberWithStats extends Member {
  photo_count: number;
  video_count: number;
  total_paid_paise: number;
  total_owed_paise: number;
  net_balance_paise: number;
}

// ---- Form Types ----

export interface CreateTripInput {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  access_code?: string;
}

export interface CreateMemberInput {
  name: string;
  upi_id?: string;
  color?: string;
}

export interface CreateExpenseInput {
  title: string;
  amount_rupees: number; // UI uses rupees, converted to paise server-side
  paid_by: string;
  split_type: 'equal' | 'exact' | 'percentage' | 'shares';
  participant_ids: string[];
  splits?: { member_id: string; value: number }[]; // for non-equal splits
  category_id?: string;
  note?: string;
  expense_date?: string;
}

export interface CreateSettlementInput {
  from_member_id: string;
  to_member_id: string;
  amount_rupees: number;
  upi_ref?: string;
  note?: string;
  recorded_by?: string;
}

export interface UploadMediaInput {
  files: File[];
  tag_member_ids: string[];
  album_ids: string[];
  uploader_id?: string;
}

// ---- Analytics Types ----

export interface TripStats {
  totalSpentPaise: number;
  averagePerPersonPaise: number;
  highestExpensePaise: number;
  expenseCount: number;
  photoCount: number;
  videoCount: number;
  memberCount: number;
  dayCount: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalPaise: number;
  percentage: number;
  count: number;
}

export interface DailySpending {
  date: string;
  totalPaise: number;
  expenseCount: number;
}

export interface TopSpender {
  member: Member;
  totalPaidPaise: number;
  rank: number;
}

export interface TripPulseItem {
  icon: string;
  text: string;
  value?: string;
  highlight?: boolean;
}

// ---- Database Supabase type (for createClient typing) ----

export interface Database {
  public: {
    Tables: {
      trips: { Row: Trip; Insert: Partial<Trip>; Update: Partial<Trip>; Relationships: [] };
      members: { Row: Member; Insert: Partial<Member>; Update: Partial<Member>; Relationships: [] };
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category>; Relationships: [] };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense>; Relationships: [] };
      expense_splits: { Row: ExpenseSplit; Insert: Partial<ExpenseSplit>; Update: Partial<ExpenseSplit>; Relationships: [] };
      settlements: { Row: Settlement; Insert: Partial<Settlement>; Update: Partial<Settlement>; Relationships: [] };
      media: { Row: Media; Insert: Partial<Media>; Update: Partial<Media>; Relationships: [] };
      media_tags: { Row: MediaTag; Insert: Partial<MediaTag>; Update: Partial<MediaTag>; Relationships: [] };
      albums: { Row: Album; Insert: Partial<Album>; Update: Partial<Album>; Relationships: [] };
      album_media: { Row: AlbumMedia; Insert: Partial<AlbumMedia>; Update: Partial<AlbumMedia>; Relationships: [] };
      timeline_events: { Row: TimelineEvent; Insert: Partial<TimelineEvent>; Update: Partial<TimelineEvent>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
