import { NextRequest } from "next/server";
import { interviewPrompt } from "@/lib/agent/prompts";
import { createAgentStream } from "@/lib/agent/stream";
import type { AgentMessage, BookContext } from "@/lib/agent/types";

export async function POST(request: NextRequest) {
  try {
    const { messages, bookContext } = (await request.json()) as {
      messages: AgentMessage[];
      bookContext?: BookContext;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "메시지가 필요합니다" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return createAgentStream({
      systemPrompt: interviewPrompt(bookContext),
      messages,
      model: "claude-haiku-4-5-20251001",
    });
  } catch {
    return new Response(JSON.stringify({ error: "AI 기능을 잠시 사용할 수 없어요" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
