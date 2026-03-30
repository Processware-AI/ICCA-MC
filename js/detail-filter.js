/* detail-filter.js — hash 기반으로 해당 섹션만 표시 */
(function () {
  var hash = location.hash.replace('#', '');
  if (!hash) return;

  var sections = document.querySelectorAll('.detail-section');
  if (!sections.length) return;

  sections.forEach(function (sec) {
    if (sec.id !== hash) {
      sec.style.display = 'none';
    }
  });

  /* 모든 자식 detail-section이 숨겨진 detail-content는 패딩 제거 */
  document.querySelectorAll('.detail-content').forEach(function (content) {
    var visible = content.querySelectorAll('.detail-section:not([style*="display: none"])');
    if (!visible.length) {
      content.style.display = 'none';
    }
  });
})();
