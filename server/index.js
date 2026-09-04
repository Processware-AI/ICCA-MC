/* ============================================
   로컬 API 서버 + 정적 사이트 호스팅
   실행: npm start  (기본 http://localhost:3000)
   ============================================ */

const path = require('path');
const express = require('express');
const { attachUser } = require('./auth');
const api = require('./routes');
const { DB_PATH, Users } = require('./db');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.use(attachUser);

// API는 항상 최신 응답을 주도록
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, api);

app.use('/api', (req, res) => {
  res.status(404).json({ code: 'not-found', message: '존재하지 않는 API 경로입니다.' });
});

// 정적 사이트 (index.html, pages/, css/, js/, images/)
app.use(express.static(ROOT, { extensions: ['html'], index: 'index.html' }));

// 에러 핸들러 — 스택은 서버 로그에만 남긴다
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ code: 'internal', message: '서버 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  console.log(`ICCA-MC 서버 실행 중 → http://localhost:${PORT}`);
  console.log(`DB 파일: ${DB_PATH}`);
  if (Users.countAdmins() === 0) {
    console.log('관리자 계정이 없습니다. `npm run seed:admin` 으로 생성하세요.');
  }
});
