/* ============================================
   Local API Client
   로컬 Express + SQLite 서버(/api)와 통신한다.
   Firebase SDK를 대체하므로 모든 페이지에서 가장 먼저 로드된다.
   ============================================ */

const Api = {
  base: '/api',

  async request(method, path, body) {
    let res;
    try {
      res = await fetch(this.base + path, {
        method,
        credentials: 'same-origin',
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch (e) {
      throw Object.assign(
        new Error('서버에 연결할 수 없습니다.\n로컬 서버가 실행 중인지 확인해주세요 (npm start).'),
        { code: 'network-error' }
      );
    }

    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    if (!res.ok) {
      throw Object.assign(
        new Error((data && data.message) || '요청 처리 중 오류가 발생했습니다.'),
        { code: (data && data.code) || 'unknown', status: res.status, data }
      );
    }

    return data;
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body || {}); },
  patch(path, body) { return this.request('PATCH', path, body || {}); },

  /* ---------- 인증 ---------- */
  me() { return this.get('/auth/me'); },
  signup(payload) { return this.post('/auth/signup', payload); },
  login(email, password) { return this.post('/auth/login', { email, password }); },
  logout() { return this.post('/auth/logout'); },
  changePassword(currentPassword, newPassword) {
    return this.post('/auth/password', { currentPassword, newPassword });
  },
  updateMe(payload) { return this.patch('/me', payload); },

  /* ---------- 관리자 ---------- */
  listUsers() { return this.get('/admin/users'); },
  setUserStatus(id, status) { return this.patch('/admin/users/' + id, { status }); },
  resetUserPassword(id) { return this.post('/admin/users/' + id + '/reset-password'); }
};
