/* ============================================
   Nav Auth State — 모든 페이지 공통
   네비게이션 로그인/마이페이지 버튼 상태 관리
   ============================================ */

(function() {
  const isSubPage = location.pathname.includes('/pages/');
  const loginUrl = isSubPage ? 'login.html' : 'pages/login.html';
  const mypageUrl = isSubPage ? 'mypage.html' : 'pages/mypage.html';

  // 버튼을 인증 확인 전까지 숨김
  const btn = document.getElementById('navAuthBtn');
  if (btn) btn.style.visibility = 'hidden';

  auth.onAuthStateChanged(async (user) => {
    if (!btn) return;

    if (user) {
      // Firestore에서 승인 상태 확인
      try {
        const doc = await db.collection('users').doc(user.uid).get();
        const profile = doc.exists ? doc.data() : null;

        if (profile && profile.status === 'approved') {
          btn.textContent = user.displayName || '마이페이지';
          btn.href = mypageUrl;
          btn.classList.add('logged-in');
        } else {
          // 승인되지 않은 사용자는 로그아웃 처리
          await auth.signOut();
          btn.textContent = '로그인';
          btn.href = loginUrl;
          btn.classList.remove('logged-in');
        }
      } catch (e) {
        btn.textContent = '로그인';
        btn.href = loginUrl;
        btn.classList.remove('logged-in');
      }
    } else {
      btn.textContent = '로그인';
      btn.href = loginUrl;
      btn.classList.remove('logged-in');
    }

    btn.style.visibility = 'visible';
  });
})();
