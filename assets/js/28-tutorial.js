/* ================= TUTORIAL ================= */
/* ================= GUIDE / TUTORIAL ================= */
var TUT = [
  {
    ic: 'sprout',
    tab: null,
    roles: ['loise', 'sales', 'sowing'],
    en: {
      t: 'Welcome to Mkulima Seedlings',
      lead: 'A short walkthrough of the system. It takes about a minute, and you can reopen it any time from Settings.',
      li: [
        'Everything you type saves by itself — there is no Save button for the whole system.',
        'A backup copy is kept automatically each time something changes.',
        'Use the menu on the left to move between sections.'
      ]
    },
    sw: {
      t: 'Karibu Mkulima Seedlings',
      lead: 'Mwongozo mfupi wa mfumo. Unachukua dakika moja, na unaweza kuufungua tena kwenye Mipangilio.',
      li: [
        'Kila unachoandika kinahifadhiwa chenyewe.',
        'Nakala ya akiba huhifadhiwa kila kitu kinapobadilika.',
        'Tumia menyu ya kushoto kuhama kati ya sehemu.'
      ]
    }
  },

  {
    ic: 'search',
    tab: null,
    roles: ['loise', 'sales'],
    en: {
      t: 'Find anything quickly',
      lead: 'The search box at the top of every page searches the whole system at once.',
      li: [
        'Type a customer name, a receipt number, or a phone number.',
        'Click a result to jump straight to it.'
      ]
    },
    sw: {
      t: 'Tafuta kwa haraka',
      lead: 'Kisanduku cha utafutaji juu ya kila ukurasa hutafuta mfumo mzima kwa pamoja.',
      li: ['Andika jina la mteja, namba ya risiti, au namba ya simu.', 'Bofya jibu ili kwenda moja kwa moja.']
    }
  },

  {
    ic: 'chart',
    tab: 'dash',
    roles: ['loise', 'sales'],
    en: {
      t: 'Dashboard',
      lead: 'Your first screen. It answers "how is the business doing this month?"',
      li: [
        'Money in and money out for the current month.',
        'How close you are to the monthly sales target.',
        'Who owes you money, and how much.',
        'Bookings waiting to be collected.'
      ]
    },
    sw: {
      t: 'Dashibodi',
      lead: 'Skrini ya kwanza. Inajibu "biashara inaendeleaje mwezi huu?"',
      li: [
        'Pesa zilizoingia na kutoka mwezi huu.',
        'Umefikia wapi kwenye lengo la mauzo.',
        'Nani anadaiwa, na kiasi gani.',
        'Bookings zinazosubiri kuchukuliwa.'
      ]
    }
  },

  {
    ic: 'receipt',
    tab: 'sales',
    roles: ['loise', 'sales'],
    en: {
      t: 'Recording a sale',
      lead: 'Every sale is recorded here, and the receipt prints on half an A4 page.',
      li: [
        'Type the customer name — if they are new, they are added automatically.',
        'Pick items from the catalogue, then change the price if that customer pays a special rate.',
        'Choose Cash, M-Pesa, Bank or Credit.',
        'Choose "Deliver later" if the customer is not taking the seedlings today.'
      ]
    },
    sw: {
      t: 'Kurekodi mauzo',
      lead: 'Kila mauzo yanarekodiwa hapa, na risiti inachapishwa kwenye nusu ya karatasi ya A4.',
      li: [
        'Andika jina la mteja — kama ni mpya, anaongezwa mwenyewe.',
        'Chagua bidhaa kutoka orodha, kisha badilisha bei kama mteja ana bei maalum.',
        'Chagua Cash, M-Pesa, Benki au Deni.',
        'Chagua "Deliver later" kama mteja hachukui miche leo.'
      ]
    }
  },

  {
    ic: 'calendar',
    tab: 'book',
    roles: ['loise', 'sales'],
    en: {
      t: 'Bookings',
      lead: 'For customers who order now and collect later.',
      li: [
        'Record the deposit they paid today.',
        'Set the date they will collect or you will deliver.',
        'A reminder appears when that date is near.',
        'If they ask to come another day, press Reschedule — do not delete the booking.'
      ]
    },
    sw: {
      t: 'Bookings',
      lead: 'Kwa wateja wanaoagiza sasa na kuchukua baadaye.',
      li: [
        'Rekodi amana waliyolipa leo.',
        'Weka tarehe watakapochukua au utakapopeleka.',
        'Kikumbusho kinaonekana tarehe inapokaribia.',
        'Wakiomba kuja siku nyingine, bonyeza Reschedule — usifute booking.'
      ]
    }
  },

  {
    ic: 'box',
    tab: 'inv',
    roles: ['loise', 'sales'],
    en: {
      t: 'Inventory',
      lead: 'What you physically have in the nursery: trays, seeds, cocopeat and ready seedlings.',
      li: [
        'Use Stock IN when goods arrive, Stock OUT when they leave without a sale.',
        'Selling an inventory item reduces its quantity by itself.'
      ]
    },
    sw: {
      t: 'Stoka',
      lead: 'Vitu ulivyo navyo kitaluni: trei, mbegu, cocopeat na miche tayari.',
      li: [
        'Tumia Stock IN vitu vinapofika, Stock OUT vinapotoka bila mauzo.',
        'Kuuza bidhaa ya stoka kunapunguza idadi chenyewe.'
      ]
    }
  },

  {
    ic: 'book',
    tab: 'cat',
    roles: ['loise', 'sales'],
    en: {
      t: 'Catalogue',
      lead: 'Your price list: every crop and variety with its normal price per seedling.',
      li: [
        'Use it at the till so prices stay the same for everyone.',
        'You can still type a different price on any sale line.',
        'Only Loise can add or change prices here.'
      ]
    },
    sw: {
      t: 'Orodha ya Miche',
      lead: 'Orodha ya bei: kila zao na aina yake na bei ya kawaida kwa mche.',
      li: [
        'Itumie wakati wa mauzo ili bei ziwe sawa kwa wote.',
        'Bado unaweza kuandika bei tofauti kwenye mauzo.',
        'Loise pekee anaweza kuongeza au kubadilisha bei.'
      ]
    }
  },

  {
    ic: 'sprout',
    tab: 'sow',
    roles: ['loise', 'sales', 'sowing'],
    en: {
      t: 'Sowing Book',
      lead: 'Every batch you plant is recorded here.',
      li: [
        'Record the variety, how many trays, the seed company and the seed expiry date.',
        'The system warns you when seeds are close to expiring.',
        'Tap any day on the calendar to see everything happening that day.',
        'When a batch is ready, press Ready to move it into stock.'
      ]
    },
    sw: {
      t: 'Kitabu cha Kupanda',
      lead: 'Kila kundi unalopanda linarekodiwa hapa.',
      li: [
        'Rekodi aina, trei ngapi, kampuni ya mbegu na tarehe ya mbegu kuisha.',
        'Mfumo unakuonya mbegu zinapokaribia kuisha.',
        'Bofya siku yoyote kwenye kalenda kuona yanayoendelea siku hiyo.',
        'Kundi likiwa tayari, bonyeza Ready ili liingie stoka.'
      ]
    }
  },

  {
    ic: 'users',
    tab: 'crm',
    roles: ['loise', 'sales'],
    en: {
      t: 'Customers',
      lead: 'Your regular buyers. People who bring their own seeds live in Propagation instead.',
      li: [
        'Search by name, phone or location.',
        'See what each customer last bought and what they paid.',
        'Print a statement showing what someone owes.',
        'Duplicate Detector finds the same customer entered twice.'
      ]
    },
    sw: {
      t: 'Wateja',
      lead: 'Wanunuzi wa kawaida. Wanaoleta mbegu zao wako kwenye Uzalishaji.',
      li: [
        'Tafuta kwa jina, simu au eneo.',
        'Angalia kila mteja alinunua nini mara ya mwisho.',
        'Chapisha taarifa ya deni.',
        'Duplicate Detector inapata mteja aliyeingizwa mara mbili.'
      ]
    }
  },

  {
    ic: 'leaf',
    tab: 'prop',
    roles: ['loise', 'sales'],
    en: {
      t: 'Propagation',
      lead: 'For customers who bring their own seeds for you to raise.',
      li: [
        'Record whose seeds they are, the variety and the expiry date.',
        'Set the fee per seedling — the total works itself out.',
        'Move each job along: Sown, then Ready, then Collected.',
        'Print a job slip for the customer.'
      ]
    },
    sw: {
      t: 'Uzalishaji wa Miche',
      lead: 'Kwa wateja wanaoleta mbegu zao ili uwaoteshee.',
      li: [
        'Rekodi mbegu ni za nani, aina na tarehe ya kuisha.',
        'Weka ada kwa kila mche — jumla inajihesabu.',
        'Sogeza kazi: Sown, kisha Ready, kisha Collected.',
        'Chapisha karatasi ya kazi kwa mteja.'
      ]
    }
  },

  {
    ic: 'sack',
    tab: 'man',
    roles: ['loise', 'sales'],
    en: {
      t: 'Manure',
      lead: 'Goat manure is sold from the Sales tab like anything else. This tab shows only manure.',
      li: [
        'Switch between one day and a whole month.',
        'See sacks sold, money made and who bought the most.',
        'Print the report for your records.'
      ]
    },
    sw: {
      t: 'Mbolea',
      lead: 'Mbolea ya mbuzi inauzwa kwenye Mauzo. Kichupo hiki kinaonyesha mbolea pekee.',
      li: [
        'Badilisha kati ya siku moja na mwezi mzima.',
        'Ona magunia yaliyouzwa, pesa na nani alinunua zaidi.',
        'Chapisha ripoti kwa kumbukumbu.'
      ]
    }
  },

  {
    ic: 'bell',
    tab: null,
    roles: ['loise', 'sales', 'sowing'],
    en: {
      t: 'Reminders',
      lead: 'The bell at the top counts anything that needs attention.',
      li: [
        'Collections and deliveries coming up.',
        'Seedlings and propagation jobs close to ready.',
        'Red means it is due today or already late.',
        'Tap any reminder to jump to it.'
      ]
    },
    sw: {
      t: 'Vikumbusho',
      lead: 'Kengele ya juu inahesabu vitu vinavyohitaji uangalizi.',
      li: [
        'Vitu vya kuchukuliwa na kupelekwa.',
        'Miche na kazi za uzalishaji zinazokaribia kuwa tayari.',
        'Nyekundu ina maana ni ya leo au imechelewa.',
        'Bofya kikumbusho ili kwenda.'
      ]
    }
  },

  {
    ic: 'money',
    tab: 'acc',
    roles: ['loise'],
    en: {
      t: 'Accounting',
      lead: 'Where the money went and where it came from.',
      li: ['Record income and expenses as they happen.', 'See how much each person sold this month.']
    },
    sw: {
      t: 'Uhasibu',
      lead: 'Pesa zilikotoka na zilikoenda.',
      li: ['Rekodi mapato na matumizi yanapotokea.', 'Ona kila mtu aliuza kiasi gani mwezi huu.']
    }
  },

  {
    ic: 'helmet',
    tab: 'emp',
    roles: ['loise'],
    en: {
      t: 'Employees',
      lead: 'Staff records, salaries, and loans. Only Loise can open this.',
      li: [
        'Ranks are Sales, Marketing, Sowing and Others.',
        'Give a loan and set how much to take off each month.',
        'Press Pay salary and the deduction is taken off automatically.',
        'A payslip prints, and the loan balance goes down by itself.'
      ]
    },
    sw: {
      t: 'Wafanyakazi',
      lead: 'Rekodi za wafanyakazi, mishahara na mikopo. Loise pekee anaweza kufungua.',
      li: ['Vyeo ni Sales, Marketing, Sowing na Others.', 'Rekodi mkopo na salio linafuatiliwa.']
    }
  },

  {
    ic: 'clock',
    tab: 'att',
    roles: ['loise', 'sales'],
    en: {
      t: 'Attendance',
      lead: 'Who came to work, and when.',
      li: [
        'Mark each person Present, Absent or on Leave.',
        'Present also records time in and time out.',
        'Press Edit to correct a time you entered wrongly.'
      ]
    },
    sw: {
      t: 'Mahudhurio',
      lead: 'Nani alikuja kazini, na saa ngapi.',
      li: [
        'Weka kila mtu Yupo, Hayupo au Likizo.',
        'Yupo pia inarekodi saa ya kuingia na kutoka.',
        'Bonyeza Edit kurekebisha saa uliyokosea.'
      ]
    }
  },

  {
    ic: 'trend-up',
    tab: 'rep',
    roles: ['loise', 'sales'],
    en: {
      t: 'Reports',
      lead: 'Printable summaries, ready in one click.',
      li: [
        'The daily Z-summary closes off the day.',
        'Price list, customer statements and stock reports print from here.'
      ]
    },
    sw: {
      t: 'Ripoti',
      lead: 'Muhtasari wa kuchapisha, tayari kwa bonyezo moja.',
      li: ['Muhtasari wa siku (Z) unafunga siku.', 'Orodha ya bei, taarifa za wateja na ripoti za stoka.']
    }
  },

  {
    ic: 'gear',
    tab: 'set',
    roles: ['loise'],
    en: {
      t: 'Settings and safety',
      lead: 'Set the system up the way you want it, and keep the data safe.',
      li: [
        'Change passwords, colours, fonts and where the menu sits.',
        'Set the monthly sales target shown on the Dashboard.',
        'Download a backup — do this once a month.',
        'The Audit Trail shows who did what and when.'
      ]
    },
    sw: {
      t: 'Mipangilio na usalama',
      lead: 'Panga mfumo unavyotaka, na linda taarifa.',
      li: [
        'Badilisha nenosiri, rangi, fonti na mahali pa menyu.',
        'Weka lengo la mauzo la mwezi.',
        'Pakua backup — fanya mara moja kwa mwezi.',
        'Audit Trail inaonyesha nani alifanya nini.'
      ]
    }
  }
];
var tI = 0,
  TUTQ = [],
  TUT_PARK = null;
function tutList() {
  var r = session ? session.role : 'loise';
  return TUT.filter(function (s) {
    return s.roles.indexOf(r) >= 0;
  });
}
function startTut() {
  TUTQ = tutList();
  TUT_PARK = null;
  var rp = document.getElementById('tutResume');
  if (rp) rp.style.display = 'none';
  tI = 0;
  document.getElementById('tutWrap').style.display = 'flex';
  showTut();
}
function showTut() {
  if (!TUTQ.length) TUTQ = tutList();
  var s = TUTQ[tI],
    c = s[LANG === 'sw' ? 'sw' : 'en'];
  document.getElementById('tutIcon').innerHTML = '<svg class="ic"><use href="#i-' + s.ic + '"/></svg>';
  document.getElementById('tutTitle').textContent = c.t;
  document.getElementById('tutStepNo').textContent =
    (LANG === 'sw' ? 'Hatua ' : 'Step ') + (tI + 1) + (LANG === 'sw' ? ' kati ya ' : ' of ') + TUTQ.length;
  document.getElementById('tutLead').textContent = c.lead;
  document.getElementById('tutList').innerHTML = c.li
    .map(function (x) {
      return '<li>' + esc(x) + '</li>';
    })
    .join('');
  document.getElementById('tutFill').style.width = Math.round(((tI + 1) / TUTQ.length) * 100) + '%';
  document.getElementById('tutDots').innerHTML = TUTQ.map(function (x, i) {
    return (
      '<button class="tutDot' +
      (i === tI ? ' on' : '') +
      (i < tI ? ' done' : '') +
      '" onclick="tutJump(' +
      i +
      ')" title="' +
      esc(x[LANG === 'sw' ? 'sw' : 'en'].t) +
      '"></button>'
    );
  }).join('');
  var go = document.getElementById('tutGo');
  if (s.tab && session && ROLES[session.role].nav.indexOf(s.tab) >= 0) {
    go.style.display = '';
    go.setAttribute('data-tab', s.tab);
    go.textContent = LANG === 'sw' ? 'Nionyeshe' : 'Show me';
  } else go.style.display = 'none';
  document.getElementById('tutBack').style.visibility = tI === 0 ? 'hidden' : 'visible';
  document.getElementById('tutNext').textContent =
    tI === TUTQ.length - 1 ? (LANG === 'sw' ? 'Nimemaliza' : 'Done') : LANG === 'sw' ? 'Endelea' : 'Next';
}
function tutJump(i) {
  tI = i;
  showTut();
}
function tutStep(d) {
  tI += d;
  if (tI >= TUTQ.length) {
    skipTut();
    return;
  }
  if (tI < 0) tI = 0;
  showTut();
}
function tutShowMe() {
  var t = document.getElementById('tutGo').getAttribute('data-tab');
  TUT_PARK = tI;
  document.getElementById('tutWrap').style.display = 'none';
  if (t) go(t);
  tutPill();
}
function tutPill() {
  var el = document.getElementById('tutResume');
  if (!el) return;
  if (TUT_PARK === null) {
    el.style.display = 'none';
    return;
  }
  var s = TUTQ[TUT_PARK],
    c = s ? s[LANG === 'sw' ? 'sw' : 'en'] : null;
  document.getElementById('tutResumeTxt').textContent =
    LANG === 'sw' ? 'Endelea mwongozo' : 'Continue the guide';
  document.getElementById('tutResumeSub').textContent =
    (LANG === 'sw' ? 'Hatua ' : 'Step ') +
    (TUT_PARK + 1) +
    (LANG === 'sw' ? ' kati ya ' : ' of ') +
    TUTQ.length +
    (c ? ' \u00b7 ' + c.t : '');
  el.style.display = 'flex';
}
function tutResume() {
  if (TUT_PARK === null) {
    startTut();
    return;
  }
  tI = TUT_PARK;
  TUT_PARK = null;
  document.getElementById('tutResume').style.display = 'none';
  document.getElementById('tutWrap').style.display = 'flex';
  showTut();
}
function tutResumeNext() {
  if (TUT_PARK === null) return;
  tI = TUT_PARK;
  TUT_PARK = null;
  document.getElementById('tutResume').style.display = 'none';
  document.getElementById('tutWrap').style.display = 'flex';
  tutStep(1);
}
function tutDismissPill() {
  TUT_PARK = null;
  document.getElementById('tutResume').style.display = 'none';
  localStorage.setItem('mk_tut_done_v3', '1');
}
function skipTut() {
  TUT_PARK = null;
  document.getElementById('tutWrap').style.display = 'none';
  var el = document.getElementById('tutResume');
  if (el) el.style.display = 'none';
  localStorage.setItem('mk_tut_done_v3', '1');
}
document.addEventListener('keydown', function (e) {
  if (document.getElementById('tutWrap').style.display !== 'flex') return;
  if (e.key === 'Escape') skipTut();
  else if (e.key === 'ArrowRight') tutStep(1);
  else if (e.key === 'ArrowLeft' && tI > 0) tutStep(-1);
});
