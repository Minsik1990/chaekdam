import Link from "next/link";
import { cookies } from "next/headers";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const nickname = cookieStore.get("mingdle_nickname")?.value
    ? decodeURIComponent(cookieStore.get("mingdle_nickname")!.value)
    : "모임원";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🌼</span>
            <span className="text-primary text-lg font-bold">밍들</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">{nickname}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-6">{children}</main>
      <footer className="text-muted-foreground border-t py-4 text-center text-xs">
        밍들 — 작고 둥근 독서 모임 🌼
      </footer>
    </div>
  );
}
