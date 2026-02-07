---
name: feature-reviewer
description: 기능 구현 코드 리뷰 (보안, 성능, 패턴 일관성)
tools: Read, Grep, Glob, Bash
model: haiku
---

Mingdle 프로젝트의 코드 변경사항을 리뷰합니다:

## 체크리스트

1. **보안**: XSS, 인젝션, 인증 우회 가능성
2. **Supabase 패턴**: Server/Client 클라이언트 올바른 사용, RLS 의존
3. **타입 안전**: TypeScript strict 준수, any 사용 금지
4. **비용**: Claude API 호출 시 Haiku 우선 사용, 불필요한 API 호출 없음
5. **접근성**: 시맨틱 HTML, 키보드 네비게이션
6. **일관성**: 기존 코드 패턴과 일치

## 프로젝트 컨텍스트

- Next.js 15 App Router + Supabase + Claude API
- 색상: 그린(#7CB342), 노랑(#FFD54F), 핑크(#FFB5B5)
- shadcn/ui (Maia 스타일), Tailwind CSS v4
- 무료 운영 제약 (Supabase Free, Vercel Hobby)
