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
})();
