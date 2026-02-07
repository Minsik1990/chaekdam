import { NextRequest } from "next/server";
import { createAgentStream } from "@/lib/agent/stream";
import { chatPrompt } from "@/lib/agent/prompts";
import type { AgentRequest } from "@/lib/agent/types";

export async function POST(request: NextRequest) {
  const { messages }: AgentRequest = await request.json();

  return createAgentStream({
    systemPrompt: chatPrompt(),
    messages,
    model: "claude-haiku-4-5-20251001",
    maxTokens: 1024,
  });
}
