---
name: prd
description: 기능별 PRD (Product Requirements Document) 생성
---

## PRD 생성: $ARGUMENTS

다음 단계로 PRD를 작성합니다:

1. 기능명과 요구사항 파악
2. `docs/development/roadmap.md` 확인하여 Phase 위치 파악
3. `docs/design/database-schema.md`, `docs/design/api-design.md` 참조
4. 아래 템플릿으로 `docs/prd/[기능명].md` 작성

### 템플릿

```markdown
# [기능명] PRD

## 1. 개요

- 한 줄 요약
- 우선순위: P0/P1/P2
- Phase: [Phase 번호]

## 2. 사용자 스토리

- As a [역할], I want to [행동] so that [목적]
- 수용 기준 (Acceptance Criteria)

## 3. 기술 스펙

### 3.1 데이터 모델 (테이블/RLS)

### 3.2 API 엔드포인트

### 3.3 UI 컴포넌트

## 4. 구현 계획

- [ ] Step 1~N

## 5. 엣지 케이스

## 6. 테스트 전략
```

5. 작성 후 사용자에게 리뷰 요청
