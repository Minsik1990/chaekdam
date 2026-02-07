"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface PresentationEditorProps {
  sessionId: string;
  initialText: string;
}

export function PresentationEditor({ sessionId, initialText }: PresentationEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/presentation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentation_text: text }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "저장에 실패했습니다");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      alert("저장에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-muted-foreground text-[13px] font-semibold">발제문</h2>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 h-3 w-3" />
              {initialText ? "편집" : "작성"}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="발제문을 작성하세요..."
              maxLength={5000}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setText(initialText);
                  setEditing(false);
                }}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                취소
              </Button>
              <Button size="sm" onClick={handleSave} disabled={loading}>
                <Save className="mr-1 h-3.5 w-3.5" />
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        ) : initialText ? (
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{initialText}</div>
        ) : (
          <p className="text-muted-foreground text-sm">아직 발제문이 없어요. 작성해보세요!</p>
        )}
      </CardContent>
    </Card>
  );
}
