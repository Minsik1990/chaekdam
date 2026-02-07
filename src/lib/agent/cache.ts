import { createClient } from "@/lib/supabase/server";

// AI 응답 캐시 조회
export async function getCachedContent(
  bookId: string,
  contentType: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_contents")
    .select("content")
    .eq("book_id", bookId)
    .eq("content_type", contentType)
    .maybeSingle();

  if (data?.content) {
    // { text: "..." } 형태로 저장된 경우 text 필드 추출
    if (typeof data.content === "object" && data.content !== null && "text" in data.content) {
      return (data.content as { text: string }).text;
    }
    return typeof data.content === "string" ? data.content : JSON.stringify(data.content);
  }
  return null;
}

// AI 응답 캐시 저장
export async function setCachedContent(
  bookId: string,
  contentType: string,
  content: string,
  modelUsed: string = "claude-sonnet-4-5"
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("ai_contents").insert({
    book_id: bookId,
    content_type: contentType,
    content: { text: content },
    model_used: modelUsed,
  });
}
