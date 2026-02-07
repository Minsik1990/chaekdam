# 장애 대응 가이드 (Incident Response Runbook)

> 장애 발생 시 대응 절차. 장애 레벨별 시나리오와 복구 방법.

---

## 1. 장애 레벨 정의

| 레벨              | 정의             | 예시                         | 대응 시간   |
| ----------------- | ---------------- | ---------------------------- | ----------- |
| **P0** (Critical) | 서비스 전체 중단 | DB 장애, Vercel 장애         | 즉시        |
| **P1** (High)     | 핵심 기능 중단   | AI API 장애, 로그인 실패     | 1시간 이내  |
| **P2** (Medium)   | 일부 기능 중단   | 도서 검색 실패, 이미지 안 뜸 | 4시간 이내  |
| **P3** (Low)      | 마이너 버그      | UI 깨짐, 텍스트 오타         | 24시간 이내 |

---

## 2. 장애 시나리오별 대응

### 2.1 Supabase DB 장애 / 일시정지 (P0)

**증상:**

- 로그인 실패 (401/500)
- 기록 조회/작성 실패
- "서버에 연결할 수 없습니다" 에러

**대응 순서:**

1. Supabase Status 페이지 확인: https://status.supabase.com/
2. Supabase Dashboard → Settings → General → Status 확인
3. **"Paused" 상태**:
   - Dashboard → Settings → General → "Resume Project" 클릭
   - 약 2~5분 후 복구
   - GitHub Actions cron 로그 확인 (실패 원인)
4. **Supabase 전역 장애**:
   - Status 페이지 모니터링
   - 복구 대기 (사용자 공지)

**예방:**

- Keep-Alive cron 3일마다 실행 확인
- cron 실패 시 수동으로 DB ping

---

### 2.2 Vercel 배포 실패 (P1)

**증상:**

- GitHub push 후 배포 실패 알림
- 새 기능 미반영 (이전 버전 유지)

**대응 순서:**

1. Vercel Dashboard → Deployments → 실패 항목 클릭
2. Build Logs 확인:
   - **타입 에러**: `pnpm typecheck`로 로컬 재현
   - **린트 에러**: `pnpm lint`로 로컬 재현
   - **빌드 에러**: `pnpm build`로 로컬 재현
3. 에러 수정 → 새 커밋 → 재배포
4. **긴급 시**: Vercel Dashboard → 이전 배포 → "Promote to Production"

---

### 2.3 AI API 장애 (P1)

**증상:**

- AI 인터뷰/요약/분석 기능 실패
- SSE 스트리밍 타임아웃
- "AI 응답을 받을 수 없습니다" 에러

**대응 순서:**

1. Anthropic Status 확인: https://status.anthropic.com/
2. API Key 유효성 확인 (만료/한도 초과)
3. Vercel Functions Logs에서 에러 상세 확인
4. **일시적 장애**: 사용자에게 "잠시 후 다시 시도" 안내
5. **장기 장애**: Sonnet → Haiku 대체 (성능 저하 감수)

---

### 2.4 네이버 도서 API 장애 (P2)

**증상:**

- 도서 검색 결과 없음 / 에러
- 429 Rate Limit 에러

**대응 순서:**

1. 네이버 개발자 센터 상태 확인
2. Rate Limit 확인: 초당 10건, 일 25,000건
3. books 테이블 캐시에서 검색 (캐시 우선 모드)
4. 복구 후 정상 모드 전환

---

### 2.5 인증 장애 (P1)

**증상:**

- Magic Link 이메일 미수신
- 콜백 후 무한 리다이렉트
- 세션 만료 반복

**대응 순서:**

1. Supabase Dashboard → Auth → Users 확인
2. 이메일 발송 로그 확인 (Supabase → Logs)
3. **이메일 미수신**: 스팸함 확인 안내
4. **콜백 에러**: `/auth/callback/route.ts` 로그 확인
5. **세션 에러**: `src/middleware.ts` 쿠키 처리 확인

---

## 3. 장애 보고서 템플릿

```markdown
## 장애 보고서 — YYYY-MM-DD

### 개요

- **레벨**: P0 / P1 / P2 / P3
- **발생 시각**: YYYY-MM-DD HH:MM KST
- **복구 시각**: YYYY-MM-DD HH:MM KST
- **영향 범위**: (예: 모든 사용자, AI 기능만 등)
- **영향 시간**: X시간 Y분

### 원인

(예: Supabase 7일 비활성 일시정지, Keep-Alive cron 실패)

### 대응 과정

1. (예: Supabase Dashboard 접속)
2. (예: "Resume Project" 클릭)
3. (예: 서비스 복구 확인)

### 재발 방지

(예: cron 주기 3일 → 2일로 단축)

### 영향받은 사용자

(예: 전체 10명, 약 3시간 접속 불가)
```

---

## 4. 긴급 연락처

| 서비스        | 상태 페이지                   | 문서                       |
| ------------- | ----------------------------- | -------------------------- |
| Supabase      | https://status.supabase.com/  | https://supabase.com/docs  |
| Vercel        | https://vercel-status.com/    | https://vercel.com/docs    |
| Anthropic     | https://status.anthropic.com/ | https://docs.anthropic.com |
| 네이버 개발자 | https://developers.naver.com/ | API 문서                   |
