import { NextRequest } from "next/server";
import { topicsPrompt } from "@/lib/agent/prompts";
import { createAgentStream, createAgentResponse } from "@/lib/agent/stream";
import { getCachedContent, setCachedContent } from "@/lib/agent/cache";
import { createClient } from "@/lib/supabase/server";
import type { BookContext } from "@/lib/agent/types";

export async function POST(request: NextRequest) {
  try {
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
      const cached = await getCachedContent(bookId, "topics");
      if (cached) {
        return new Response(JSON.stringify({ topics: cached, cached: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const userMessage = `"${bookContext.title}" (${bookContext.author})에 대한 독서 모임 토론 주제를 추천해주세요.`;

    // bookId가 있으면 비스트리밍으로 생성 후 캐시 저장
    if (bookId) {
      const topics = await createAgentResponse({
        systemPrompt: topicsPrompt(bookContext),
        messages: [{ role: "user", content: userMessage }],
        model: "claude-haiku-4-5-20251001",
        maxTokens: 1024,
      });

      if (topics) {
        await setCachedContent(bookId, "topics", topics, "claude-haiku-4-5");
      }

      return new Response(JSON.stringify({ topics, cached: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // bookId 없으면 스트리밍
    return createAgentStream({
      systemPrompt: topicsPrompt(bookContext),
      messages: [{ role: "user", content: userMessage }],
      model: "claude-haiku-4-5-20251001",
    });
  } catch {
    return new Response(JSON.stringify({ error: "AI 기능을 잠시 사용할 수 없어요" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
