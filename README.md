# 이카산악회 (ICCA Mountain Club)

iOS/Android 앱과 웹 서비스로 동작하는 산악회 회원 관리 시스템입니다.

## 플랫폼

| 플랫폼 | 디렉토리 | 기술 |
|--------|---------|------|
| 📱 **모바일 앱** | `mountain-club-app/` | React Native + Expo |
| 🌐 **웹 서비스** | `web-app/` | Next.js 14 + Tailwind CSS |

## 기능

| 기능 | 설명 |
|------|------|
| 🔐 **회원 인증** | 이메일/비밀번호 회원가입·로그인, 비밀번호 재설정 |
| 🏠 **홈 대시보드** | 다가오는 일정, 최근 공지사항, 나의 활동 통계 |
| 🗓️ **등산 일정** | 산행 일정 등록·조회·참가 신청, 난이도/인원 관리 |
| 📢 **공지사항** | 카테고리별 공지 작성·조회, 고정 공지, 조회수 |
| 💳 **결제** | 연회비·참가비 결제 (Stripe), 카카오페이·네이버페이·토스 지원 |
| 🖼️ **사진 갤러리** | 등산 사진 업로드·좋아요, 그리드 뷰, 상세 모달 |
| 👥 **회원 관리** | 회원 목록 조회·검색, 관리자 전화 연결 |
| 👤 **내 정보** | 프로필 관리, 비상 연락처, 결제 내역 |

## 기술 스택

- **프론트엔드:** React Native + Expo (iOS/Android 동시 지원)
- **백엔드:** Firebase (Auth, Firestore, Storage)
- **결제:** Stripe + 한국 간편결제 (카카오/네이버/토스)
- **상태관리:** Zustand
- **네비게이션:** React Navigation v6
- **UI:** 커스텀 컴포넌트 + Expo Vector Icons

## 프로젝트 구조

```
ICCA-MC/
├── mountain-club-app/          # React Native 앱
│   ├── src/
│   │   ├── screens/           # 화면 컴포넌트
│   │   │   ├── auth/          # 로그인, 회원가입
│   │   │   ├── main/          # 홈 화면
│   │   │   ├── events/        # 등산 일정
│   │   │   ├── notices/       # 공지사항
│   │   │   ├── payment/       # 결제
│   │   │   ├── gallery/       # 사진 갤러리
│   │   │   ├── profile/       # 내 정보
│   │   │   └── members/       # 회원 목록
│   │   ├── navigation/        # 네비게이션 설정
│   │   ├── services/          # Firebase, 결제 API
│   │   ├── store/             # Zustand 상태 관리
│   │   ├── types/             # TypeScript 타입
│   │   └── constants/         # 색상, 상수
│   ├── App.tsx                # 앱 진입점
│   ├── app.json               # Expo 설정
│   └── package.json
├── backend/                   # 결제 백엔드 서버
│   ├── server.js              # Express + Stripe 서버
│   └── package.json
└── firestore.rules            # Firebase 보안 규칙
```

## 시작하기

### 1. 앱 설치 및 실행

```bash
cd mountain-club-app
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 Firebase 설정값 입력

npm start       # Expo 개발 서버 시작
npm run ios     # iOS 시뮬레이터
npm run android # Android 에뮬레이터
```

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com)에서 새 프로젝트 생성
2. Authentication > 이메일/비밀번호 활성화
3. Firestore Database 생성
4. Storage 생성
5. `firestore.rules` 파일을 Firebase Console에 적용
6. 앱 등록 후 설정값을 `.env`에 입력

### 3. 백엔드 서버 설정 (결제용)

```bash
cd backend
npm install
cp .env.example .env  # Stripe 키 입력
npm start
```

### 4. Stripe 결제 설정

1. [Stripe Dashboard](https://dashboard.stripe.com)에서 계정 생성
2. API 키 발급 (테스트 모드)
3. 백엔드 `.env`에 키 입력
4. 프로덕션 배포 전 실제 키로 교체

## 회원 등급

| 등급 | 권한 |
|------|------|
| 일반 회원 | 일정 참가, 사진 업로드 |
| 선임 회원 | 일반 회원 권한 + 구분 표시 |
| 관리자 | 전체 기능 + 일정/공지 등록, 회원 관리 |

## 결제 시스템

- **연회비:** 120,000원/년
- **참가비:** 이벤트별 상이
- **결제 수단:** 신용카드, 카카오페이, 네이버페이, 토스페이
- **환불:** 영업일 3~5일 소요

## 웹 서비스 시작하기

```bash
cd web-app
npm install
cp .env.example .env.local  # Firebase + Stripe 키 입력
npm run dev   # http://localhost:3000
npm run build # 프로덕션 빌드
```

### 웹 서비스 배포 (Vercel 권장)

```bash
npm install -g vercel
vercel --prod
```

## 모바일 앱 배포 (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build --platform all  # iOS + Android 동시 빌드
```
