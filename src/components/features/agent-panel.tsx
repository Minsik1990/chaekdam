"use client";

import { useState } from "react";
import { Lightbulb, FileEdit, Brain, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BookContext } from "@/lib/agent/types";

interface AgentPanelProps {
  bookContext: BookContext;
  bookId?: string;
}

export function AgentPanel({ bookContext, bookId }: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState("topics");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [userNotes, setUserNotes] = useState("");
  const [isCached, setIsCached] = useState(false);

  async function fetchData(url: string, body: Record<string, unknown>) {
    setContent("");
    setLoading(true);
    setIsCached(false);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get("content-type") ?? "";

      // JSON 응답 (캐시된 결과 또는 비스트리밍)
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const text = data.topics || data.draft || data.analysis || "";
        setContent(text);
        if (data.cached) setIsCached(true);
        return;
      }

      // SSE 스트리밍 응답
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  text = data.error;
                } else if (data.text) {
                  text += data.text;
                }
                setContent(text);
              } catch {
                // ignore
              }
            }
          }
        }
      }
    } catch {
      setContent("AI 기능을 잠시 사용할 수 없어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function handleTopics() {
    fetchData("/api/agent/topics", { bookContext, bookId });
  }

  function handleDraft() {
    fetchData("/api/agent/draft", {
      bookContext,
      bookId,
      userNotes: userNotes.trim() || undefined,
    });
  }

  function handleAnalysis() {
    fetchData("/api/agent/analysis", { bookContext, bookId });
  }

  return (
    <Card>
      <CardContent className="py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="topics" className="text-xs">
              <Lightbulb className="mr-1 h-3 w-3" />
              주제
            </TabsTrigger>
            <TabsTrigger value="draft" className="text-xs">
              <FileEdit className="mr-1 h-3 w-3" />
              발제문
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">
              <Brain className="mr-1 h-3 w-3" />
              분석
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topics" className="mt-3 space-y-3">
            <p className="text-muted-foreground text-xs">
              이 책으로 어떤 이야기를 나눌 수 있을지 추천해드려요.
            </p>
            <Button size="sm" onClick={handleTopics} disabled={loading} className="w-full">
              {loading ? "생성 중..." : "토론 주제 추천받기"}
            </Button>
          </TabsContent>

          <TabsContent value="draft" className="mt-3 space-y-3">
            <Textarea
              placeholder="메모가 있으면 적어주세요 (선택)"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Button size="sm" onClick={handleDraft} disabled={loading} className="w-full">
              {loading ? "생성 중..." : "발제문 초안 생성"}
            </Button>
          </TabsContent>

          <TabsContent value="analysis" className="mt-3 space-y-3">
            <p className="text-muted-foreground text-xs">이 책에 대한 AI의 분석을 들어보세요.</p>
            <Button size="sm" onClick={handleAnalysis} disabled={loading} className="w-full">
              {loading ? "분석 중..." : "책 분석 보기"}
            </Button>
          </TabsContent>
        </Tabs>

        {/* 결과 표시 */}
        {content && (
          <div className="mt-4 space-y-2">
            {isCached && (
              <Badge variant="secondary" className="text-[11px]">
                <Check className="mr-1 h-3 w-3" />
                캐시됨
              </Badge>
            )}
            <div className="bg-secondary/50 rounded-[14px] p-3">
              <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">{content}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
