import { NextRequest } from "next/server";
import { interviewPrompt } from "@/lib/agent/prompts";
import { createAgentStream } from "@/lib/agent/stream";
import { saveConversation } from "@/lib/agent/conversations";
import { createClient } from "@/lib/supabase/server";
import type { AgentMessage, BookContext } from "@/lib/agent/types";

export async function POST(request: NextRequest) {
  try {
    const { messages, bookContext, conversationId } = (await request.json()) as {
      messages: AgentMessage[];
      bookContext?: BookContext;
      conversationId?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "메시지가 필요합니다" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "로그인이 필요합니다" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 대화 저장 (await로 ID 확보 후 스트리밍 시작)
    let savedConversationId = conversationId;
    if (user) {
      savedConversationId = await saveConversation({
        conversationId,
        userId: user.id,
        conversationType: "interview",
        messages,
        nickname: bookContext?.title ?? "인터뷰",
      });
    }

    const response = createAgentStream({
      systemPrompt: interviewPrompt(bookContext),
      messages,
      model: "claude-haiku-4-5-20251001",
    });

    if (savedConversationId) {
      response.headers.set("X-Conversation-Id", savedConversationId);
    }

    return response;
  } catch {
    return new Response(JSON.stringify({ error: "AI 기능을 잠시 사용할 수 없어요" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
