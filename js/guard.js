/* ============================================
   Page Access Guard
   ============================================ */

const Guard = {
  // 회원 전용 페이지 접근 제어
  async requireApproved(redirectUrl) {
    const loginUrl = redirectUrl || this._getLoginUrl();

    const profile = await Auth.ready;

    if (!profile) {
      alert('로그인이 필요합니다.');
      location.href = loginUrl;
      return false;
    }

    if (profile.status !== 'approved') {
      alert('승인된 회원만 이용할 수 있습니다.\n관리자 승인을 기다려주세요.');
      location.href = loginUrl.replace('login.html', 'mypage.html');
      return false;
    }

    return true;
  },

  // 관리자 전용 페이지 접근 제어
  async requireAdmin(redirectUrl) {
    const ok = await this.requireApproved(redirectUrl);
    if (!ok) return false;

    if (!Auth.isAdmin()) {
      alert('관리자만 이용할 수 있습니다.');
      location.href = (redirectUrl || this._getLoginUrl()).replace('login.html', 'mypage.html');
      return false;
    }
    return true;
  },

  // 로그인 페이지 경로 계산 (pages/ 하위인지 루트인지)
  _getLoginUrl() {
    const path = location.pathname;
    if (path.includes('/pages/')) {
      return 'login.html';
    }
    return 'pages/login.html';
  }
};
