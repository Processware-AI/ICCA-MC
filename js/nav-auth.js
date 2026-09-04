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

  Auth.onStateChange((user, profile) => {
    if (!btn) return;

    if (profile && profile.status === 'approved') {
      btn.textContent = profile.name || '마이페이지';
      btn.href = mypageUrl;
      btn.classList.add('logged-in');
    } else {
      btn.textContent = '로그인';
      btn.href = loginUrl;
      btn.classList.remove('logged-in');
    }

    btn.style.visibility = 'visible';
  });
})();
