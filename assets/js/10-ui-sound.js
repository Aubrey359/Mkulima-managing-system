/* ================= UI SOUND ================= */
var SND = {
  on: localStorage.getItem('mk_snd') !== '0',
  hover: localStorage.getItem('mk_sndhov') === '1',
  vol: Number(localStorage.getItem('mk_sndvol') || '35'),
  ctx: null,
  last: 0
};
function sndCtx() {
  if (!SND.ctx) {
    try {
      SND.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  if (SND.ctx.state === 'suspended') SND.ctx.resume();
  return SND.ctx;
}
function beep(freq, dur, peak, type) {
  if (!SND.on) return;
  var c = sndCtx();
  if (!c) return;
  var g = c.createGain(),
    o = c.createOscillator();
  o.type = type || 'sine';
  o.frequency.value = freq;
  var v = Math.max(0, Math.min(1, SND.vol / 100)) * peak,
    t = c.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}
function sndClick() {
  beep(660, 0.055, 0.16, 'triangle');
}
function sndHover() {
  var n = Date.now();
  if (n - SND.last < 70) return;
  SND.last = n;
  beep(1180, 0.028, 0.045, 'sine');
}
function sndOk() {
  beep(720, 0.07, 0.16, 'triangle');
  setTimeout(function () {
    beep(1020, 0.1, 0.14, 'triangle');
  }, 70);
}
function sndWarn() {
  beep(300, 0.16, 0.18, 'square');
}
var SND_SEL =
  'button,.btn,.navItem,.tab,.roleBtn,.tutBtn,.tutDot,.tutSkip,.tutClose,.gsItem,.swatch,.cal .day,.remRow,.lgGo,.lgBack,.bellBtn,select,summary,a';
document.addEventListener(
  'pointerdown',
  function (e) {
    if (e.target.closest && e.target.closest(SND_SEL)) sndClick();
  },
  true
);
document.addEventListener(
  'pointerover',
  function (e) {
    if (!SND.hover) return;
    if (e.target.closest && e.target.closest(SND_SEL)) sndHover();
  },
  true
);
function sndSet(k, v) {
  SND[k] = v;
  localStorage.setItem(
    k === 'on' ? 'mk_snd' : k === 'hover' ? 'mk_sndhov' : 'mk_sndvol',
    k === 'vol' ? String(v) : v ? '1' : '0'
  );
  if (v && k !== 'vol') sndClick();
}
