/* ============================================
   비밀번호 해시 + 세션 토큰 (node:crypto 내장 모듈)
   외부 인증 라이브러리 없이 동작한다.
   ============================================ */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DATA_DIR, Users, toProfile } = require('./db');

const COOKIE_NAME = 'icca_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7일

/* ---------- 세션 서명 키 ---------- */
// ICCA_SESSION_SECRET 환경변수가 있으면 사용하고, 없으면 data/session-secret에 자동 생성.
function loadSecret() {
  if (process.env.ICCA_SESSION_SECRET) return process.env.ICCA_SESSION_SECRET;

  const file = path.join(DATA_DIR, 'session-secret');
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch {
    const secret = crypto.randomBytes(48).toString('hex');
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, secret, { mode: 0o600 });
    return secret;
  }
}
const SECRET = loadSecret();

/* ---------- 비밀번호 (scrypt) ---------- */
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

/* ---------- 세션 토큰 (HMAC 서명) ---------- */
function base64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function sign(payload) {
  const body = base64url(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function unsign(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(mac || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function issueSession(res, user) {
  const token = sign({ uid: user.id, exp: Date.now() + SESSION_MAX_AGE });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
    secure: process.env.ICCA_SECURE_COOKIE === '1'
  });
}

function clearSession(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

/* ---------- 쿠키 파서 (의존성 없이) ---------- */
function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie;
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/* ---------- 미들웨어 ---------- */
// 요청마다 req.user(DB 행) / req.profile(공개 프로필)을 채운다.
function attachUser(req, res, next) {
  req.user = null;
  req.profile = null;

  const payload = unsign(parseCookies(req)[COOKIE_NAME]);
  if (payload) {
    const row = Users.findById(payload.uid);
    if (row) {
      req.user = row;
      req.profile = toProfile(row);
    }
  }
  next();
}

function requireLogin(req, res, next) {
  if (!req.user) return res.status(401).json({ code: 'unauthenticated', message: '로그인이 필요합니다.' });
  next();
}

function requireApproved(req, res, next) {
  if (!req.user) return res.status(401).json({ code: 'unauthenticated', message: '로그인이 필요합니다.' });
  if (req.user.status !== 'approved') {
    return res.status(403).json({ code: 'not-approved', message: '승인된 회원만 이용할 수 있습니다.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ code: 'unauthenticated', message: '로그인이 필요합니다.' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 'forbidden', message: '관리자만 이용할 수 있습니다.' });
  }
  next();
}

module.exports = {
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  issueSession,
  clearSession,
  attachUser,
  requireLogin,
  requireApproved,
  requireAdmin
};
