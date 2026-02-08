import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";
import { WishlistAddButton } from "@/components/features/wishlist-add-button";

interface WishlistWithBook {
  id: string;
  created_at: string | null;
  books: {
    id: string;
    title: string;
    author: string | null;
    cover_image_url: string | null;
  } | null;
}

export default async function WishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const supabase = createClient();

  const { data } = await supabase
    .from("wishlist_books")
    .select("id, created_at, books(id, title, author, cover_image_url)")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  const wishlistBooks = (data ?? []) as unknown as WishlistWithBook[];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {wishlistBooks.length > 0 && `${wishlistBooks.length}권`}
        </h2>
        <WishlistAddButton clubId={clubId} />
      </div>

      {wishlistBooks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="아직 읽고 싶은 책이 없어요"
          description="함께 읽고 싶은 책을 추가해보세요"
        />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {wishlistBooks.map((item) => (
            <Link key={item.id} href={`/club/${clubId}/wishlist/${item.id}`} className="group">
              <div className="bg-muted relative aspect-[3/4] overflow-hidden rounded-[14px]">
                {item.books?.cover_image_url ? (
                  <Image
                    src={item.books.cover_image_url}
                    alt={item.books.title}
                    fill
                    sizes="(max-width: 480px) 33vw, 150px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center">
                    <span className="text-muted-foreground text-xs">
                      {item.books?.title ?? "책 정보 없음"}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-1.5 px-0.5">
                <p className="truncate text-xs font-medium">
                  {item.books?.title ?? "책 정보 없음"}
                </p>
                {item.books?.author && (
                  <p className="text-muted-foreground truncate text-[11px]">{item.books.author}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
