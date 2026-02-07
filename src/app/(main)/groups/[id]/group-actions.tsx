"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GroupActionsProps {
  groupId: string;
  groupName: string;
}

export function GroupActions({ groupId, groupName }: GroupActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${groupName}" 모임을 삭제하시겠어요?\n모든 세션과 감상도 함께 삭제됩니다.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "삭제에 실패했습니다");
        return;
      }
      router.push("/groups");
      router.refresh();
    } catch {
      alert("삭제에 실패했습니다");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={deleting}>
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/groups/${groupId}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            모임 편집
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          모임 삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
