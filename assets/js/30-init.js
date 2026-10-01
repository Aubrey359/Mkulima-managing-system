/* ================= INIT ================= */
loadDB();
buildLogin();
var mk_theme = localStorage.getItem('mk_theme') || 'green';
document.body.setAttribute('data-theme', mk_theme === 'green' ? '' : mk_theme);
// Resume the signed-in account. Without internet, carry on with this device's copy and sync later.
function bootSession() {
  var saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(SES_KEY));
  } catch (e) {}
  var offline = function () {
    if (saved && ROLES[saved.role]) {
      session = saved;
      enterApp();
      syncShow('offline');
    } else {
      localStorage.removeItem(SES_KEY);
      if (!SB || navigator.onLine === false) document.getElementById('loginErr').textContent = NO_NET;
    }
  };
  if (!sbInit()) {
    offline();
    return;
  }
  SB.auth.getSession().then(
    function (res) {
      var s = res && res.data && res.data.session,
        u = s && s.user,
        r = u && (u.app_metadata || {}).role;
      if (r && ROLES[r] && !(u.user_metadata || {}).must_change) {
        if (!session) {
          session = sessFor(r);
          localStorage.setItem(SES_KEY, JSON.stringify(session));
          localStorage.setItem(SYNC_ROLE_KEY, r);
          enterApp();
        }
        syncStart();
      } else if (navigator.onLine === false && !session) offline();
      else if (session) doLogout(true);
      else localStorage.removeItem(SES_KEY);
    },
    function () {
      if (!session) offline();
    }
  );
}
window.addEventListener('online', function () {
  if (session && !SYNC.started) bootSession();
});
bootSession();

// Keep a copy of the app on this device so it opens without internet (only on a web address, not a local file)
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
}
