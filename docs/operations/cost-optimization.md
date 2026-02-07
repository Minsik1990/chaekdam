# 비용 최적화 가이드

> 무료 플랜 유지 전략 및 비용 최적화 방안
> 상세 비용 분석: `docs/research/cost-analysis.md`

---

## 1. 현재 비용 구조

| 서비스          | 플랜          | 월 비용    | 한도                        |
| --------------- | ------------- | ---------- | --------------------------- |
| Supabase        | Free          | $0         | DB 500MB, Storage 1GB       |
| Vercel          | Hobby         | $0         | 100GB 대역폭, 10초 타임아웃 |
| GitHub Actions  | Free (Public) | $0         | 무제한 (public repo)        |
| Claude API      | Pay-as-you-go | ~$5/월     | 사용량 비례                 |
| 네이버 도서 API | Free          | $0         | 25,000건/일                 |
| **합계**        |               | **~$5/월** |                             |

---

## 2. Supabase 최적화

### 2.1 DB 용량 절감

**현재 전략:**

- 이미지 바이너리 저장 금지 (URL만 저장)
- 책 표지: 네이버/알라딘 외부 URL 직접 사용
- 프로필 아바타: Supabase Storage (Phase 2)

**향후 정리 대상:**

```sql
-- 3개월 이상 된 AI 대화 로그 정리
DELETE FROM agent_conversations
WHERE created_at < NOW() - INTERVAL '3 months'
  AND user_id IS NOT NULL;

-- 미사용 books 정리 (기록에 연결되지 않은 책)
DELETE FROM books
WHERE id NOT IN (SELECT DISTINCT book_id FROM records)
  AND id NOT IN (SELECT DISTINCT book_id FROM sessions WHERE book_id IS NOT NULL);
```

### 2.2 비활성 일시정지 방지

```yaml
# .github/workflows/keep-alive.yml
# 3일마다 Supabase에 ping → 7일 비활성 방지
# 비용: $0 (public repo GitHub Actions 무료)
```

---

## 3. Vercel 최적화

### 3.1 대역폭 절감

- `next/image` 사용: 자동 이미지 최적화 + WebP 변환
- 외부 이미지 (책 표지): `remotePatterns` 설정으로 직접 로드
- 정적 에셋: Vercel Edge CDN 자동 캐싱

### 3.2 Serverless 호출 절감

- SSR 최소화: 가능하면 Static Generation 사용
- API Routes 캐싱: `Cache-Control` 헤더 활용
- 도서 검색 결과: books 테이블 캐싱으로 외부 API 호출 최소화

---

## 4. AI 비용 최적화 (핵심)

### 4.1 Prompt Caching (90% 절감)

```typescript
// src/lib/agent/stream.ts
// cache_control: { type: "ephemeral" } 적용
// 동일 시스템 프롬프트 재사용 시 90% 할인
```

- 적용 대상: 모든 AI API Routes
- 효과: 입력 토큰 비용 90% 절감

### 4.2 AI 응답 DB 캐싱

```typescript
// src/lib/agent/cache.ts
// getCachedContent(bookId, contentType) → ai_contents 테이블
// setCachedContent(bookId, contentType, content, model)
```

- 적용 대상: 도서 분석 (analysis)
- 효과: 동일 책 재요청 시 API 호출 0 (DB 조회만)
- TTL: 무제한 (책 분석 결과는 변하지 않음)

### 4.3 모델 라우팅

| 작업           | 모델               | 이유                   |
| -------------- | ------------------ | ---------------------- |
| 대화형 인터뷰  | Haiku 4.5 ($1/1M)  | 빠른 응답, 간단한 질문 |
| 요약/분석/주제 | Sonnet 4.5 ($3/1M) | 높은 품질 필요         |

### 4.4 비용 예측

| MAU   | AI 요청/월 | Prompt Caching | 캐싱 적중 | 예상 비용/월 |
| ----- | ---------- | -------------- | --------- | ------------ |
| 10명  | 200건      | 90% 할인       | 30%       | ~$5          |
| 50명  | 1,000건    | 90% 할인       | 40%       | ~$15         |
| 500명 | 10,000건   | 90% 할인       | 50%       | ~$80         |

---

## 5. 확장 시 비용 계획

### MAU 500명 도달 시

| 서비스     | 현재  | 업그레이드 | 월 비용   |
| ---------- | ----- | ---------- | --------- |
| Supabase   | Free  | Pro        | $25       |
| Vercel     | Hobby | Pro        | $20       |
| Claude API | -     | -          | ~$80      |
| **합계**   | $5    |            | **~$125** |

### 수익으로 커버

- Pro 플랜 $2,900/월 × 25명 (5% 전환) = $72,500
- 실제 MRR 목표: $75/월 → 비용 커버 충분

---

## 6. 비용 모니터링 일정

| 체크 항목        | 주기         | 임계값  | 액션               |
| ---------------- | ------------ | ------- | ------------------ |
| Supabase DB 용량 | 주간         | > 450MB | 데이터 정리        |
| Vercel 대역폭    | 주간         | > 80GB  | 이미지 최적화      |
| AI 비용          | 월간         | > $40   | Freemium 도입 검토 |
| Keep-Alive 상태  | cron 실행 시 | 실패    | 수동 ping          |
