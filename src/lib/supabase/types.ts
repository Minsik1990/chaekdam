// 수동 타입 정의 (Supabase 연결 후 `supabase gen types`로 자동 생성 교체 예정)

export interface ReadingGroup {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
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

export interface Session {
  id: string;
  group_id: string;
  book_id: string | null;
  session_date: string;
  presenter: string;
  presentation_text: string;
  status: "upcoming" | "completed";
  created_at: string;
  updated_at: string;
}

export interface SessionWithBook extends Session {
  books: Book | null;
}

export interface Review {
  id: string;
  session_id: string;
  nickname: string;
  content: string;
  rating: number | null;
  created_at: string;
}

export interface AgentConversation {
  id: string;
  nickname: string;
  book_id: string | null;
  session_id: string | null;
  messages: { role: string; content: string; timestamp: string }[];
  conversation_type: "free_chat" | "preparation" | "review";
  created_at: string;
  updated_at: string;
}
