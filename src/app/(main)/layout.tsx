import { BottomNav } from "@/components/features/bottom-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 pt-6 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
