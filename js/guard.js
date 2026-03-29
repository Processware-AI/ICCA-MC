/* ============================================
   Page Access Guard
   ============================================ */

const Guard = {
  // 회원 전용 페이지 접근 제어
  requireApproved(redirectUrl) {
    const loginUrl = redirectUrl || this._getLoginUrl();

    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        alert('로그인이 필요합니다.');
        location.href = loginUrl;
        return;
      }

      try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (!doc.exists || doc.data().status !== 'approved') {
          alert('승인된 회원만 이용할 수 있습니다.\n관리자 승인을 기다려주세요.');
          location.href = loginUrl.replace('login.html', 'mypage.html');
        }
      } catch (e) {
        console.error('권한 확인 실패:', e);
        location.href = loginUrl;
      }
    });
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
