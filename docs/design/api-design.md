# 외부 API 연동 설계

> 최종 업데이트: 2026-02-07 (v1.0)

---

## 1. API 연동 개요

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  네이버 도서  │     │   알라딘      │     │   정보나루    │
│  (메인 검색)  │     │  (큐레이션)   │     │   (추천)     │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   API Route    │
                    │  /api/books/*  │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │   books 테이블  │
                    │   (캐시 레이어) │
                    └────────────────┘
```

---

## 2. 네이버 도서 검색 API (메인)

### 기본 정보
- **Endpoint**: `https://openapi.naver.com/v1/search/book.json`
- **일일 한도**: 25,000회
- **인증**: Client ID + Client Secret (Header)

### 요청 예시
```typescript
// lib/api/naver-books.ts
const NAVER_API_URL = 'https://openapi.naver.com/v1/search/book.json';

interface NaverBookSearchParams {
  query: string;
  display?: number;  // 결과 수 (기본 10, 최대 100)
  start?: number;    // 시작 위치
  sort?: 'sim' | 'date';  // 정확도순 | 날짜순
}

interface NaverBookItem {
  title: string;
  link: string;
  image: string;      // 표지 URL
  author: string;
  discount: string;   // 판매가
  publisher: string;
  pubdate: string;
  isbn: string;
  description: string;
}
```

### 응답 처리
```typescript
async function searchNaverBooks(params: NaverBookSearchParams) {
  const res = await fetch(`${NAVER_API_URL}?${new URLSearchParams({
    query: params.query,
    display: String(params.display ?? 10),
    start: String(params.start ?? 1),
    sort: params.sort ?? 'sim',
  })}`, {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
    },
  });

  return res.json();
}
```

---

## 3. 알라딘 API (큐레이션/상세)

### 기본 정보
- **Endpoint**: `http://www.aladin.co.kr/ttb/api/ItemSearch.aspx`
- **일일 한도**: 5,000회
- **인증**: TTB Key (Query Parameter)

### 주요 엔드포인트
| 엔드포인트 | 용도 |
|-----------|------|
| `ItemSearch.aspx` | 도서 검색 |
| `ItemLookUp.aspx` | ISBN으로 상세 조회 |
| `ItemList.aspx` | 베스트셀러, 신간 목록 |

### 요청 예시
```typescript
// lib/api/aladin.ts
const ALADIN_API_URL = 'http://www.aladin.co.kr/ttb/api';

interface AladinSearchParams {
  Query: string;
  QueryType?: 'Keyword' | 'Title' | 'Author' | 'Publisher';
  MaxResults?: number;
  Start?: number;
  SearchTarget?: 'Book' | 'Foreign';
  Sort?: 'Accuracy' | 'PublishTime' | 'Title' | 'SalesPoint';
}
```

---

## 4. 정보나루 API (추천/트렌드) - Phase 3

### 기본 정보
- **Endpoint**: `http://data4library.kr/api`
- **일일 한도**: 무제한
- **인증**: API Key
- **데이터**: 25억건 도서관 대출 데이터

### 주요 엔드포인트
| 엔드포인트 | 용도 |
|-----------|------|
| `loanItemSrch` | 인기 대출 도서 |
| `recommandList` | 추천 도서 |
| `usageAnalysisList` | 도서 이용 분석 |

---

## 5. Claude API (AI 에이전트)

### 기본 정보
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **모델**: Haiku 4.5 (일상), Sonnet 4.5 (심층 분석)
- **인증**: API Key (Header)

### 스트리밍 구현
```typescript
// lib/claude/client.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function* streamChat(messages: Message[], bookContext?: BookContext) {
  const systemPrompt = buildSystemPrompt(bookContext);

  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      yield event.delta.text;
    }
  }
}
```

### 프롬프트 캐싱 전략
```typescript
// 책 정보를 캐시 가능한 시스템 프롬프트에 포함
const systemPrompt = [
  {
    type: 'text',
    text: AGENT_PERSONA,  // 밍들이 페르소나 (캐시)
    cache_control: { type: 'ephemeral' },
  },
  {
    type: 'text',
    text: `현재 책: ${book.title} by ${book.author}\n${book.description}`,
    cache_control: { type: 'ephemeral' },
  },
];
```

---

## 6. Cloudflare R2 (이미지 업로드) - Phase 2

### 기본 정보
- **무료 한도**: 10GB Storage, Egress 무료
- **호환**: S3 API
- **인증**: Access Key + Secret Key

### 업로드 구현
```typescript
// lib/r2/client.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadImage(file: Buffer, key: string) {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: 'image/webp',
  }));

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
```

---

## 7. API 캐싱 전략

### 도서 검색 캐싱
```
검색 요청 → books 테이블 ISBN 조회
  → 캐시 히트: DB에서 반환 (API 호출 0)
  → 캐시 미스: 네이버 API 호출 → books 테이블 저장 → 반환
  → 캐시 만료: 30일 후 API 재호출하여 갱신
```

### AI 응답 캐싱
```
AI 요청 → prompt_hash 생성 → ai_contents 테이블 조회
  → 캐시 히트: DB에서 반환 (LLM 호출 0)
  → 캐시 미스: Claude API 호출 → ai_contents 저장 → 반환
```

### Rate Limit 관리
| API | 한도 | 대응 |
|-----|------|------|
| 네이버 | 25,000/일 | DB 캐싱으로 실제 호출 최소화 |
| 알라딘 | 5,000/일 | 큐레이션 전용, 배치 호출 |
| Claude | 사용량 기반 | 캐싱 + 모델 라우팅 |

---

## 8. 환경 변수 목록

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Claude API
ANTHROPIC_API_KEY=

# 네이버 도서 API
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# 알라딘 API
ALADIN_TTB_KEY=

# Cloudflare R2 (Phase 2)
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# 정보나루 (Phase 3)
LIBDATA_API_KEY=
```
