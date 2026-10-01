/* ================= LOGIN ================= */
var ROLE_IC = { loise: 'crown', sales: 'receipt', sowing: 'sprout' };
function buildLogin() {
  var h = '';
  Object.keys(ROLES).forEach(function (r) {
    var R = ROLES[r];
    h +=
      '<button class="roleBtn" onclick="pickRole(\'' +
      r +
      '\')"><span class="rIc"><svg class="ic"><use href="#i-' +
      (ROLE_IC[r] || 'users') +
      '"/></svg></span><span>' +
      R.label +
      '</span><span class="rGo"><svg class="ic"><use href="#i-chevron"/></svg></span></button>';
  });
  document.getElementById('roleBtns').innerHTML = h;
}
var pendingRole = null;
function sessFor(r) {
  return { role: r, u: r === 'loise' ? 'Loise' : r === 'sales' ? 'Sales Team' : 'Sowing Team' };
}
// Sowing Team has no password for the workers: the app signs in for them with this fixed
// credential. The server only lets this account see sowing-related data (no customers or sales).
var SOWING_OPEN_PW = 'mkulima-sowing-open';
function pickRole(r) {
  if (r === 'sowing') return openSignIn(r);
  pendingRole = r;
  document.getElementById('loginErr').textContent = '';
  document.getElementById('lgStepRole').style.display = 'none';
  document.getElementById('pwBox').style.display = 'block';
  document.getElementById('pwLabel').textContent = ROLES[r].label;
  var pi = document.getElementById('pw_input');
  pi.value = '';
  pi.type = 'password';
  document.getElementById('pwEye').textContent = 'SHOW';
  setTimeout(function () {
    pi.focus();
  }, 50);
}
function togglePw() {
  var i = document.getElementById('pw_input'),
    show = i.type === 'password';
  i.type = show ? 'text' : 'password';
  document.getElementById('pwEye').textContent = show ? 'HIDE' : 'SHOW';
  i.focus();
}
function backToRoles() {
  pendingRole = null;
  document.getElementById('pwBox').style.display = 'none';
  document.getElementById('pwNewBox').style.display = 'none';
  document.getElementById('lgStepRole').style.display = 'block';
  document.getElementById('loginErr').textContent = '';
}
var NO_NET = 'No internet connection — connect to the internet to sign in.';
function netErr(e) {
  return !e || /fetch|network|load failed|timed? ?out/i.test(e.message || String(e));
}
function openSignIn(r) {
  var le = document.getElementById('loginErr');
  pendingRole = null;
  if (!sbInit()) {
    le.textContent = NO_NET;
    return;
  }
  le.textContent = 'Signing in…';
  SB.auth.signInWithPassword({ email: ROLE_EMAIL[r], password: SOWING_OPEN_PW }).then(
    function (res) {
      var u = res.data && (res.data.user || (res.data.session && res.data.session.user));
      if (res.error || !u || (u.app_metadata || {}).role !== r) {
        sndWarn();
        le.textContent =
          res.error && res.error.status !== 400 && netErr(res.error)
            ? 'Cannot reach the server — check the internet connection'
            : 'Could not open ' + ROLES[r].label + ' — please tell the office';
        return;
      }
      le.textContent = '';
      finishLogin(r);
    },
    function () {
      le.textContent = 'Cannot reach the server — check the internet connection';
    }
  );
}
function submitPass() {
  if (!pendingRole) return;
  var r = pendingRole,
    pi = document.getElementById('pw_input'),
    p = (pi.value || '').trim(),
    le = document.getElementById('loginErr');
  if (!p) return;
  if (!sbInit()) {
    le.textContent = NO_NET;
    return;
  }
  le.textContent = 'Signing in…';
  SB.auth.signInWithPassword({ email: ROLE_EMAIL[r], password: p }).then(
    function (res) {
      if (res.error || !res.data || !res.data.session) {
        sndWarn();
        le.textContent =
          res.error && res.error.status !== 400 && netErr(res.error)
            ? 'Cannot reach the server — check the internet connection'
            : LANG === 'sw'
              ? t('wrongpass')
              : 'Wrong password — please try again';
        pi.value = '';
        pi.focus();
        return;
      }
      var u = res.data.user || res.data.session.user;
      if ((u.app_metadata || {}).role !== r) {
        SB.auth.signOut({ scope: 'local' });
        le.textContent = 'This account is not set up for ' + ROLES[r].label;
        return;
      }
      if ((u.user_metadata || {}).must_change) {
        showNewPw();
        return;
      }
      finishLogin(r);
    },
    function () {
      le.textContent = 'Cannot reach the server — check the internet connection';
    }
  );
}
function pwProblem(p1, p2) {
  if (p1.length < 6) return 'Password must be at least 6 characters';
  if (p1 !== p2) return 'The two passwords do not match';
  return '';
}
function showNewPw() {
  document.getElementById('pwBox').style.display = 'none';
  document.getElementById('pwNewBox').style.display = 'block';
  document.getElementById('loginErr').textContent = '';
  document.getElementById('pwNew1').value = '';
  document.getElementById('pwNew2').value = '';
  setTimeout(function () {
    document.getElementById('pwNew1').focus();
  }, 50);
}
function submitNewPw() {
  if (!pendingRole) return;
  var r = pendingRole,
    le = document.getElementById('loginErr'),
    p1 = document.getElementById('pwNew1').value.trim(),
    p2 = document.getElementById('pwNew2').value.trim(),
    err = pwProblem(p1, p2);
  if (!err && p1 === document.getElementById('pw_input').value.trim())
    err = 'Choose a password different from the starter one';
  if (err) {
    sndWarn();
    le.textContent = err;
    return;
  }
  le.textContent = 'Saving…';
  SB.rpc('set_role_password', { target_role: r, new_password: p1 })
    .then(function (res) {
      if (res.error) throw res.error;
      return SB.auth.refreshSession();
    })
    .then(
      function () {
        finishLogin(r, 'Replaced starter password (' + ROLES[r].label + ')');
      },
      function (e) {
        sndWarn();
        le.textContent = netErr(e)
          ? 'Cannot reach the server — check the internet connection'
          : e.message || 'Could not save the password';
      }
    );
}
// Signed in: if a different role used this device before, clear its copy (unless it has changes not uploaded yet)
function finishLogin(r, note) {
  var prev = localStorage.getItem(SYNC_ROLE_KEY);
  if (prev && prev !== r && !syncPendingKeys(prev).length) syncWipeLocal();
  localStorage.setItem(SYNC_ROLE_KEY, r);
  session = sessFor(r);
  localStorage.setItem(SES_KEY, JSON.stringify(session));
  if (note) logAudit(note);
  sndOk();
  enterApp();
  syncStart();
}
function changePwFromSettings() {
  var r = cp_r.value,
    p1 = cp_p.value.trim(),
    p2 = cp_p2.value.trim(),
    err = pwProblem(p1, p2);
  if (err) {
    alert(err);
    return;
  }
  if (!sbInit()) {
    alert(NO_NET);
    return;
  }
  SB.rpc('set_role_password', { target_role: r, new_password: p1 })
    .then(function (res) {
      if (res.error) throw res.error;
      logAudit('Changed password (' + ROLES[r].label + ')');
      saveDB();
      cp_p.value = '';
      cp_p2.value = '';
      alert('Password updated for ' + ROLES[r].label + '. Use the new password on every device from now on.');
    })
    .catch(function (e) {
      alert(netErr(e) ? NO_NET : 'Could not change the password: ' + (e.message || e));
    });
}
function logout() {
  openModal(
    '<h3><svg class="ic"><use href="#i-power"/></svg> Log Out</h3><p style="margin:10px 0">' +
      (LANG === 'sw' ? 'Una uhakika unataka kutoka?' : 'Are you sure you want to log out?') +
      '</p><div class="rowflex mt"><button class="btn red" onclick="closeModal();doLogout()"><svg class="ic"><use href="#i-power"/></svg> ' +
      (LANG === 'sw' ? 'Toka' : 'Log Out') +
      '</button><button class="btn gray" onclick="closeModal()">' +
      (LANG === 'sw' ? 'Ghairi' : 'Cancel') +
      '</button></div>'
  );
}
// Upload what we can first; changes that could not be uploaded stay on this device
function doLogout(force) {
  syncStop();
  var done = function () {
    session = null;
    localStorage.removeItem(SES_KEY);
    var fin = function () {
      location.reload();
    };
    if (SB) SB.auth.signOut({ scope: 'local' }).then(fin, fin);
    else fin();
  };
  if (!SB || !session) {
    done();
    return;
  }
  syncPush()
    .catch(function () {})
    .then(function () {
      var n = syncPendingKeys().length;
      if (
        n &&
        !force &&
        !confirm(
          n +
            ' change' +
            (n > 1 ? 's have' : ' has') +
            ' not been uploaded yet (no internet?). They stay saved on this device and upload the next time someone signs in here. Log out anyway?'
        )
      ) {
        syncStart();
        return;
      }
      done();
    });
}

function enterApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  logAudit('Logged in');
  saveDB();
  applyNavPos(localStorage.getItem('mk_navpos') || 'left');
  applyFont(localStorage.getItem('mk_font') || 'default');
  applySidebarHidden();
  document.getElementById('whoUser').textContent = session.u;
  document.getElementById('whoRole').textContent = ROLES[session.role].label;
  buildNav();
  applyLang();
  go(ROLES[session.role].nav[0]);
  resetIdle();
  remStart();
  if (!localStorage.getItem('mk_tut_done_v3')) startTut();
}
