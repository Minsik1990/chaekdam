import { createClient } from "@/lib/supabase/server";
import type { AgentMessage } from "./types";

interface SaveConversationParams {
  conversationId?: string;
  userId: string;
  bookId?: string;
  sessionId?: string;
  conversationType: "chat" | "interview" | "summarize" | "topics" | "draft" | "analysis";
  messages: AgentMessage[];
  nickname?: string;
}

// 대화 저장 (신규 또는 업데이트)
export async function saveConversation({
  conversationId,
  userId,
  bookId,
  sessionId,
  conversationType,
  messages,
  nickname,
}: SaveConversationParams): Promise<string> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const messagesJson = messages.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: now,
  }));

  if (conversationId) {
    await supabase
      .from("agent_conversations")
      .update({
        messages: messagesJson,
        updated_at: now,
      })
      .eq("id", conversationId)
      .eq("user_id", userId);

    return conversationId;
  }

  const { data } = await supabase
    .from("agent_conversations")
    .insert({
      user_id: userId,
      book_id: bookId || null,
      session_id: sessionId || null,
      conversation_type: conversationType,
      messages: messagesJson,
      nickname: nickname || conversationType,
    })
    .select("id")
    .single();

  return data?.id ?? "";
}

// 대화 목록 조회
export async function listConversations(userId: string, type?: string, limit = 20) {
  const supabase = await createClient();

  let query = supabase
    .from("agent_conversations")
    .select("id, conversation_type, nickname, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("conversation_type", type);
  }

  const { data } = await query;
  return data ?? [];
}

// 특정 대화 조회
export async function getConversation(conversationId: string, userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("agent_conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  return data;
}
