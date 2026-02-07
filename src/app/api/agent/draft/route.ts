import { NextRequest } from "next/server";
import { draftPrompt } from "@/lib/agent/prompts";
import { createAgentStream } from "@/lib/agent/stream";
import type { BookContext } from "@/lib/agent/types";

export async function POST(request: NextRequest) {
  try {
    const { bookContext, userNotes } = (await request.json()) as {
      bookContext: BookContext;
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
