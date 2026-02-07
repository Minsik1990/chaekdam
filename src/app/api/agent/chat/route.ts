import { NextRequest } from "next/server";
import { createAgentStream } from "@/lib/agent/stream";
import { chatPrompt } from "@/lib/agent/prompts";
import { saveConversation } from "@/lib/agent/conversations";
import { createClient } from "@/lib/supabase/server";
import type { AgentMessage } from "@/lib/agent/types";

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId } = (await request.json()) as {
      messages: AgentMessage[];
      conversationId?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
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
        conversationType: "chat",
        messages,
        nickname: "독서 대화",
      });
    }

    const response = createAgentStream({
      systemPrompt: chatPrompt(),
      messages,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 1024,
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
