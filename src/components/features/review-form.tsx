"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

function getNicknameFromCookie(): string {
  const match = document.cookie.match(/mingdle_nickname=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "모임원";
}

export function ReviewForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const nickname = getNicknameFromCookie();

      const { error: dbError } = await supabase.from("reviews").insert({
        session_id: sessionId,
        nickname,
        content: content.trim(),
        rating: rating || null,
      });

      if (dbError) throw dbError;
      setContent("");
      setRating(0);
      router.refresh();
    } catch {
      setError("후기 등록에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="py-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="이번 모임은 어땠나요? 생각을 남겨보세요 ✨"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={1000}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground mr-1 text-xs">별점</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? 0 : star)}
                  className={`text-lg transition-transform hover:scale-110 ${
                    star <= rating ? "opacity-100" : "opacity-30"
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <Button type="submit" size="sm" disabled={!content.trim() || loading}>
              {loading ? "등록 중..." : "후기 남기기"}
            </Button>
          </div>

          {error && <p className="text-destructive text-center text-sm">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
