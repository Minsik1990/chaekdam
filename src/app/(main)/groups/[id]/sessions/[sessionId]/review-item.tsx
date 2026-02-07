"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/features/star-rating";
import type { SessionReviewWithProfile } from "@/lib/supabase/types";

interface ReviewItemProps {
  review: SessionReviewWithProfile;
  isOwner: boolean;
}

export function ReviewItem({ review, isOwner }: ReviewItemProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(review.content);
  const [rating, setRating] = useState(review.rating ?? 0);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!content.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), rating: rating || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "수정에 실패했습니다");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      alert("수정에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("이 감상을 삭제하시겠어요?")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "삭제에 실패했습니다");
        return;
      }
      router.refresh();
    } catch {
      alert("삭제에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{review.profiles?.nickname ?? "익명"}</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {new Date(review.created_at).toLocaleDateString("ko-KR")}
            </span>
            {isOwner && !editing && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-7 w-7"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {editing ? (
          <div className="mt-2 space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <StarRating value={rating} onChange={setRating} size="sm" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setContent(review.content);
                    setRating(review.rating ?? 0);
                    setEditing(false);
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  취소
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!content.trim() || loading}>
                  <Save className="mr-1 h-3.5 w-3.5" />
                  {loading ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap">{review.content}</p>
        )}
      </CardContent>
    </Card>
  );
}
