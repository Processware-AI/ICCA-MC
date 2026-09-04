# ICCA-MC — 인천상공회의소 CEO아카데미 총동문회 산악동호회

인천상공회의소 CEO아카데미 총동문회 산악동호회 2026년 웹사이트.
HTML/CSS/JS 정적 페이지 + 로컬 **Express + SQLite** API 서버로 동작한다. (Firebase 미사용)

---

## 실행 방법

### Docker (권장)

```bash
docker compose up -d --build           # http://localhost:3000
HOST_PORT=8080 docker compose up -d    # 다른 포트로 띄우기
```

관리자 계정 생성:

```bash
docker compose exec web npm run seed:admin -- admin@example.com 비밀번호 "홍길동" "20기" "010-0000-0000"
```

| 작업 | 명령 |
|------|------|
| 로그 보기 | `docker compose logs -f` |
| 상태 확인 | `docker compose ps` (healthcheck 포함) |
| 중지 | `docker compose down` |
| 중지 + **데이터 삭제** | `docker compose down -v` |
| 코드 변경 반영 | `docker compose up -d --build` (개발 모드는 아래 참고) |

SQLite DB와 세션 키는 `icca-data` 볼륨에 저장되므로 컨테이너를 지우거나 다시 빌드해도 회원 데이터는 유지된다.
호스트에서 DB 파일을 직접 다루고 싶으면 `docker-compose.yml`의 볼륨을 `./data:/app/data` 바인드 마운트로 바꾸면 된다.

운영 시에는 `ICCA_SESSION_SECRET`을 고정값으로 지정하는 것을 권장한다(지정하지 않으면 볼륨에 자동 생성된다).
HTTPS 리버스 프록시 뒤에 둘 경우 `ICCA_SECURE_COOKIE=1`.

```bash
# .env 파일 예시 (docker compose가 자동으로 읽는다)
ICCA_SESSION_SECRET=충분히-긴-임의-문자열
ICCA_SECURE_COOKIE=1
HOST_PORT=8080
```

### 개발 모드 (콘텐츠 수정 즉시 반영)

`docker-compose.override.yml`이 있으면 `docker compose`가 **자동으로** 함께 읽는다.
정적 파일과 `server/`를 호스트에서 바인드 마운트하므로 재빌드 없이 수정이 반영된다.

| 무엇을 고쳤나 | 필요한 작업 | 소요 |
|---------------|-------------|------|
| HTML / CSS / JS / 이미지 | 브라우저 새로고침 | 즉시 |
| `server/` 코드 | `docker compose restart web` | 약 1초 |
| `package.json` (의존성) | `docker compose up -d --build` | 약 7초 |

`server/`는 `node --watch`로 실행되지만, **Windows 바인드 마운트에서는 파일 변경 이벤트가 컨테이너로 전달되지 않아 자동 재시작이 동작하지 않는다**(실측 확인). 위 표대로 `docker compose restart web`을 쓰면 된다. 리눅스/맥 호스트에서는 자동 재시작이 동작한다.

배포처럼 오버라이드를 적용하고 싶지 않을 때는 베이스 파일만 명시한다:

```bash
docker compose -f docker-compose.yml up -d --build
```

### Node 직접 실행

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
Dockerfile                   컨테이너 이미지 (node:24-alpine)
docker-compose.yml           컨테이너 실행 정의 + 데이터 볼륨
docker-compose.override.yml  개발용 — 소스를 바인드 마운트해 재빌드 없이 반영
```

---

## 배포 참고

`.github/workflows`의 GitHub Pages 배포는 **정적 콘텐츠 전용**이다.
로그인·회원가입·관리자 승인은 API 서버가 필요하므로 GitHub Pages에서는 동작하지 않는다.
회원 기능까지 쓰려면 이 저장소를 Node.js 또는 Docker가 실행되는 서버(사내 PC, VPS 등)에 올려 구동해야 한다.
Docker가 설치된 환경이라면 `docker compose up -d --build` 한 줄로 끝난다.
