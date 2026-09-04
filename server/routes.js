/* ============================================
   REST API — Firebase Auth/Firestore 대체
   ============================================ */

const express = require('express');
const crypto = require('crypto');
const { Users, toProfile } = require('./db');
const {
  hashPassword, verifyPassword, issueSession, clearSession,
  requireLogin, requireAdmin
} = require('./auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(res, status, code, message) {
  return res.status(status).json({ code, message });
}

/* ---------------- 인증 ---------------- */

// 현재 로그인 상태 — 모든 페이지의 네비게이션이 호출
router.get('/auth/me', (req, res) => {
  res.json({ user: req.profile });
});

// 회원가입 — status: pending 으로 저장, 로그인 상태가 되지는 않는다
router.post('/auth/signup', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const name = String(req.body.name || '').trim();
  const batch = String(req.body.batch || '').trim();
  const phone = String(req.body.phone || '').trim();

  if (!EMAIL_RE.test(email)) return fail(res, 400, 'invalid-email', '이메일 형식이 올바르지 않습니다.');
  if (password.length < 6) return fail(res, 400, 'weak-password', '비밀번호는 6자 이상 입력해주세요.');
  if (!name) return fail(res, 400, 'invalid-name', '이름을 입력해주세요.');
  if (Users.findByEmail(email)) return fail(res, 409, 'email-already-in-use', '이미 등록된 이메일입니다.');

  const user = Users.create({
    email,
    passwordHash: hashPassword(password),
    name, batch, phone,
    status: 'pending',
    role: 'member',
    provider: 'email'
  });

  res.status(201).json({ user: toProfile(user) });
});

// 로그인 — 승인된 회원만 세션 발급
router.post('/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const row = Users.findByEmail(email);
  if (!row || !verifyPassword(password, row.password_hash)) {
    return fail(res, 401, 'invalid-credential', '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  if (row.status !== 'approved') {
    const messages = {
      pending: '관리자 승인을 기다리고 있습니다.\n승인 후 로그인할 수 있습니다.',
      rejected: '가입이 거절되었습니다.\n문의사항은 사무국장에게 연락해주세요.'
    };
    return res.status(403).json({
      code: 'not-approved',
      status: row.status,
      message: messages[row.status] || '회원 정보를 확인할 수 없습니다.'
    });
  }

  issueSession(res, row);
  res.json({ user: toProfile(row) });
});

router.post('/auth/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

// 비밀번호 변경 (로그인 상태)
router.post('/auth/password', requireLogin, (req, res) => {
  const current = String(req.body.currentPassword || '');
  const next = String(req.body.newPassword || '');

  if (!verifyPassword(current, req.user.password_hash)) {
    return fail(res, 401, 'invalid-credential', '현재 비밀번호가 올바르지 않습니다.');
  }
  if (next.length < 6) return fail(res, 400, 'weak-password', '새 비밀번호는 6자 이상 입력해주세요.');

  Users.updatePassword(req.user.id, hashPassword(next));
  res.json({ ok: true });
});

/* ---------------- 마이페이지 ---------------- */

router.patch('/me', requireLogin, (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return fail(res, 400, 'invalid-name', '이름을 입력해주세요.');

  const row = Users.updateProfile(req.user.id, {
    name,
    batch: String(req.body.batch || '').trim(),
    phone: String(req.body.phone || '').trim()
  });
  res.json({ user: toProfile(row) });
});

/* ---------------- 관리자 ---------------- */

router.get('/admin/users', requireAdmin, (req, res) => {
  res.json({ users: Users.listAll().map(toProfile) });
});

router.patch('/admin/users/:id', requireAdmin, (req, res) => {
  const status = String(req.body.status || '');
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return fail(res, 400, 'invalid-status', '알 수 없는 상태 값입니다.');
  }

  const target = Users.findById(req.params.id);
  if (!target) return fail(res, 404, 'not-found', '회원을 찾을 수 없습니다.');
  if (target.id === req.user.id && status !== 'approved') {
    return fail(res, 400, 'self-demote', '본인 계정의 승인 상태는 변경할 수 없습니다.');
  }

  res.json({ user: toProfile(Users.updateStatus(target.id, status)) });
});

// Firebase의 비밀번호 재설정 메일을 대신하는 관리자용 임시 비밀번호 발급
router.post('/admin/users/:id/reset-password', requireAdmin, (req, res) => {
  const target = Users.findById(req.params.id);
  if (!target) return fail(res, 404, 'not-found', '회원을 찾을 수 없습니다.');

  const tempPassword = crypto.randomBytes(6).toString('base64url');
  Users.updatePassword(target.id, hashPassword(tempPassword));
  res.json({ tempPassword });
});

module.exports = router;
