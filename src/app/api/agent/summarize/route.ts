import { NextRequest, NextResponse } from "next/server";
import { summarizePrompt } from "@/lib/agent/prompts";
import { createAgentResponse } from "@/lib/agent/stream";
import { createClient } from "@/lib/supabase/server";
import type { AgentMessage, BookContext } from "@/lib/agent/types";

export async function POST(request: NextRequest) {
  try {
    const { messages, bookContext, bookId, saveAsRecord, existingSummary } =
      (await request.json()) as {
        messages: AgentMessage[];
        bookContext?: BookContext;
        bookId?: string;
        saveAsRecord?: boolean;
        existingSummary?: string;
      };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "메시지가 필요합니다" }, { status: 400 });
    }

    // 이미 요약이 있으면 AI 호출 생략 (기록 저장 전용)
    const summary =
      existingSummary ??
      (await createAgentResponse({
        systemPrompt: summarizePrompt(bookContext),
        messages: [
          ...messages,
          {
            role: "user" as const,
            content: "위 대화 내용을 바탕으로 독서 감상문을 정리해주세요.",
          },
        ],
        model: "claude-sonnet-4-5-20250929",
      }));

    // 기록으로 자동 저장
    let recordId: string | null = null;
    if (saveAsRecord && bookId && summary) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("records")
          .insert({
            user_id: user.id,
            book_id: bookId,
            content: summary,
            status: "completed",
          })
          .select("id")
          .single();

        recordId = data?.id ?? null;
      }
    }

    return NextResponse.json({ summary, recordId });
  } catch {
    return NextResponse.json({ error: "AI 기능을 잠시 사용할 수 없어요" }, { status: 500 });
  }
}
