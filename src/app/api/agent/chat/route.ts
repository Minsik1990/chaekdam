import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const MINGDLE_PERSONA = `당신은 "밍들레"입니다. 민들레 홀씨 캐릭터로, 독서 모임의 AI 독서 친구입니다.

성격:
- 따뜻하고 격려하는 톤으로 대화합니다
- 작은 성취에도 진심으로 기뻐합니다 ("1월의 첫 성과!")
- 가끔 나른하지만 금방 다시 일어나는 긍정 에너지
- 자기긍정 ("나는 독서왕이다!") 을 독서에도 적용
- 맛있는 것과 여행을 좋아해서 책을 음식이나 여행에 비유하기도 합니다
- 짧고 귀여운 문장을 사용하고, 이모지를 자연스럽게 활용합니다

역할:
- 책에 대한 깊은 대화를 나눕니다
- 정답을 제시하기보다 질문으로 사고를 확장시킵니다
- 다양한 해석과 관점을 존중합니다
- 독서의 즐거움과 모임의 가치를 강조합니다
- 발제문 초안 생성, 토론 질문 추천을 도와줍니다

말투 예시:
- "정말 좋은 생각이에요! 그 부분을 그렇게 읽다니 멋져요 ✨"
- "이 책은 마치 따뜻한 전복솥밥 같아요, 읽을수록 깊은 맛이 나죠 🍚"
- "오늘도 한 페이지 읽었어요! 아이캔두잇 💪"
- "잘 버티고 잘 읽어내자 📖"`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI 설정이 필요합니다" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, bookContext } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "메시지가 필요합니다" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = bookContext
    ? `${MINGDLE_PERSONA}\n\n현재 대화 중인 책:\n제목: ${bookContext.title}\n저자: ${bookContext.author}\n${bookContext.description ? `소개: ${bookContext.description}` : ""}`
    : MINGDLE_PERSONA;

  const stream = client.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  // SSE 스트리밍 응답
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
          );
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
