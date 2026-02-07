import { NextRequest } from "next/server";
import { topicsPrompt } from "@/lib/agent/prompts";
import { createAgentStream } from "@/lib/agent/stream";
import type { BookContext } from "@/lib/agent/types";

export async function POST(request: NextRequest) {
  try {
    const { bookContext } = (await request.json()) as { bookContext: BookContext };

    if (!bookContext?.title) {
      return new Response(JSON.stringify({ error: "책 정보가 필요합니다" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return createAgentStream({
      systemPrompt: topicsPrompt(bookContext),
      messages: [
        {
          role: "user",
          content: `"${bookContext.title}" (${bookContext.author})에 대한 독서 모임 토론 주제를 추천해주세요.`,
        },
      ],
      model: "claude-sonnet-4-5-20250929",
    });
  } catch {
    return new Response(JSON.stringify({ error: "AI 기능을 잠시 사용할 수 없어요" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
