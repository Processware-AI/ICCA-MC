/* ============================================
   ICCA-MC Mountain Club 2026 — Main Script
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- BACK NAVIGATION DETECTION ---------- */
  // Detect if user came back via browser back or history.back()
  const navEntries = performance.getEntriesByType('navigation');
  const isBackNav = navEntries.length > 0 && navEntries[0].type === 'back_forward';

  if (isBackNav) {
    // Skip all fade-up animations — show everything instantly
    document.querySelectorAll('.fade-up').forEach(el => {
      el.classList.add('visible');
      el.style.transition = 'none';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { el.style.transition = ''; });
      });
    });
    // Let browser handle scroll restoration natively
  }

  /* ---------- SCROLL REVEAL (Intersection Observer) ---------- */
  if (!isBackNav) {
    const fadeEls = document.querySelectorAll('.fade-up');
    if (fadeEls.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      fadeEls.forEach(el => observer.observe(el));
    }
  }

  /* ---------- MOBILE NAV TOGGLE ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      navToggle.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
      });
    });
  }

  /* ---------- HERO FLOATING LEAVES ---------- */
  const particleContainer = document.getElementById('particles');
  if (particleContainer) {
    const leafColors = [
      'rgba(90, 160, 80, 0.25)',
      'rgba(120, 180, 100, 0.2)',
      'rgba(60, 140, 70, 0.15)',
      'rgba(100, 170, 90, 0.2)'
    ];
    for (let i = 0; i < 20; i++) {
      const leaf = document.createElement('div');
      const size = Math.random() * 6 + 3;
      const color = leafColors[Math.floor(Math.random() * leafColors.length)];
      leaf.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size * 0.6}px;
        background: ${color};
        border-radius: 50% 0 50% 0;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 70}%;
        animation: floatLeaf ${Math.random() * 10 + 8}s ease-in-out infinite;
        animation-delay: ${Math.random() * 6}s;
      `;
      particleContainer.appendChild(leaf);
    }

    const style = document.createElement('style');
    style.textContent = `
      @keyframes floatLeaf {
        0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.3; }
        25% { transform: translate(20px, -20px) rotate(45deg); opacity: 0.7; }
        50% { transform: translate(-10px, -40px) rotate(90deg); opacity: 0.5; }
        75% { transform: translate(15px, -15px) rotate(135deg); opacity: 0.6; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ---------- SMOOTH SCROLL FOR ANCHOR LINKS ---------- */
  const NAV_HEIGHT = 72; // sticky nav height + padding
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---------- NAV ACTIVE STATE ON SCROLL ---------- */
  const sections = document.querySelectorAll('.section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');
  if (sections.length && navAnchors.length) {
    const setActive = () => {
      let current = '';
      sections.forEach(section => {
        const top = section.offsetTop - 100;
        if (window.scrollY >= top) current = section.getAttribute('id');
      });
      navAnchors.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${current}`
          ? 'var(--color-text)' : '';
      });
    };
    window.addEventListener('scroll', setActive, { passive: true });
  }

  /* ---------- SCROLL TO HASH ON DETAIL PAGES ---------- */
  if (window.location.hash && !isBackNav) {
    setTimeout(() => {
      const el = document.querySelector(window.location.hash);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 300);
  }

  /* ---------- 2026 CALENDAR ---------- */
  const calDates = document.getElementById('calDates');
  const calTitle = document.getElementById('calTitle');
  const calPrev = document.getElementById('calPrev');
  const calNext = document.getElementById('calNext');

  if (calDates && calTitle) {
    // 2026년 행사 일정 (month는 1-based)
    const events2026 = {
      '2026-01-17': '태기산 산행',
      '2026-02-21': '태백산 산행',
      '2026-03-14': '소래산 시산제',
      '2026-04-18': '가야산 산행',
      '2026-05-16': '관음봉 산행',
      '2026-06-19': '워크숍 (1일차)',
      '2026-06-20': '워크숍 (2일차)',
      '2026-07-18': '유명산 산행',
      '2026-08-27': '백두산 (1일차)',
      '2026-08-28': '백두산 (2일차)',
      '2026-08-29': '백두산 (3일차)',
      '2026-09-19': '민주지산 산행',
      '2026-10-17': '설악산 산행',
      '2026-11-21': '속리산 산행',
      '2026-12-19': '송년산행/송년회'
    };

    const today = new Date();
    // 2026년 범위 내로 제한
    let currentYear = 2026;
    let currentMonth = (today.getFullYear() === 2026) ? today.getMonth() : 0; // 0-based

    function renderCalendar(year, month) {
      const firstDay = new Date(year, month, 1).getDay(); // 0=일요일
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월',
                          '7월', '8월', '9월', '10월', '11월', '12월'];

      calTitle.textContent = `${year}년 ${monthNames[month]}`;
      calDates.innerHTML = '';

      // 빈 칸 (1일 이전)
      for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calDates.appendChild(empty);
      }

      // 날짜
      for (let d = 1; d <= daysInMonth; d++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        const dayOfWeek = new Date(year, month, d).getDay();

        if (dayOfWeek === 0) dayEl.classList.add('sunday');
        if (dayOfWeek === 6) dayEl.classList.add('saturday');

        // 오늘 표시
        if (year === today.getFullYear() &&
            month === today.getMonth() &&
            d === today.getDate()) {
          dayEl.classList.add('today');
        }

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const eventName = events2026[dateStr];

        dayEl.innerHTML = `<span>${d}</span>`;

        if (eventName) {
          dayEl.classList.add('has-event');
          const label = document.createElement('span');
          label.className = 'calendar-event-label';
          label.textContent = eventName;
          dayEl.appendChild(label);
        }

        calDates.appendChild(dayEl);
      }
    }

    renderCalendar(currentYear, currentMonth);

    calPrev.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      if (currentYear < 2026) { currentYear = 2026; currentMonth = 0; }
      renderCalendar(currentYear, currentMonth);
    });

    calNext.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      if (currentYear > 2026) { currentYear = 2026; currentMonth = 11; }
      renderCalendar(currentYear, currentMonth);
    });
  }

});
