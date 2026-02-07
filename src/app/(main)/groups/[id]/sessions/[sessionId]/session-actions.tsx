"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionActionsProps {
  sessionId: string;
  groupId: string;
  status: string;
  isAdmin: boolean;
  isPresenter: boolean;
}

export function SessionActions({
  sessionId,
  groupId,
  status,
  isAdmin,
  isPresenter,
}: SessionActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const canEdit = isAdmin || isPresenter;
  const canDelete = isAdmin || isPresenter;
  const canChangeStatus = isAdmin && status === "upcoming";

  if (!canEdit && !canChangeStatus) return null;

  async function handleStatusChange() {
    if (!confirm("이 세션을 완료로 변경하시겠어요?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "상태 변경에 실패했습니다");
        return;
      }
      router.refresh();
    } catch {
      alert("상태 변경에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("이 세션을 삭제하시겠어요?\n감상도 함께 삭제됩니다.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "삭제에 실패했습니다");
        return;
      }
      router.push(`/groups/${groupId}`);
      router.refresh();
    } catch {
      alert("삭제에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canChangeStatus && (
        <Button variant="outline" size="sm" onClick={handleStatusChange} disabled={loading}>
          <CheckCircle className="mr-1 h-3.5 w-3.5" />
          완료로 변경
        </Button>
      )}
      {canEdit && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/groups/${groupId}/sessions/${sessionId}/edit`}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            세션 편집
          </Link>
        </Button>
      )}
      {canDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          삭제
        </Button>
      )}
    </div>
  );
}
