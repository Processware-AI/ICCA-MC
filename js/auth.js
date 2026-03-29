/* ============================================
   Authentication Logic
   ============================================ */

const Auth = {
  // 현재 사용자 정보 (Firestore 프로필 포함)
  currentUser: null,
  currentProfile: null,
  _listeners: [],

  // 인증 상태 변경 리스너
  init() {
    auth.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      if (user) {
        await this._loadProfile(user.uid);
      } else {
        this.currentProfile = null;
      }
      this._notify();
    });
  },

  // Firestore에서 사용자 프로필 로드
  async _loadProfile(uid) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      this.currentProfile = doc.exists ? doc.data() : null;
    } catch (e) {
      console.error('프로필 로드 실패:', e);
      this.currentProfile = null;
    }
  },

  // 상태 변경 콜백 등록
  onStateChange(callback) {
    this._listeners.push(callback);
  },

  _notify() {
    this._listeners.forEach(fn => fn(this.currentUser, this.currentProfile));
  },

  // 이메일/비밀번호 회원가입 (가입 후 즉시 로그아웃)
  async signup({ email, password, name, batch, phone }) {
    const credential = await auth.createUserWithEmailAndPassword(email, password);
    const uid = credential.user.uid;

    await db.collection('users').doc(uid).set({
      email,
      name,
      batch,
      phone,
      status: 'pending',   // pending | approved | rejected
      role: 'member',       // member | admin
      provider: 'email',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await credential.user.updateProfile({ displayName: name });

    // 가입 후 즉시 로그아웃 — 관리자 승인 전까지 로그인 불가
    await auth.signOut();
  },

  // 이메일/비밀번호 로그인 (승인된 회원만 허용)
  async login(email, password) {
    const credential = await auth.signInWithEmailAndPassword(email, password);
    const uid = credential.user.uid;

    // Firestore에서 승인 상태 확인
    const doc = await db.collection('users').doc(uid).get();
    const profile = doc.exists ? doc.data() : null;

    if (!profile || profile.status !== 'approved') {
      // 승인되지 않은 회원은 즉시 로그아웃
      await auth.signOut();
      const statusMsg = {
        pending: '관리자 승인을 기다리고 있습니다.\n승인 후 로그인할 수 있습니다.',
        rejected: '가입이 거절되었습니다.\n문의사항은 사무국장에게 연락해주세요.'
      };
      throw { code: 'auth/not-approved', message: statusMsg[profile?.status] || '회원 정보를 찾을 수 없습니다.' };
    }

    await this._loadProfile(uid);
    this._notify();
    return credential.user;
  },

  // 로그아웃
  async logout() {
    await auth.signOut();
  },

  // 승인된 회원인지 확인
  isApproved() {
    return this.currentProfile && this.currentProfile.status === 'approved';
  },

  // 로그인 상태인지 확인
  isLoggedIn() {
    return !!this.currentUser;
  },

  // 상태 텍스트
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
