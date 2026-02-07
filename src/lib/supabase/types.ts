// v2 타입 정의 (Supabase 연결 후 `supabase gen types`로 자동 생성 교체 예정)

export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  bio?: string | null;
  created_at: string;
}

export interface Book {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string;
  cover_image_url: string | null;
  description: string;
  api_source: string;
  created_at: string;
}

export type RecordStatus = "reading" | "completed" | "wishlist";
export type CardColor = "white" | "peach" | "lavender" | "mint" | "lemon" | "rose" | "sky";

export interface ReadingRecord {
  id: string;
  user_id: string;
  book_id: string;
  status: RecordStatus;
  rating: number | null;
  content: string | null;
  quote: string | null;
  card_color: CardColor;
  summary: string | null;
  started_at: string | null;
  finished_at: string | null;
  visibility: "public" | "private" | "friends";
  created_at: string;
  updated_at: string;
}

export interface RecordWithBook extends ReadingRecord {
  books: Book | null;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
}

export interface ReadingGroup {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
}

export interface Session {
  id: string;
  group_id: string;
  book_id: string | null;
  session_date: string;
  presenter_id: string | null;
  presentation_text: string;
  status: "upcoming" | "completed";
  created_at: string;
  updated_at: string;
}

export interface SessionWithBook extends Session {
  books: Book | null;
  presenter_profile?: Profile | null;
}

export interface SessionReview {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  rating: number | null;
  created_at: string;
}

export interface SessionReviewWithProfile extends SessionReview {
  profiles: Profile | null;
}

export interface AgentConversation {
  id: string;
  user_id: string;
  book_id: string | null;
  session_id: string | null;
  messages: { role: string; content: string; timestamp: string }[];
  conversation_type: "record_interview" | "group_discussion" | "analysis";
  created_at: string;
  updated_at: string;
}

export interface AiContent {
  id: string;
  book_id: string;
  content_type: string;
  content: { [key: string]: unknown };
  model_used: string;
  created_at: string;
}

export interface InviteCode {
  code: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
}
