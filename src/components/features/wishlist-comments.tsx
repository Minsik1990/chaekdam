"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Comment {
  id: string;
  author: string;
  content: string;
  created_at: string | null;
}

interface WishlistCommentsProps {
  clubId: string;
  wishlistBookId: string;
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function WishlistComments({ clubId, wishlistBookId }: WishlistCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/club/${clubId}/wishlist/${wishlistBookId}/comments`);
      const data = await res.json();
      if (data.comments) setComments(data.comments);
    } catch {
      // 무시
    }
  }, [clubId, wishlistBookId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // localStorage에서 마지막 사용한 이름 복원
  useEffect(() => {
    const saved = localStorage.getItem("dokdok_comment_author");
    if (saved) setAuthor(saved);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!author.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/club/${clubId}/wishlist/${wishlistBookId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: author.trim(), content: content.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setComments((prev) => [...prev, data.comment]);
        setContent("");
        localStorage.setItem("dokdok_comment_author", author.trim());
      } else {
        setError(data.error || "전송에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageCircle className="text-primary h-4 w-4" />
        댓글 {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* 댓글 목록 */}
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="bg-input rounded-[14px] p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{c.author}</span>
                <span className="text-muted-foreground text-xs">{timeAgo(c.created_at)}</span>
              </div>
              <p className="text-foreground/80 mt-1 text-sm whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-4 text-center text-sm">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
        </p>
      )}

      {/* 댓글 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="이름"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="bg-input h-10 border-0"
          maxLength={20}
        />
        <div className="flex gap-2">
          <Textarea
            placeholder="댓글을 남겨보세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-input min-h-[60px] flex-1 resize-none border-0"
            maxLength={1000}
          />
          <Button
            type="submit"
            size="icon"
            className="h-[60px] w-12 shrink-0 rounded-[14px]"
            disabled={sending || !author.trim() || !content.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-destructive text-center text-sm">{error}</p>}
      </form>
    </div>
  );
}
