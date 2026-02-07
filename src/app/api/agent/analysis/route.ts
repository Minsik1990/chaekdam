import { NextRequest } from "next/server";
import { analysisPrompt } from "@/lib/agent/prompts";
import { createAgentStream } from "@/lib/agent/stream";
import { getCachedContent } from "@/lib/agent/cache";
import type { BookContext } from "@/lib/agent/types";

export async function POST(request: NextRequest) {
  try {
    const { bookContext, bookId } = (await request.json()) as {
      bookContext: BookContext;
      bookId?: string;
    };

    if (!bookContext?.title) {
      return new Response(JSON.stringify({ error: "책 정보가 필요합니다" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 캐시 확인
    if (bookId) {
      const cached = await getCachedContent(bookId, "analysis");
      if (cached) {
        return new Response(JSON.stringify({ analysis: cached }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 캐시 없으면 스트리밍 생성
    return createAgentStream({
      systemPrompt: analysisPrompt(bookContext),
      messages: [
        {
          role: "user",
          content: `"${bookContext.title}" (${bookContext.author})에 대한 분석을 해주세요.`,
        },
      ],
      model: "claude-sonnet-4-5-20250929",
      maxTokens: 2048,
    });
  } catch {
    return new Response(JSON.stringify({ error: "AI 기능을 잠시 사용할 수 없어요" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
