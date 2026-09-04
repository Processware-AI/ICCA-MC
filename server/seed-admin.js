/* ============================================
   초기 관리자 계정 생성 스크립트
   사용: npm run seed:admin -- <email> <password> [이름] [기수] [연락처]
   ============================================ */

const { db, Users, toProfile } = require('./db');
const { hashPassword } = require('./auth');

const [email, password, name = '관리자', batch = '', phone = ''] = process.argv.slice(2);

if (!email || !password) {
  console.error('사용법: npm run seed:admin -- <email> <password> [이름] [기수] [연락처]');
  process.exit(1);
}
if (password.length < 6) {
  console.error('비밀번호는 6자 이상이어야 합니다.');
  process.exit(1);
}

const existing = Users.findByEmail(email);

if (existing) {
  // 이미 있는 계정이면 관리자 + 승인 상태로 승격하고 비밀번호를 재설정
  Users.updatePassword(existing.id, hashPassword(password));
  Users.updateStatus(existing.id, 'approved');
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
  console.log('기존 계정을 관리자로 승격했습니다:', toProfile(Users.findById(existing.id)));
} else {
  const user = Users.create({
    email,
    passwordHash: hashPassword(password),
    name, batch, phone,
    status: 'approved',
    role: 'admin',
    provider: 'email'
  });
  console.log('관리자 계정을 생성했습니다:', toProfile(user));
}
