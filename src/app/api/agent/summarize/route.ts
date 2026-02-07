import { NextRequest, NextResponse } from "next/server";
import { summarizePrompt } from "@/lib/agent/prompts";
import { createAgentResponse } from "@/lib/agent/stream";
import type { AgentMessage, BookContext } from "@/lib/agent/types";

export async function POST(request: NextRequest) {
  try {
    const { messages, bookContext } = (await request.json()) as {
      messages: AgentMessage[];
      bookContext?: BookContext;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "메시지가 필요합니다" }, { status: 400 });
    }

    const summary = await createAgentResponse({
      systemPrompt: summarizePrompt(bookContext),
      messages: [
        ...messages,
        {
          role: "user" as const,
          content: "위 대화 내용을 바탕으로 독서 감상문을 정리해주세요.",
        },
      ],
      model: "claude-sonnet-4-5-20250929",
    });

    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "AI 기능을 잠시 사용할 수 없어요" }, { status: 500 });
  }
}
