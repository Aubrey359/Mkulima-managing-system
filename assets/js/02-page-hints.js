/* ================= PAGE HINTS ================= */
var HINTS = {
  dash: 'Money in vs out this month, your team\u2019s sales performance, credit customers owe, and pending bookings \u2014 all at a glance.',
  sales:
    'Record direct (walk-in) sales here \u2014 add a new customer on the spot, apply discounts or VAT, and the receipt prints automatically. Use the Order Book tab to search orders, settle credit payments, print receipts again, and flag orders that need follow-up when a worker is away.',
  book: 'Customers who reserve seedlings and pick up later. Track deposits and balances, mark them Ready, then Picked when they collect.',
  inv: 'Everything you have in stock. Add new items and use + In / \u2212 Out to adjust quantities after stock takes or losses.',
  sow: 'Record what was planted, when, and how much. The calendar shows when each variety will be ready and which customers are coming to pick up.',
  crm: 'Your customer directory: contacts, what they grow, their personal price history, follow-up tasks, and printable statements of what they owe.',
  cat: 'Every seedling variety grouped by crop with its standard price per seedling (KES). Use it at the till, and type a custom price on any sale line when a customer has a special rate.',
  prop: 'For customers who bring their own seeds: record the job, seed source and expiry, fee per seedling, payments, and track Sown to Ready to Collected. Kept separate from your regular customers.',
  man: 'Goat manure (KES 500 per sack) sales analytics, kept apart from seedlings. Switch between one day and a whole month to see sacks sold, money made, payment methods and top buyers, then print the report. Any sale line with the word manure in its name is counted.',
  acc: 'Record income and expenses, and see how much each employee sold this month.',
  emp: 'Staff profiles with ranks and salaries, plus loans and advances. Only Loise can manage this page.',
  att: 'Mark each worker Present, on Leave or Absent each day. History is printable for payroll.',
  purch: 'Keep your suppliers here. Recording a purchase automatically adds the stock to inventory.',
  rep: 'One-click printable reports \u2014 sales, profit & loss, stock, expenses, attendance, and the daily Z-summary (end-of-day totals by payment method).',
  set: 'Change passwords, switch the appearance theme, download backups, restore data, and set the auto-logout timer.'
};
function hint(id) {
  return (
    '<div class="pageHint"><svg class="ic"><use href="#i-bulb"/></svg> <b>' +
    t(id) +
    ':</b> ' +
    HINTS[id] +
    '</div>'
  );
}
