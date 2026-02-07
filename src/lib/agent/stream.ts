import { getAnthropicClient } from "./client";
import type { AgentMessage } from "./types";

interface StreamOptions {
  systemPrompt: string;
  messages: AgentMessage[];
  model?: "claude-sonnet-4-5-20250929" | "claude-haiku-4-5-20251001";
  maxTokens?: number;
}

// SSE 스트리밍 응답 생성
export function createAgentStream({
  systemPrompt,
  messages,
  model = "claude-haiku-4-5-20251001",
  maxTokens = 1024,
}: StreamOptions): Response {
  const client = getAnthropicClient();
  const encoder = new TextEncoder();

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("[AI Stream Error]", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "AI 응답 생성 중 오류가 발생했습니다" })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
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

// 비스트리밍 응답 (요약, 분석 등)
export async function createAgentResponse({
  systemPrompt,
  messages,
  model = "claude-sonnet-4-5-20250929",
  maxTokens = 2048,
}: StreamOptions): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((c) => c.type === "text");
  return textBlock?.text ?? "";
}
