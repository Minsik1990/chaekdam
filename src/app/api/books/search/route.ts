import { NextRequest, NextResponse } from "next/server";

interface NaverBookItem {
  title: string;
  link: string;
  image: string;
  author: string;
  publisher: string;
  isbn: string;
  description: string;
  pubdate: string;
}

interface NaverBookResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverBookItem[];
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "검색어가 필요합니다" }, { status: 400 });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "네이버 API 설정이 필요합니다" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(query)}&display=10`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "도서 검색에 실패했습니다" }, { status: res.status });
    }

    const data: NaverBookResponse = await res.json();

    // HTML 태그 제거 + 필요한 필드만 반환
    const books = data.items.map((item) => ({
      title: item.title.replace(/<[^>]*>/g, ""),
      author: item.author.replace(/<[^>]*>/g, ""),
      publisher: item.publisher,
      isbn: item.isbn.split(" ").pop() || item.isbn, // ISBN13 우선
      coverUrl: item.image,
      description: item.description.replace(/<[^>]*>/g, ""),
      pubdate: item.pubdate,
    }));

    return NextResponse.json({ books, total: data.total });
  } catch {
    return NextResponse.json({ error: "도서 검색 중 오류가 발생했습니다" }, { status: 500 });
  }
}
