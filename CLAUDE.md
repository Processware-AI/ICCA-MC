# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

인천상공회의소 CEO아카데미 총동문회 산악동호회 2026년 랜딩 페이지. 순수 HTML/CSS/JS + Firebase(Auth/Firestore)로 구성된 정적 사이트로, 별도 빌드 도구나 프레임워크 없이 동작한다.

## Architecture

### 프론트엔드 (GitHub Pages 배포)
- `index.html` — 메인 랜딩 페이지 (8개 섹션: 인사말, 총동문회 인사말, 집행부, 정기산행, 산행결과, 행사안내, 행사결과, 캘린더)
- `pages/` — 상세 페이지 및 인증 페이지
  - 콘텐츠: greeting, leaders, executives, hiking-schedule, hiking-results, events, event-results
  - 인증: login, signup, mypage, admin
- `css/style.css` — 전체 스타일 (밝은 자연 테마, CSS 변수 기반)
- `js/main.js` — Intersection Observer 기반 스크롤 애니메이션, 모바일 네비게이션, 파티클 효과, 캘린더
- `js/firebase-config.js` — Firebase 초기화 (프로젝트: icca-mc)
- `js/auth.js` — 로그인/회원가입/상태 관리 로직
- `js/guard.js` — 회원 전용 페이지 접근 제어
- `js/nav-auth.js` — 전 페이지 공통 네비게이션 인증 상태 표시
- `images/` — 이미지 파일 디렉토리

### 백엔드 (Firebase BaaS)
- **Firebase Auth** — 이메일/비밀번호 인증 (카카오 로그인 추후 추가)
- **Firestore** — 사용자 프로필, 승인 상태 관리
  - `users/{uid}` 컬렉션: email, name, batch, phone, status(pending/approved/rejected), role(member/admin)
- Firebase SDK는 CDN(compat 10.12.0)으로 로드, Firebase 호스팅 미사용

### 인증 흐름
1. 회원가입 → Firestore에 status: "pending"으로 저장
2. 관리자(role: "admin")가 admin.html에서 승인/거절
3. 승인된 회원만 게시판 등 회원 전용 기능 이용 가능
4. 비회원도 홍보 콘텐츠(인사말, 일정 등)는 열람 가능

## Key Patterns

- **이미지 교체**: 모든 이미지는 `<img onerror="this.style.display='none'">` 패턴으로 플레이스홀더 위에 겹쳐져 있음. 실제 이미지 파일을 `images/` 폴더에 넣으면 자동 표시됨.
- **Google Form 연결**: 정기산행 참석 설문은 Google Forms 연동 (`https://forms.gle/...`)
- **색상 시스템**: CSS 변수(`--color-accent`, `--color-accent2`, `--color-warm` 등)로 관리. `style.css`의 `:root`에서 일괄 변경 가능.
- **상세 페이지 해시 라우팅**: 메인에서 상세 페이지로 이동 시 `pages/파일.html#id` 형태로 특정 섹션에 스크롤
- **네비게이션 통일**: 모든 페이지(메인+서브)가 동일한 7개 링크 + 로그인/마이페이지 버튼 + 햄버거 메뉴 구성
- **인증 상태 표시**: `nav-auth.js`가 모든 페이지에서 Firebase Auth 상태를 확인하여 네비 버튼을 "로그인" ↔ "마이페이지"로 전환. CSS `visibility: hidden`으로 깜빡임 방지.
- **Firebase SDK 로딩**: 모든 페이지 하단에 Firebase compat CDN → firebase-config.js → nav-auth.js 순서로 로드

## Development

순수 정적 사이트 — 빌드 과정이나 의존성 설치 없음.

**배포**: GitHub Pages에 `main` 브랜치를 배포. `feature/*` 브랜치는 배포에 영향 없음.

**로컬 테스트**: `npx serve .` 또는 Node.js가 설치된 환경에서 정적 서버로 확인.

**Firebase 설정**: Firebase 콘솔(console.firebase.google.com)에서 Authentication(이메일/비밀번호) 활성화, Firestore Database 생성(asia-northeast3), 보안 규칙 설정 필요.
