/* ============================================
   Local SQLite Database (node:sqlite 내장 모듈)
   ============================================ */

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = process.env.ICCA_DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = process.env.ICCA_DB_PATH || path.join(DATA_DIR, 'icca.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// users — Firestore의 users/{uid} 컬렉션을 대체
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    batch         TEXT NOT NULL DEFAULT '',
    phone         TEXT NOT NULL DEFAULT '',
    photo_url     TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
    role          TEXT NOT NULL DEFAULT 'member',    -- member | admin
    provider      TEXT NOT NULL DEFAULT 'email',     -- email | kakao
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  )
`);

db.exec('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
db.exec('CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC)');

/**
 * DB 행 → 클라이언트 프로필 객체.
 * password_hash는 절대 밖으로 나가지 않는다.
 */
function toProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    batch: row.batch,
    phone: row.phone,
    photoUrl: row.photo_url,
    status: row.status,
    role: row.role,
    provider: row.provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const Users = {
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase());
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id));
  },

  listAll() {
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC, id DESC').all();
  },

  create({ email, passwordHash, name, batch, phone, status, role, provider }) {
    const now = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO users (email, password_hash, name, batch, phone, status, role, provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(email).trim().toLowerCase(),
      passwordHash,
      name,
      batch || '',
      phone || '',
      status || 'pending',
      role || 'member',
      provider || 'email',
      now,
      now
    );
    return this.findById(info.lastInsertRowid);
  },

  updateStatus(id, status) {
    db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, new Date().toISOString(), Number(id));
    return this.findById(id);
  },

  updateProfile(id, { name, batch, phone }) {
    db.prepare('UPDATE users SET name = ?, batch = ?, phone = ?, updated_at = ? WHERE id = ?')
      .run(name, batch || '', phone || '', new Date().toISOString(), Number(id));
    return this.findById(id);
  },

  updatePassword(id, passwordHash) {
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .run(passwordHash, new Date().toISOString(), Number(id));
    return this.findById(id);
  },

  countAdmins() {
    return db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get().n;
  }
};

module.exports = { db, Users, toProfile, DB_PATH, DATA_DIR };
