# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

인천상공회의소 CEO아카데미 총동문회 산악동호회 2026년 랜딩 페이지. 순수 HTML/CSS/JS 정적 페이지 + 로컬 Node.js(Express) API 서버 + SQLite로 구성된다. 프런트엔드는 번들러/프레임워크 없이 동작하며, 서버 의존성은 `express` 하나뿐이다(SQLite는 Node 내장 `node:sqlite` 사용).

## Architecture

### 프론트엔드 (정적 페이지)
- `index.html` — 메인 랜딩 페이지 (8개 섹션: 인사말, 총동문회 인사말, 집행부, 정기산행, 산행결과, 행사안내, 행사결과, 캘린더)
- `pages/` — 상세 페이지 및 인증 페이지
  - 콘텐츠: greeting, leaders, executives, hiking-schedule, hiking-results, events, event-results
  - 인증: login, signup, mypage, admin
- `css/style.css` — 전체 스타일 (밝은 자연 테마, CSS 변수 기반)
- `js/main.js` — Intersection Observer 기반 스크롤 애니메이션, 모바일 네비게이션, 파티클 효과, 캘린더
- `js/api.js` — 로컬 API(`/api/*`) 클라이언트. 모든 페이지에서 가장 먼저 로드된다.
- `js/auth.js` — 로그인/회원가입/세션 상태 관리 (`Auth` 전역 객체)
- `js/guard.js` — 회원 전용 페이지 접근 제어
- `js/nav-auth.js` — 전 페이지 공통 네비게이션 인증 상태 표시
- `images/` — 이미지 파일 디렉토리

### 백엔드 (로컬 Express + SQLite)
- `server/index.js` — Express 앱. `/api/*` 라우트와 정적 사이트를 같은 포트에서 서빙
- `server/db.js` — `node:sqlite`(Node 22.5+ 내장) 기반 스키마/쿼리. DB 파일은 `data/icca.db`
- `server/auth.js` — scrypt 비밀번호 해시, HMAC 서명 세션 쿠키(`icca_session`), 권한 미들웨어
- `server/routes.js` — REST API
- `server/seed-admin.js` — 초기 관리자 계정 생성 스크립트
- `users` 테이블: id, email, password_hash, name, batch, phone, photo_url, status(pending/approved/rejected), role(member/admin), provider, created_at, updated_at

### 인증 흐름
1. 회원가입 → `users` 테이블에 status: "pending"으로 저장 (로그인 상태는 되지 않음)
2. 관리자(role: "admin")가 admin.html에서 승인/거절
3. 승인된 회원만 로그인 가능 — 서버가 승인 회원에게만 세션 쿠키를 발급
4. 비회원도 홍보 콘텐츠(인사말, 일정 등)는 열람 가능

API 목록과 에러 코드는 `README.md` 참고.

## Key Patterns

- **이미지 교체**: 모든 이미지는 `<img onerror="this.style.display='none'">` 패턴으로 플레이스홀더 위에 겹쳐져 있음. 실제 이미지 파일을 `images/` 폴더에 넣으면 자동 표시됨.
- **Google Form 연결**: 정기산행 참석 설문은 Google Forms 연동 (`https://forms.gle/...`)
- **색상 시스템**: CSS 변수(`--color-accent`, `--color-accent2`, `--color-warm` 등)로 관리. `style.css`의 `:root`에서 일괄 변경 가능.
- **상세 페이지 해시 라우팅**: 메인에서 상세 페이지로 이동 시 `pages/파일.html#id` 형태로 특정 섹션에 스크롤
- **네비게이션 통일**: 모든 페이지(메인+서브)가 동일한 7개 링크 + 로그인/마이페이지 버튼 + 햄버거 메뉴 구성
- **인증 상태 표시**: `nav-auth.js`가 `Auth.onStateChange`로 세션 상태를 받아 네비 버튼을 "로그인" ↔ "마이페이지"로 전환. CSS `visibility: hidden`으로 깜빡임 방지.
- **스크립트 로딩 순서**: 모든 페이지 하단에서 `js/api.js` → `js/auth.js` → `js/nav-auth.js` 순서로 로드. 페이지별 인라인 스크립트는 그 뒤에 오며 `Auth.ready` Promise로 세션 확인을 기다린다.
- **API 에러 처리**: `Api`가 던지는 에러는 `err.code`/`err.message`를 가진다. 페이지에서는 `err.code`로 분기하고, 서버가 준 안내 문구(`not-approved` 등)는 그대로 노출한다.

## Development

```bash
npm install                                    # express 설치
npm start                                      # http://localhost:3000 (API + 정적 사이트)
npm run dev                                    # 파일 변경 시 자동 재시작
npm run seed:admin -- <email> <password> [이름] # 관리자 계정 생성/승격
```

Node.js 22.5 이상 필요(`node:sqlite`). `data/icca.db`와 `data/session-secret`은 자동 생성되며 git에서 제외된다.

**배포**: `.github/workflows`의 GitHub Pages 배포는 **정적 콘텐츠만** 반영된다. 로그인/승인 기능은 Node 서버가 실행되는 환경에서만 동작한다.
