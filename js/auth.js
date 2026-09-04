/* ============================================
   Authentication Logic
   로컬 API(/api/auth/*) 기반 세션 인증.
   ============================================ */

const Auth = {
  // 현재 사용자 프로필 (비로그인 시 null)
  currentUser: null,
  currentProfile: null,

  // 최초 세션 확인이 끝나면 resolve 되는 Promise
  ready: null,

  _resolved: false,
  _listeners: [],

  init() {
    this.ready = this._refresh();
    return this.ready;
  },

  // 서버에서 현재 세션 상태를 다시 읽어온다
  async _refresh() {
    try {
      const data = await Api.me();
      this.currentProfile = data.user || null;
    } catch (e) {
      console.error('세션 확인 실패:', e);
      this.currentProfile = null;
    }
    this.currentUser = this.currentProfile;
    this._resolved = true;
    this._notify();
    return this.currentProfile;
  },

  // 상태 변경 콜백 등록 — 이미 확인이 끝났다면 즉시 1회 호출
  onStateChange(callback) {
    this._listeners.push(callback);
    if (this._resolved) callback(this.currentUser, this.currentProfile);
  },

  _notify() {
    this._listeners.forEach(fn => {
      try {
        fn(this.currentUser, this.currentProfile);
      } catch (e) {
        console.error(e);
      }
    });
  },

  // 회원가입 — 서버에 status: 'pending'으로 저장되며 로그인 상태는 되지 않는다
  async signup({ email, password, name, batch, phone }) {
    await Api.signup({ email, password, name, batch, phone });
  },

  // 로그인 — 승인된 회원만 세션을 발급받는다
  async login(email, password) {
    const data = await Api.login(email, password);
    this.currentProfile = data.user;
    this.currentUser = data.user;
    this._resolved = true;
    this._notify();
    return data.user;
  },

  async logout() {
    try {
      await Api.logout();
    } finally {
      this.currentProfile = null;
      this.currentUser = null;
      this._notify();
    }
  },

  // 프로필 다시 읽기 (마이페이지 수정 후 등)
  refresh() {
    this.ready = this._refresh();
    return this.ready;
  },

  isApproved() {
    return !!this.currentProfile && this.currentProfile.status === 'approved';
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  isAdmin() {
    return !!this.currentProfile && this.currentProfile.role === 'admin';
  },

  getStatusText() {
    if (!this.currentProfile) return '';
    const map = {
      pending: '승인 대기',
      approved: '승인 완료',
      rejected: '승인 거절'
    };
    return map[this.currentProfile.status] || '';
  }
};

Auth.init();
