"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MemberActionsProps {
  groupId: string;
  targetUserId: string;
  targetRole: string;
  isSelf: boolean;
  isAdmin: boolean;
}

export function MemberActions({
  groupId,
  targetUserId,
  targetRole,
  isSelf,
  isAdmin,
}: MemberActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // admin은 탈퇴 불가, admin이 아닌 사람만 제거 가능
  const canRemove = isAdmin && !isSelf && targetRole !== "admin";
  const canLeave = isSelf && targetRole !== "admin";

  if (!canRemove && !canLeave) return null;

  async function handleAction() {
    const action = isSelf ? "탈퇴" : "제거";
    if (!confirm(`정말 ${action}하시겠어요?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${targetUserId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || `${action}에 실패했습니다`);
        return;
      }

      if (isSelf) {
        router.push("/groups");
      }
      router.refresh();
    } catch {
      alert("오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleAction}
      disabled={loading}
      className="text-destructive hover:text-destructive"
    >
      {isSelf ? (
        <LogOut className="mr-1 h-3.5 w-3.5" />
      ) : (
        <UserMinus className="mr-1 h-3.5 w-3.5" />
      )}
      {loading ? "처리 중..." : isSelf ? "탈퇴" : "제거"}
    </Button>
  );
}
