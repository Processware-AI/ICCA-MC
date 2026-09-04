# ICCA-MC — 정적 사이트 + 로컬 API 서버
# SQLite는 Node 내장 node:sqlite 모듈을 쓰므로 별도 DB 컨테이너가 필요 없다.

FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

# 의존성 먼저 설치해 레이어 캐시를 활용한다 (express 하나뿐)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 애플리케이션 소스 (정적 페이지 + 서버)
COPY . .

# DB 파일이 저장될 디렉터리 — 볼륨으로 마운트된다
RUN mkdir -p /app/data && chown -R node:node /app/data

USER node

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/auth/me').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.js"]
