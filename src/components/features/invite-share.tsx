"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InviteShareProps {
  inviteCode: string;
  groupName: string;
}

export function InviteShare({ inviteCode, groupName }: InviteShareProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined" ? `${window.location.origin}/groups/new?code=${inviteCode}` : "";

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // clipboard API 미지원 환경
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // clipboard API 미지원 환경
    }
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${groupName} 독서 모임 초대`,
          text: `"${groupName}" 독서 모임에 초대합니다! 초대 코드: ${inviteCode}`,
          url: inviteUrl,
        });
      } else {
        await copyLink();
      }
    } catch {
      // 사용자가 공유 취소 시 AbortError 무시
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-1 h-3.5 w-3.5" />
          초대하기
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>모임 초대</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 초대 코드 */}
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">초대 코드</p>
            <div className="bg-muted flex items-center justify-between rounded-[14px] px-4 py-3">
              <span className="text-lg font-bold tracking-wider">{inviteCode}</span>
              <Button variant="ghost" size="sm" onClick={copyCode}>
                {codeCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 초대 링크 */}
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">초대 링크</p>
            <div className="bg-muted flex items-center gap-2 rounded-[14px] px-4 py-3">
              <span className="min-w-0 flex-1 truncate text-sm">{inviteUrl}</span>
              <Button variant="ghost" size="sm" onClick={copyLink}>
                {linkCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 공유 버튼 */}
          <Button onClick={handleShare} className="w-full">
            <Share2 className="mr-2 h-4 w-4" />
            공유하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
