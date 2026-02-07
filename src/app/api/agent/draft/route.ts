import { NextRequest } from "next/server";
import { draftPrompt } from "@/lib/agent/prompts";
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

    const { bookContext, bookId, userNotes } = (await request.json()) as {
      bookContext: BookContext;
      bookId?: string;
      userNotes?: string;
    };

    if (!bookContext?.title) {
      return new Response(JSON.stringify({ error: "책 정보가 필요합니다" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userMessage = userNotes
      ? `"${bookContext.title}" (${bookContext.author})에 대한 발제문 초안을 작성해주세요.\n\n발제자 메모:\n${userNotes}`
      : `"${bookContext.title}" (${bookContext.author})에 대한 발제문 초안을 작성해주세요.`;

    // userNotes가 없을 때만 캐싱 (notes 있으면 매번 다름)
    if (bookId && !userNotes) {
      const cached = await getCachedContent(bookId, "draft");
      if (cached) {
        return new Response(JSON.stringify({ draft: cached, cached: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const draft = await createAgentResponse({
        systemPrompt: draftPrompt(bookContext),
        messages: [{ role: "user", content: userMessage }],
        model: "claude-sonnet-4-5-20250929",
        maxTokens: 2048,
      });

      if (draft) {
        await setCachedContent(bookId, "draft", draft, "claude-sonnet-4-5");
      }

      return new Response(JSON.stringify({ draft, cached: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return createAgentStream({
      systemPrompt: draftPrompt(bookContext),
      messages: [{ role: "user", content: userMessage }],
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
