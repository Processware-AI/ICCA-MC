# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

인천상공회의소 CEO아카데미 총동문회 산악동호회 2026년 랜딩 페이지. 순수 HTML/CSS/JS로 구성된 정적 사이트로, 별도 빌드 도구나 프레임워크 없이 동작한다.

## Architecture

- `index.html` — 메인 랜딩 페이지 (6개 섹션: 인사말, 집행부, 정기산행, 산행결과, 행사안내, 행사결과)
- `pages/` — 각 섹션의 상세 페이지 (greeting, executives, hiking-schedule, hiking-results, events, event-results)
- `css/style.css` — 전체 스타일 (다크 테마, CSS 변수 기반, glassmorphism/gradient 디자인)
- `js/main.js` — Intersection Observer 기반 스크롤 애니메이션, 모바일 네비게이션, 파티클 효과
- `images/` — 이미지 파일 디렉토리 (사용자가 직접 교체)

## Key Patterns

- **이미지 교체**: 모든 이미지는 `<img onerror="this.style.display='none'">` 패턴으로 플레이스홀더 위에 겹쳐져 있음. 실제 이미지 파일을 `images/` 폴더에 넣으면 자동 표시됨.
- **Google Form 연결**: `https://forms.google.com/your-form-link` 및 `your-event-form-link` 텍스트를 실제 Google Form URL로 교체
- **색상 시스템**: CSS 변수(`--color-accent`, `--color-accent2`, `--color-warm` 등)로 관리. `style.css`의 `:root`에서 일괄 변경 가능.
- **상세 페이지 해시 라우팅**: 메인에서 상세 페이지로 이동 시 `pages/파일.html#id` 형태로 특정 섹션에 스크롤

## Development

순수 정적 사이트 — 빌드 과정이나 의존성 설치 없음.

**배포**: Cloudflare Pages 또는 GitHub Pages에 루트 디렉토리를 그대로 배포.

**로컬 테스트**: `npx serve .` 등 아무 정적 서버로 확인 가능.
