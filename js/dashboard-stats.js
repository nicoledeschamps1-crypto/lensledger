// ═══════════════════════════════════════════════════════════════
// Haus Ledger — Dashboard Stats Module
// All dashboard widgets wired to real Supabase data
// ═══════════════════════════════════════════════════════════════

let _dashStatsInitialized = false;
let _allTransactions = [];

async function loadDashboardStats() {
  const user = await getUser();
  if (!user) return;

  // Load ALL transactions
  const { data: allTx } = await sb
    .from('transactions')
    .select('*, category:categories(id, name, color)')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  _allTransactions = allTx || [];

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTx = _allTransactions.filter(t => t.date.startsWith(thisMonth));

  renderHeroStats(monthTx);
  renderReviewChecklist(user.id);
  renderQuickLogGrid();
  renderDonutChart(monthTx);
  renderActivityList();
  renderTrendBars();
  renderRecentClientsMini();
  renderTaxSnapshotMini(monthTx);
  renderRecurringList(user.id);
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const overdue = (_invoices || []).filter(i => i.status === 'overdue').length;
  const missingReceipts = _allTransactions.filter(t => t.type === 'expense' && (!t.receipts || t.receipts.length === 0)).length;
  const total = overdue + (missingReceipts > 0 ? 1 : 0); // count missing receipts as 1 notification

  const badge = document.getElementById('notifBadge');
  if (badge) {
    if (total > 0) {
      badge.textContent = total;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }
}

// ─── Hero Stats ─────────────────────────────────────────────

function renderHeroStats(monthTx) {
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const profit = income - expenses;
  const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : '0';
  const expenseCount = monthTx.filter(t => t.type === 'expense').length;

  const pendingInvoices = (_invoices || []).filter(i => ['sent', 'viewed', 'overdue'].includes(i.status));
  const pendingTotal = pendingInvoices.reduce((s, i) => s + Number(i.total), 0);
  const pendingCount = pendingInvoices.length;

  const el = (id, text) => { const e = document.getElementById(id); if (e) e.textContent = text; };

  el('dashIncomeValue', '$' + fmtMoney(income));
  el('dashIncomeTrend', income > 0 ? 'This month' : '');
  el('dashIncomeNote', income > 0
    ? `${monthTx.filter(t => t.type === 'income').length} payment(s) received this month.`
    : 'No income recorded this month yet.');

  el('dashPendingValue', '$' + fmtMoney(pendingTotal));
  el('dashPendingTrend', pendingCount > 0 ? `${pendingCount} open` : '');
  el('dashPendingNote', pendingCount > 0
    ? `${pendingCount} outstanding invoice(s) awaiting payment.`
    : 'All invoices paid or none sent yet.');

  el('dashExpensesValue', '$' + fmtMoney(expenses));
  el('dashExpensesTrend', expenseCount > 0 ? `${expenseCount} items` : '');
  el('dashExpensesNote', expenses > 0
    ? `${expenseCount} expense(s) logged this month.`
    : 'No expenses logged this month yet.');

  el('dashProfitValue', '$' + fmtMoney(profit));
  el('dashProfitTrend', income > 0 ? `${margin}% margin` : '');
  el('dashProfitNote', 'Income minus expenses this month.');
}

// ─── Weekly Review (persisted to localStorage) ──────────────

function renderReviewChecklist(userId) {
  const el = document.getElementById('reviewChecklist');
  if (!el) return;

  const storageKey = `haus-review-${userId}-${weekKey()}`;
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');

  const tasks = [
    { id: 'review-bank', title: 'Review new expenses', desc: 'Check and categorize recent entries.' },
    { id: 'match-receipts', title: 'Match receipts', desc: 'Attach photos to unmatched expenses.' },
    { id: 'send-invoices', title: 'Follow up on invoices', desc: 'Check pending and overdue invoices.' },
    { id: 'tax-setaside', title: 'Set aside for taxes', desc: 'Transfer to savings based on your rate.' },
    { id: 'schedule-admin', title: 'Schedule next admin block', desc: 'Book time for next week.' }
  ];

  const checkedCount = tasks.filter(t => saved[t.id]).length;

  el.innerHTML = tasks.map(t => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
      <input type="checkbox" ${saved[t.id] ? 'checked' : ''}
        onchange="toggleReviewItem('${storageKey}', '${t.id}', this.checked)"
        style="margin-top:3px;width:18px;height:18px;accent-color:#7c6df0;cursor:pointer;">
      <div style="flex:1;">
        <strong style="font-size:13px;${saved[t.id] ? 'text-decoration:line-through;opacity:0.5;' : ''}">${escapeHtml(t.title)}</strong>
        <div style="font-size:12px;color:var(--dim);">${escapeHtml(t.desc)}</div>
      </div>
    </div>
  `).join('');

  // Update pills
  const countPill = document.getElementById('reviewCountPill');
  if (countPill) countPill.textContent = `${checkedCount} / ${tasks.length} complete`;

  const progressBar = document.getElementById('reviewProgressBar');
  if (progressBar) progressBar.style.width = `${(checkedCount / tasks.length) * 100}%`;

  const metaCopy = document.getElementById('reviewMetaCopy');
  if (metaCopy) {
    const left = tasks.length - checkedCount;
    metaCopy.textContent = left === 0 ? 'All done this week!' : `${left} task${left !== 1 ? 's' : ''} left for this week.`;
  }

  // Update streak in topbar
  updateStreakDisplay(userId);
}

function updateStreakDisplay(userId) {
  let streak = 0;
  const now = new Date();
  // Count consecutive past weeks where all 5 tasks were checked
  for (let w = 0; w < 52; w++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (w * 7));
    const start = new Date(d.getFullYear(), 0, 1);
    const wk = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
    const key = `haus-review-${userId}-${d.getFullYear()}-W${wk}`;
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    const done = Object.values(saved).filter(Boolean).length;
    if (w === 0) {
      // Current week: count if any progress
      if (done > 0) streak++;
      continue;
    }
    if (done >= 5) { streak++; } else { break; }
  }

  const streakText = document.getElementById('streakText');
  const streakDetail = document.getElementById('streakDetail');
  if (streakText) streakText.textContent = streak > 0 ? `🔥 ${streak} week streak` : '📋 Start your streak';
  if (streakDetail) streakDetail.textContent = streak > 0 ? 'Weekly reviews completed' : 'Complete this week\'s review';
}

function toggleReviewItem(storageKey, itemId, checked) {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  saved[itemId] = checked;
  localStorage.setItem(storageKey, JSON.stringify(saved));
  // Re-render to update counts
  getUser().then(u => { if (u) renderReviewChecklist(u.id); });
}

function weekKey() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

// ─── Quick Log Grid ─────────────────────────────────────────

function renderQuickLogGrid() {
  const el = document.getElementById('quickLogGrid');
  if (!el) return;

  const quickCategories = (_categories || []).filter(c => c.type === 'expense').slice(0, 6);

  el.innerHTML = quickCategories.map(cat => `
    <button type="button" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;background:var(--surface-raised);border:1px solid var(--border);border-radius:12px;cursor:pointer;color:var(--text);transition:all 180ms;"
      onmouseover="this.style.transform='translateY(-2px)';this.style.borderColor='var(--border-strong)'"
      onmouseout="this.style.transform='';this.style.borderColor='var(--border)'"
      onclick="document.querySelector('[data-section-trigger=expenses]').click()">
      <strong style="font-size:13px;">${escapeHtml(cat.name)}</strong>
    </button>
  `).join('');

  if (quickCategories.length === 0) {
    el.innerHTML = '<div style="padding:16px;text-align:center;color:var(--dim);font-size:13px;grid-column:1/-1;">Categories will appear here once loaded.</div>';
  }
}

// ─── Donut Chart ────────────────────────────────────────────

function renderDonutChart(monthTx) {
  const legendEl = document.getElementById('donutLegend');
  if (!legendEl) return;

  const expenseTx = monthTx.filter(t => t.type === 'expense' && t.category);
  const byCategory = {};
  for (const t of expenseTx) {
    const name = t.category.name;
    const color = t.category.color;
    if (!byCategory[name]) byCategory[name] = { name, color, total: 0 };
    byCategory[name].total += Math.abs(Number(t.amount));
  }

  const sorted = Object.values(byCategory).sort((a, b) => b.total - a.total).slice(0, 5);
  const grandTotal = sorted.reduce((s, c) => s + c.total, 0);

  // Update SVG ring segments dynamically
  const svgEl = document.querySelector('.donut-chart svg');
  if (svgEl) {
    const r = 72;
    const circumference = 2 * Math.PI * r;
    let circles = `<circle cx="98" cy="98" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="18"></circle>`;
    let offset = 0;
    for (const c of sorted) {
      const arcLen = grandTotal > 0 ? (c.total / grandTotal) * circumference : 0;
      if (arcLen > 0) {
        circles += `<circle cx="98" cy="98" r="${r}" fill="none" stroke="${c.color}" stroke-width="18" stroke-linecap="round" stroke-dasharray="${arcLen} ${circumference}" stroke-dashoffset="${-offset}"></circle>`;
        offset += arcLen + 4; // small gap between segments
      }
    }
    svgEl.innerHTML = circles;
  }

  // Update donut center total
  const donutCenter = document.querySelector('.donut-center');
  if (donutCenter) {
    donutCenter.innerHTML = `<strong class="mono">$${fmtMoney(grandTotal)}</strong><span>${new Date().toLocaleDateString('en-US', { month: 'long' })} expenses</span>`;
  }

  legendEl.innerHTML = sorted.length > 0
    ? sorted.map(c => {
        const pct = grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0;
        return `
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;">
            <div style="width:10px;height:10px;border-radius:50%;background:${c.color};flex-shrink:0;"></div>
            <span style="flex:1;">${escapeHtml(c.name)}</span>
            <span style="color:var(--dim);">${pct}%</span>
            <strong class="mono">$${c.total.toFixed(0)}</strong>
          </div>`;
      }).join('')
    : '<div style="font-size:13px;color:var(--dim);">No expenses this month yet.</div>';
}

// ─── Recent Activity ────────────────────────────────────────

function renderActivityList() {
  const el = document.getElementById('activityList');
  if (!el) return;

  const recent = _allTransactions.slice(0, 5);

  if (recent.length === 0) {
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--dim);font-size:13px;">No activity yet. Add an expense or create an invoice to get started.</div>';
    return;
  }

  el.innerHTML = recent.map(t => {
    const isIncome = t.type === 'income';
    const icon = isIncome ? '+' : '-';
    const color = isIncome ? 'var(--green)' : 'var(--coral)';
    const dateStr = new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const catName = t.category ? t.category.name : (isIncome ? 'Income' : 'Expense');

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="width:32px;height:32px;border-radius:10px;background:${color}15;color:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">${icon}</div>
        <div style="flex:1;min-width:0;">
          <strong style="font-size:13px;">${escapeHtml(t.description || catName)}</strong>
          <div style="font-size:11px;color:var(--dim);">${dateStr}</div>
        </div>
        <span class="mono" style="font-size:14px;font-weight:600;color:${color};">${isIncome ? '+' : '-'}$${Math.abs(Number(t.amount)).toFixed(0)}</span>
      </div>`;
  }).join('');
}

// ─── 6-Month Trend Bars ─────────────────────────────────────

function renderTrendBars() {
  const el = document.getElementById('trendBars');
  if (!el) return;

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const isCurrent = i === 0;

    const monthIncome = _allTransactions
      .filter(t => t.type === 'income' && t.date.startsWith(key))
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const monthExpenses = _allTransactions
      .filter(t => t.type === 'expense' && t.date.startsWith(key))
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    months.push({ label, key, income: monthIncome, expenses: monthExpenses, isCurrent });
  }

  const maxVal = Math.max(1, ...months.map(m => Math.max(m.income, m.expenses)));

  el.innerHTML = months.map(m => {
    const incH = Math.max(4, (m.income / maxVal) * 80);
    const expH = Math.max(4, (m.expenses / maxVal) * 80);
    const labelStyle = m.isCurrent ? 'color:var(--text);font-weight:600;' : 'color:var(--dim);';

    return `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
        <div style="display:flex;gap:3px;align-items:flex-end;height:80px;">
          <div style="width:16px;height:${incH}px;background:var(--green);border-radius:3px 3px 0 0;opacity:${m.isCurrent ? 1 : 0.7};"></div>
          <div style="width:16px;height:${expH}px;background:var(--coral);border-radius:3px 3px 0 0;opacity:${m.isCurrent ? 1 : 0.7};"></div>
        </div>
        <span style="font-size:11px;${labelStyle}">${m.label}</span>
        <span style="font-size:10px;color:var(--muted);">$${fmtMoney(m.income)} / $${fmtMoney(m.expenses)}</span>
      </div>`;
  }).join('');
}

// ─── Recent Clients Mini ────────────────────────────────────

function renderRecentClientsMini() {
  const el = document.getElementById('recentClientsMini');
  if (!el) return;

  const clients = (_clients || []).slice(0, 4);

  if (clients.length === 0) {
    el.innerHTML = '<div style="padding:16px;text-align:center;color:var(--dim);font-size:13px;">No clients yet.</div>';
    return;
  }

  el.innerHTML = clients.map(c => {
    const initials = (c.name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#f09876','#6bcb77','#a78bfa','#7ba4f7','#f0c75e','#e88d6d'];
    const color = colors[c.name.charCodeAt(0) % colors.length];

    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="document.querySelector('[data-section-trigger=clients]').click()">
        <div style="width:34px;height:34px;border-radius:10px;background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;">${escapeHtml(initials)}</div>
        <div style="flex:1;min-width:0;">
          <strong style="font-size:13px;">${escapeHtml(c.name)}</strong>
          <div style="font-size:11px;color:var(--dim);">${escapeHtml(c.photography_type || '')}</div>
        </div>
        <span class="pill small ${c.status === 'active' ? 'green' : 'neutral'}" style="font-size:10px;">${escapeHtml(c.status)}</span>
      </div>`;
  }).join('');
}

// ─── Tax Snapshot Mini ──────────────────────────────────────

function renderTaxSnapshotMini(monthTx) {
  const el = document.getElementById('taxSnapshotGrid');
  if (!el) return;

  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const deductible = monthTx.filter(t => t.type === 'expense' && t.is_tax_deductible).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const profit = income - expenses;
  const estimated = Math.max(0, profit * 0.25);

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="padding:12px;background:var(--surface-raised);border-radius:10px;">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">Est. Tax This Month</div>
        <strong class="mono" style="font-size:18px;color:var(--yellow);">$${fmtMoney(estimated)}</strong>
      </div>
      <div style="padding:12px;background:var(--surface-raised);border-radius:10px;">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">Deductible</div>
        <strong class="mono" style="font-size:18px;color:var(--green);">$${fmtMoney(deductible)}</strong>
      </div>
    </div>
  `;
}

// ─── Recurring Expenses ─────────────────────────────────────

async function renderRecurringList(userId) {
  const el = document.getElementById('recurringList');
  if (!el) return;

  const { data: recurring } = await sb
    .from('recurring_expenses')
    .select('*, category:categories(name)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('next_due');

  if (!recurring || recurring.length === 0) {
    el.innerHTML = '<div style="padding:16px;text-align:center;color:var(--dim);font-size:13px;">No recurring expenses set up yet. Add them in Settings.</div>';
    return;
  }

  const total = recurring.reduce((s, r) => s + Number(r.amount), 0);

  el.innerHTML = recurring.map(r => {
    const nextDue = r.next_due ? new Date(r.next_due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
        <div style="flex:1;">
          <strong>${escapeHtml(r.description)}</strong>
          <div style="font-size:11px;color:var(--dim);">${r.category ? escapeHtml(r.category.name) : ''} ${nextDue ? '· renews ' + nextDue : ''}</div>
        </div>
        <span class="mono" style="color:var(--coral);">$${Number(r.amount).toFixed(0)}/${r.frequency === 'monthly' ? 'mo' : r.frequency}</span>
      </div>`;
  }).join('') + `
    <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:13px;border-top:1px solid var(--border);margin-top:4px;">
      <span style="color:var(--dim);">Monthly total</span>
      <strong class="mono" style="color:var(--coral);">$${total.toFixed(0)}/mo</strong>
    </div>`;
}

// ─── Helpers ────────────────────────────────────────────────

function fmtMoney(n) {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── Init ───────────────────────────────────────────────────

function initDashboardStats() {
  if (_dashStatsInitialized) return;
  _dashStatsInitialized = true;

  // Set dynamic date strings
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const el = id => document.getElementById(id);
  if (el('dashKicker')) el('dashKicker').textContent = `Today · ${dayName}, ${monthDay}`;
  if (el('dashboardTitle')) el('dashboardTitle').textContent = greeting;
  if (el('expensesKicker')) el('expensesKicker').textContent = `Expense review · ${monthYear}`;

  // Dynamic tax quarter badge
  const currentQ = Math.floor(now.getMonth() / 3) + 1;
  if (el('navTaxBadge')) el('navTaxBadge').textContent = `Q${currentQ}`;

  loadDashboardStats();
}
