// ═══════════════════════════════════════════════════════════════
// Haus Ledger — Dashboard Stats Module
// Renders live data on the main Dashboard section
// ═══════════════════════════════════════════════════════════════

let _dashStatsInitialized = false;

async function loadDashboardStats() {
  const user = await getUser();
  if (!user) return;

  // Load ALL transactions for dashboard
  const { data: allTx, error } = await sb
    .from('transactions')
    .select('*, category:categories(id, name, color)')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Dashboard stats error:', error.message);
    return;
  }

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthTx = (allTx || []).filter(t => t.date.startsWith(thisMonth));
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const profit = income - expenses;
  const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : '0';
  const expenseCount = monthTx.filter(t => t.type === 'expense').length;

  // Pending invoices
  const pendingInvoices = (_invoices || []).filter(i => ['sent', 'viewed', 'overdue'].includes(i.status));
  const pendingTotal = pendingInvoices.reduce((s, i) => s + Number(i.total), 0);
  const pendingCount = pendingInvoices.length;

  // Update hero stats
  const el = (id, text) => { const e = document.getElementById(id); if (e) e.textContent = text; };

  el('dashIncomeValue', '$' + fmtMoney(income));
  el('dashIncomeTrend', income > 0 ? 'This month' : '');
  el('dashIncomeNote', income > 0
    ? `${monthTx.filter(t => t.type === 'income').length} payment${monthTx.filter(t => t.type === 'income').length !== 1 ? 's' : ''} received this month.`
    : 'No income recorded this month yet.');

  el('dashPendingValue', '$' + fmtMoney(pendingTotal));
  el('dashPendingTrend', pendingCount > 0 ? `${pendingCount} invoice${pendingCount !== 1 ? 's' : ''} open` : '');
  el('dashPendingNote', pendingCount > 0
    ? `${pendingCount} outstanding invoice${pendingCount !== 1 ? 's' : ''} awaiting payment.`
    : 'All invoices are paid or no invoices sent yet.');

  el('dashExpensesValue', '$' + fmtMoney(expenses));
  el('dashExpensesTrend', expenseCount > 0 ? `${expenseCount} items` : '');
  el('dashExpensesNote', expenses > 0
    ? `${expenseCount} expense${expenseCount !== 1 ? 's' : ''} logged this month.`
    : 'No expenses logged this month yet.');

  el('dashProfitValue', '$' + fmtMoney(profit));
  el('dashProfitTrend', income > 0 ? `${margin}% margin` : '');
  el('dashProfitNote', income > 0
    ? `Income minus expenses this month.`
    : 'Profit will show once income is recorded.');
}

function fmtMoney(n) {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function initDashboardStats() {
  if (_dashStatsInitialized) return;
  _dashStatsInitialized = true;
  loadDashboardStats();
}
