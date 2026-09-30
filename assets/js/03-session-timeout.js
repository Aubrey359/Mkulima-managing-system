/* ================= SESSION TIMEOUT ================= */
function resetIdle() {
  clearTimeout(idleTimer);
  if (!session) return;
  idleTimer = setTimeout(function () {
    alert(
      LANG === 'sw' ? 'Umekaa bila shughuli. Ondoka kwa usalama.' : 'You were logged out due to inactivity.'
    );
    doLogout(true);
  }, IDLE_MIN * 60000);
  var el = document.getElementById('sessTimer');
  if (el) el.textContent = IDLE_MIN + 'min';
}
['click', 'keydown', 'mousemove', 'touchstart'].forEach(function (ev) {
  document.addEventListener(
    ev,
    function () {
      if (session) resetIdle();
    },
    { passive: true }
  );
});
