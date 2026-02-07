"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AgentMessage } from "@/lib/agent/types";

export default function ChatPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMessage: AgentMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                assistantText += data.text;
                setMessages([...newMessages, { role: "assistant", content: assistantText }]);
              } catch {
                // JSON 파싱 실패 무시
              }
            }
          }
        }
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "잠깐 문제가 생겼어요. 다시 말씀해주세요." },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="text-[22px] font-bold">AI 독서 대화</h1>
      <p className="text-muted-foreground mt-1 text-[13px]">
        책 추천, 독서 고민, 읽은 책 이야기를 자유롭게 나눠보세요
      </p>

      {/* 메시지 영역 */}
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-[20px] border p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="bg-secondary flex h-14 w-14 items-center justify-center rounded-full">
              <Bot className="text-primary h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-medium">안녕하세요!</p>
              <p className="text-muted-foreground mt-1 text-[13px]">
                어떤 책에 대해 이야기하고 싶으세요?
              </p>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {["책 추천해줘", "요즘 읽고 있는 책이 있는데", "독서 모임 준비 도와줘"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="bg-secondary hover:bg-muted rounded-full px-3 py-1.5 text-[13px] transition-colors"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-[15px] whitespace-pre-wrap md:max-w-[70%] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.content || (streaming ? "..." : "")}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="mt-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          rows={1}
          className="min-h-[44px] resize-none"
          disabled={streaming}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || streaming}
          className="h-11 w-11 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
