# PRD — 인천상공회의소 CEO아카데미 총동문회 산악동호회 2026

## 1. 프로젝트 개요

인천상공회의소 CEO아카데미 총동문회 산악동호회의 2026년 운영을 위한 웹 서비스.
메인 랜딩 페이지(회원/비회원 공용)와 관리자 앱(별도)으로 구성한다.

- **프론트엔드**: HTML/CSS/JS 정적 페이지 (프레임워크 없음)
- **백엔드**: 로컬 Node.js(Express) REST API + SQLite (`node:sqlite` 내장 모듈)
- **호스팅**: Node 서버가 API와 정적 사이트를 함께 서빙 (`npm start`). GitHub Pages 배포는 정적 콘텐츠 전용이며 회원 기능은 동작하지 않는다.

---

## 2. 사용자 유형 및 권한

| 유형 | 설명 | 권한 |
|------|------|------|
| **비회원** | 로그인하지 않은 방문자 | 홍보 콘텐츠 열람만 가능 |
| **승인 대기 회원** | 가입했으나 관리자 승인 전 | 홍보 콘텐츠 열람, 마이페이지(상태 확인) |
| **승인 회원** | 관리자가 승인한 정회원 | 전체 기능 이용 (게시판, 행사 신청, 회비 납부) |
| **관리자 (admin)** | role: "admin"인 회원 | 회원 승인/거절, 회원 관리, 콘텐츠 관리 |

---

## 3. 데이터베이스 구조 (SQLite — data/icca.db)

### 3.1 users 테이블 (구현 완료)
```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,                    -- scrypt$<salt>$<hash>
  name          TEXT NOT NULL,
  batch         TEXT NOT NULL DEFAULT '',         -- 기수 (예: "25기")
  phone         TEXT NOT NULL DEFAULT '',
  photo_url     TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  role          TEXT NOT NULL DEFAULT 'member',   -- member | admin
  provider      TEXT NOT NULL DEFAULT 'email',    -- email | kakao
  created_at    TEXT NOT NULL,                    -- ISO 8601
  updated_at    TEXT NOT NULL
);
```

아래 3.2~3.4는 아직 구현되지 않은 예정 스키마다 (현재 해당 콘텐츠는 HTML에 하드코딩되어 있다).

### 3.2 greetings 테이블 (인사말 — 구현 예정)
```sql
CREATE TABLE greetings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  section    TEXT NOT NULL,   -- president | vice-president | auditor | alumni | trekking | secretary-general
  role       TEXT NOT NULL,   -- 직책명 (예: "2026 산악동호회 회장")
  name       TEXT NOT NULL,
  message    TEXT NOT NULL DEFAULT '',
  photo_url  TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
```

### 3.3 executives 테이블 (집행부 — 구현 예정)
```sql
CREATE TABLE executives (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  role       TEXT NOT NULL,   -- 직책명 (예: "산악총대장")
  name       TEXT NOT NULL,
  message    TEXT NOT NULL DEFAULT '',
  photo_url  TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
```

### 3.4 posts 테이블 (게시판 — 구현 예정)
```sql
CREATE TABLE posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  author_id  INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 4. 메인 사이트 기능 (현재 구현 완료)

### 4.1 홍보 콘텐츠 (비회원 포함 전체 공개)

| 기능 | 페이지 | 상태 |
|------|--------|------|
| Hero 섹션 (타이틀, 파티클 배경) | index.html | 완료 |
| 인사말 (회장, 수석부회장, 감사) | index.html → pages/greeting.html | 완료 |
| 총동문회 인사말 (총동문회장, 총괄회장, 사무총장) | index.html → pages/leaders.html | 완료 |
| 집행부 소개 (11명) | index.html → pages/executives.html | 완료 |
| 정기산행 안내 (1~12월) | index.html → pages/hiking-schedule.html | 완료 |
| 정기산행 결과 (참석인원, 재무) | index.html → pages/hiking-results.html | 완료 |
| 행사 안내 (시산제, 워크숍, 백두산 등 6개) | index.html → pages/events.html | 완료 |
| 행사 결과 (사진, 후기) | index.html → pages/event-results.html | 완료 |
| 2026 캘린더 | index.html (섹션 08) | 완료 |
| Google Forms 연동 (산행 참석 설문) | index.html | 완료 |

### 4.2 인증

| 기능 | 페이지 | 상태 |
|------|--------|------|
| 이메일/비밀번호 회원가입 | pages/signup.html | 완료 |
| 이메일/비밀번호 로그인 | pages/login.html | 완료 |
| 카카오 로그인 | pages/login.html | 미구현 (버튼만 배치) |
| 비밀번호 초기화 (관리자가 임시 비밀번호 발급) | pages/admin.html | 완료 (메일 발송 대체) |
| 비밀번호 변경 (로그인 상태) | `POST /api/auth/password` | API 완료, 화면 미구현 |
| 로그아웃 | pages/mypage.html | 완료 |
| 네비게이션 인증 상태 표시 (전 페이지) | js/nav-auth.js | 완료 |

### 4.3 회원 기능

| 기능 | 페이지 | 상태 |
|------|--------|------|
| 마이페이지 (프로필 조회, 승인 상태 확인) | pages/mypage.html | 완료 |
| 프로필 수정 (이름/기수/연락처) | `PATCH /api/me` | API 완료, 화면 미구현 |
| 게시판 (글 목록, 작성, 상세, 수정, 삭제) | pages/board.html | 미구현 |
| 행사 참석 신청 | — | 미구현 |
| 회비 납부 | — | 미구현 |

### 4.4 관리자 기능 (메인 사이트 내)

| 기능 | 페이지 | 상태 |
|------|--------|------|
| 회원 가입 승인/거절 | pages/admin.html | 완료 |
| 회원 목록 조회 (탭: 대기/승인/거절/전체) | pages/admin.html | 완료 |
| 승인 취소 (승인→거절) | pages/admin.html | 완료 |

---

## 5. Admin App 요구사항 (별도 앱으로 구현 예정)

### 5.1 회원 관리
- [ ] 전체 회원 목록 (검색, 필터, 정렬)
- [ ] 회원 상세 정보 조회/수정
- [ ] 회원 프로필 사진 등록/변경/삭제 (서버 파일 업로드)
- [ ] 회원 가입 승인/거절 (현재 admin.html 기능 이관)
- [ ] 회원 역할 변경 (member ↔ admin)
- [ ] 회원 강제 탈퇴
- [ ] 회원 통계 (총 회원수, 기수별 분포, 가입 추이)

### 5.2 인사말/집행부 콘텐츠 관리
- [ ] 회장 인사말 관리 (인사말 텍스트, 사진, 직책, 이름)
- [ ] 수석부회장/감사 인사말 관리
- [ ] 총동문회 인사말 관리 (총동문회장, 총괄회장, 사무총장)
- [ ] 집행부 구성원 관리 (추가/수정/삭제/순서변경)
  - 직책, 이름, 인사말, 프로필 사진
- [ ] 인사말/집행부 데이터 DB 기반 관리 (현재 HTML 하드코딩 → SQLite)

### 5.3 산행/행사 콘텐츠 관리
- [ ] 정기산행 일정 등록/수정/삭제 (현재 HTML 하드코딩 → DB 기반)
- [ ] 산행 결과 등록 (참석인원, 재무, 사진, 후기)
- [ ] 행사 등록/수정/삭제
- [ ] 행사 결과 등록 (사진, 후기)
- [ ] 공지사항 관리

### 5.3 게시판 관리
- [ ] 게시글 목록 조회
- [ ] 부적절한 게시글 삭제
- [ ] 공지 게시글 설정

### 5.4 행사 참석 관리
- [ ] 행사별 참석 신청 목록 조회
- [ ] 참석 현황 통계 (인원수, 명단)
- [ ] 참석 확정/취소 처리

### 5.5 회비/재무 관리
- [ ] 회비 납부 현황 조회
- [ ] 회비 미납 회원 목록
- [ ] 납부 확인 처리
- [ ] 수입/지출 내역 관리
- [ ] 월별/행사별 재무 보고서

### 5.6 알림/소통
- [ ] 회원 대상 공지 발송 (푸시 또는 이메일)
- [ ] 행사 리마인더 발송

---

## 6. API 및 권한 (현재)

세션은 `icca_session` HttpOnly 쿠키(HMAC 서명, 7일 만료)로 유지된다.
비밀번호는 scrypt로 해시하며 평문이나 해시가 클라이언트로 나가지 않는다.

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/auth/me` | 누구나 | 현재 로그인 프로필 |
| POST | `/api/auth/signup` | 누구나 | 가입 신청 (status: pending) |
| POST | `/api/auth/login` | 누구나 | 로그인 — 승인 회원만 세션 발급 |
| POST | `/api/auth/logout` | 누구나 | 로그아웃 |
| POST | `/api/auth/password` | 로그인 | 비밀번호 변경 |
| PATCH | `/api/me` | 로그인 | 이름/기수/연락처 수정 |
| GET | `/api/admin/users` | 관리자 | 전체 회원 목록 |
| PATCH | `/api/admin/users/:id` | 관리자 | 승인 상태 변경 (본인 계정 강등 불가) |
| POST | `/api/admin/users/:id/reset-password` | 관리자 | 임시 비밀번호 발급 |

권한 검사는 모두 서버(`server/auth.js`의 `requireLogin` / `requireApproved` / `requireAdmin`)에서 수행한다.

---

## 7. 기술 참조

| 항목 | 값 |
|------|-----|
| 런타임 | Node.js 22.5 이상 (`node:sqlite` 내장 모듈 필요) |
| 서버 프레임워크 | Express 4 (유일한 런타임 의존성) |
| 데이터베이스 | SQLite — `data/icca.db` (WAL 모드) |
| 비밀번호 해시 | scrypt (`node:crypto`) |
| 세션 | HMAC-SHA256 서명 쿠키 `icca_session` (7일) |
| 인증 방식 | 이메일/비밀번호 (카카오 추후 추가) |
| 실행 | `npm install && npm start` → http://localhost:3000 |
| 관리자 생성 | `npm run seed:admin -- <email> <password> [이름]` |
| GitHub 저장소 | Processware-AI/ICCA-MC |
| 배포 | GitHub Pages는 정적 콘텐츠만. 회원 기능은 Node 서버 필요 |
