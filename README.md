# ICCA-MC — 인천상공회의소 CEO아카데미 총동문회 산악동호회

인천상공회의소 CEO아카데미 총동문회 산악동호회 2026년 웹사이트.
HTML/CSS/JS 정적 페이지 + 로컬 **Express + SQLite** API 서버로 동작한다. (Firebase 미사용)

---

## 실행 방법

```bash
npm install          # express 설치 (SQLite는 Node 내장 node:sqlite 사용)
npm start            # http://localhost:3000
```

`npm start`는 API 서버(`/api/*`)와 정적 사이트를 같은 포트에서 함께 서빙한다.
개발 중 자동 재시작이 필요하면 `npm run dev`.

포트를 바꾸려면 `PORT=8080 npm start`.

> **Node.js 22.5 이상**이 필요하다. SQLite 드라이버로 Node 내장 `node:sqlite` 모듈을 쓰기 때문에
> 별도의 네이티브 빌드나 DB 서버 설치가 필요 없다.

### 관리자 계정 생성

회원 승인을 하려면 관리자 계정이 최소 하나 필요하다.

```bash
npm run seed:admin -- admin@example.com 비밀번호 "홍길동" "20기" "010-0000-0000"
```

이미 있는 이메일이면 해당 계정을 관리자(`role: admin`) + 승인 상태로 승격하고 비밀번호를 재설정한다.

---

## 데이터베이스

- 파일: `data/icca.db` (SQLite, WAL 모드) — git에 커밋되지 않는다.
- 스키마는 서버 시작 시 `server/db.js`가 자동 생성한다.
- 세션 서명 키는 `data/session-secret`에 자동 생성된다. 운영 시에는 `ICCA_SESSION_SECRET` 환경변수로 지정하는 것을 권장.

### `users` 테이블

| 컬럼 | 설명 |
|------|------|
| `id` | PK (Firebase의 uid를 대체) |
| `email` | 로그인 이메일 (대소문자 무시, 유니크) |
| `password_hash` | `scrypt$<salt>$<hash>` 형식 |
| `name`, `batch`, `phone`, `photo_url` | 프로필 |
| `status` | `pending` \| `approved` \| `rejected` |
| `role` | `member` \| `admin` |
| `provider` | `email` \| `kakao` |
| `created_at`, `updated_at` | ISO 8601 문자열 |

### 환경변수

| 이름 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3000` | 서버 포트 |
| `ICCA_DB_PATH` | `data/icca.db` | SQLite 파일 경로 |
| `ICCA_DATA_DIR` | `data/` | 데이터 디렉터리 |
| `ICCA_SESSION_SECRET` | 자동 생성 | 세션 쿠키 서명 키 |
| `ICCA_SECURE_COOKIE` | `0` | HTTPS로 서비스할 때 `1` |

---

## API

세션은 `icca_session` HttpOnly 쿠키(HMAC 서명, 7일)로 유지된다.

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/auth/me` | 누구나 | 현재 로그인 프로필 (`{ user: null }` 가능) |
| POST | `/api/auth/signup` | 누구나 | 가입 신청 (`status: pending`, 로그인은 되지 않음) |
| POST | `/api/auth/login` | 누구나 | 로그인 — **승인된 회원만** 세션 발급 |
| POST | `/api/auth/logout` | 누구나 | 로그아웃 |
| POST | `/api/auth/password` | 로그인 | 비밀번호 변경 |
| PATCH | `/api/me` | 로그인 | 이름/기수/연락처 수정 |
| GET | `/api/admin/users` | 관리자 | 전체 회원 목록 |
| PATCH | `/api/admin/users/:id` | 관리자 | 승인 상태 변경 |
| POST | `/api/admin/users/:id/reset-password` | 관리자 | 임시 비밀번호 발급 |

에러 응답은 `{ code, message }` 형태이며, 프런트엔드는 `err.code`로 분기한다
(`invalid-credential`, `not-approved`, `email-already-in-use`, `weak-password`, `invalid-email`, `unauthenticated`, `forbidden` 등).

---

## 파일 구조

```
index.html            메인 랜딩 페이지
pages/                상세 페이지 + 인증 페이지(login/signup/mypage/admin)
css/style.css         전체 스타일
js/api.js             로컬 API 클라이언트 (Firebase SDK 대체)
js/auth.js            로그인/가입/세션 상태 관리
js/guard.js           회원 전용 페이지 접근 제어
js/nav-auth.js        네비게이션 인증 상태 표시
js/main.js            스크롤 애니메이션, 캘린더 등
server/index.js       Express 앱 (API + 정적 서빙)
server/db.js          SQLite 스키마 및 쿼리
server/auth.js        비밀번호 해시 · 세션 · 권한 미들웨어
server/routes.js      REST API 라우트
server/seed-admin.js  초기 관리자 생성 스크립트
data/icca.db          SQLite 데이터 파일 (git 제외)
```

---

## 배포 참고

`.github/workflows`의 GitHub Pages 배포는 **정적 콘텐츠 전용**이다.
로그인·회원가입·관리자 승인은 API 서버가 필요하므로 GitHub Pages에서는 동작하지 않는다.
회원 기능까지 쓰려면 이 저장소를 Node.js가 실행되는 서버(사내 PC, VPS 등)에 올려 `npm start`로 구동해야 한다.
