# 모니터링 가이드

> 독독 서비스 운영 모니터링 (Vercel, Supabase, AI 비용)

---

## 1. Vercel 모니터링

### 1.1 Dashboard

- **배포 상태**: Vercel Dashboard → Deployments
- **대역폭**: Settings → Usage → Bandwidth (100GB/월 한도)
- **Serverless 호출**: Settings → Usage → Functions
- **Analytics**: Analytics 탭 (Core Web Vitals, 페이지 뷰)

### 1.2 알림 설정

- Vercel Dashboard → Settings → Notifications
- **배포 실패 알림**: 이메일 활성화

### 1.3 확인 주기

- 배포 상태: 매 push 후 확인
- 대역폭: 주 1회 확인
- Analytics: 주 1회 확인

---

## 2. Supabase 모니터링

### 2.1 Dashboard

- **DB 사용량**: Settings → Database → Disk Usage
- **API 요청**: Dashboard → API → Request Volume
- **활성 연결**: Database → Performance

### 2.2 Keep-Alive Cron

```yaml
# .github/workflows/keep-alive.yml
# 3일마다 실행하여 7일 비활성 일시정지 방지
```

- **확인**: GitHub → Actions → keep-alive 워크플로우
- **실패 시**: 수동으로 Supabase Dashboard → Resume 클릭

### 2.3 DB 사용량 쿼리

```sql
-- 테이블별 용량 확인
SELECT
  schemaname || '.' || relname AS table,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### 2.4 확인 주기

- Keep-Alive 로그: cron 실행 시
- DB 사용량: 주 1회 확인
- 일시정지 여부: 접속 불가 시 즉시

---

## 3. AI 비용 모니터링

### 3.1 Anthropic Console

- 접속: https://console.anthropic.com/
- **Usage**: 월별 토큰 사용량 확인
- **Billing**: 비용 현황

### 3.2 캐싱 효율 확인

```sql
-- ai_contents 캐시 적중률 (Supabase에서 실행)
SELECT
  content_type,
  COUNT(*) as cached_count,
  MIN(created_at) as first_cached,
  MAX(created_at) as last_cached
FROM ai_contents
GROUP BY content_type;
```

### 3.3 비용 추정

| 모델       | 입력 단가    | 출력 단가     | 예상 월 비용 (10명) |
| ---------- | ------------ | ------------- | ------------------- |
| Sonnet 4.5 | $3/1M tokens | $15/1M tokens | ~$3                 |
| Haiku 4.5  | $1/1M tokens | $5/1M tokens  | ~$2                 |
| **합계**   |              |               | **~$5/월**          |

### 3.4 확인 주기

- 비용: 월 1회 확인
- 캐시 효율: 월 1회 쿼리

---

## 4. 모니터링 체크리스트

### 주간 체크 (매주 월요일)

- [ ] Vercel 대역폭 확인 (< 80GB)
- [ ] Supabase DB 사용량 확인 (< 450MB)
- [ ] GitHub Actions cron 로그 확인

### 월간 체크 (매월 1일)

- [ ] Anthropic Console AI 비용 확인 (< $40)
- [ ] Vercel Analytics 리뷰 (Core Web Vitals)
- [ ] 전체 서비스 상태 점검

### 이벤트 기반

- 배포 실패 → 즉시 Vercel 로그 확인
- 서비스 접속 불가 → Supabase 일시정지 확인
- AI 기능 오류 → Anthropic 상태 페이지 확인
