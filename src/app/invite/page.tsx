"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function InvitePage() {
  const router = useRouter();
  const [step, setStep] = useState<"code" | "nickname">("code");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/invite/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        setStep("nickname");
      } else {
        setError("초대 코드가 맞지 않아요");
      }
    } catch {
      setError("잠깐 문제가 생겼어요. 다시 시도해주세요");
    } finally {
      setLoading(false);
    }
  }

  function handleNicknameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요");
      return;
    }

    // 쿠키에 닉네임 저장 (30일)
    document.cookie = `mingdle_nickname=${encodeURIComponent(nickname.trim())};path=/;max-age=${60 * 60 * 24 * 30}`;
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-5xl">🌼</div>
          <h1 className="text-primary text-2xl font-bold">밍들</h1>
          <p className="text-muted-foreground text-sm">작고 둥근 독서 모임</p>
        </CardHeader>
        <CardContent>
          {step === "code" ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="초대 코드를 입력하세요"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-lg"
                  autoFocus
                />
                {error && <p className="text-destructive text-center text-sm">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={!code.trim() || loading}>
                {loading ? "확인 중..." : "입장하기"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleNicknameSubmit} className="space-y-4">
              <div className="space-y-2">
                <p className="text-muted-foreground text-center text-sm">
                  모임에서 사용할 이름을 알려주세요
                </p>
                <Input
                  type="text"
                  placeholder="닉네임"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="text-center text-lg"
                  maxLength={20}
                  autoFocus
                />
                {error && <p className="text-destructive text-center text-sm">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={!nickname.trim()}>
                시작하기
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
