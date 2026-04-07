// ═══════════════════════════════════════════════════════════════
// Haus Ledger — Income Module
// Handles: income list, manual entry, client breakdown, trends
// ═══════════════════════════════════════════════════════════════

let _incomeTransactions = [];
let _incomeInitialized = false;

// ─── Load Income Transactions ──────────────────────────────

async function loadIncome() {
  const user = await getUser();
  if (!user) return;

  const { data, error } = await sb
    .from('transactions')
    .select('*, category:categories(id, name, color), invoice:invoices(id, invoice_number, client:clients(id, name))')
    .eq('user_id', user.id)
    .eq('type', 'income')
    .order('date', { ascending: false });

  if (error) {
    console.error('Failed to load income:', error.message);
  }
  _incomeTransactions = data || [];
  renderIncomeStats();
  renderIncomeList();
  renderIncomeByClient();
  renderIncomeTrend();
  renderRecentPaidInvoices();
}

// ─── Stats Cards ───────────────────────────────────────────

function renderIncomeStats() {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisYear = `${now.getFullYear()}`;
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const monthTx = _incomeTransactions.filter(t => t.date.startsWith(thisMonth));
  const yearTx = _incomeTransactions.filter(t => t.date.startsWith(thisYear));

  const monthTotal = monthTx.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const yearTotal = yearTx.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  // Count unique clients this month
  const monthClients = new Set();
  for (const t of monthTx) {
    if (t.invoice?.client?.name) monthClients.add(t.invoice.client.name);
  }
  const clientCount = Math.max(monthClients.size, 1);
  const avgPerClient = monthTotal / clientCount;

  const el = (id, text) => { const e = document.getElementById(id); if (e) e.textContent = text; };

  el('incomeMonthValue', '$' + fmtK(monthTotal));
  el('incomeMonthTrend', `${monthTx.length} payment${monthTx.length !== 1 ? 's' : ''}`);
  el('incomeMonthNote', monthTx.length > 0
    ? `${monthTx.length} payment(s) received in ${now.toLocaleDateString('en-US', { month: 'long' })}.`
    : 'No income recorded this month yet.');

  el('incomeAvgValue', '$' + fmtK(avgPerClient));
  el('incomeAvgTrend', `${monthClients.size} client${monthClients.size !== 1 ? 's' : ''}`);

  el('incomeYtdValue', '$' + fmtK(yearTotal));
  el('incomeYtdTrend', `${yearTx.length} total`);

  el('incomeHeaderTotal', '$' + fmtK(monthTotal));
  el('incomeCountPill', `${_incomeTransactions.length} payments`);

  // Update kicker
  el('incomeKicker', `Income overview · ${monthName}`);
}

// ─── Income List ───────────────────────────────────────────

function renderIncomeList() {
  const el = document.getElementById('incomeList');
  if (!el) return;

  if (_incomeTransactions.length === 0) {
    el.innerHTML = '<div class="empty-state" style="padding:48px;text-align:center;color:var(--dim);">No income recorded yet. Mark an invoice as paid or log income manually below.</div>';
    return;
  }

  el.innerHTML = _incomeTransactions.map(t => {
    const dateStr = new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const clientName = t.invoice?.client?.name;
    const invoiceNum = t.invoice?.invoice_number;
    const desc = t.description || 'Income';
    const sourcePill = invoiceNum
      ? `<span class="pill small green" style="cursor:pointer;" onclick="event.stopPropagation();document.querySelector('[data-section-trigger=invoices]').click()">${escapeHtml(invoiceNum)}</span>`
      : '<span class="pill small neutral">Manual</span>';

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--border);">
        <div style="width:36px;height:36px;border-radius:10px;background:var(--green-soft);color:var(--green);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">+</div>
        <div style="min-width:50px;color:var(--dim);font-size:13px;">${dateStr}</div>
        <div style="flex:1;min-width:0;">
          <strong style="font-size:14px;">${escapeHtml(desc)}</strong>
          ${clientName ? `<div style="font-size:12px;color:var(--dim);margin-top:2px;">${escapeHtml(clientName)}</div>` : ''}
        </div>
        <span class="mono" style="font-size:14px;font-weight:600;color:var(--green);">+$${Math.abs(Number(t.amount)).toFixed(2)}</span>
        ${sourcePill}
        <button class="button small ghost" onclick="deleteIncome('${t.id}')" title="Delete" style="opacity:0.5;">x</button>
      </div>`;
  }).join('');
}

// ─── Delete Income ─────────────────────────────────────────

async function deleteIncome(id) {
  if (!confirm('Delete this income entry?')) return;

  const user = await getUser();
  if (!user) return;

  const { error } = await sb
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to delete income:', error.message);
    return;
  }
  await loadIncome();
}

// ─── Manual Income Form ────────────────────────────────────

function initIncomeForm() {
  const form = document.getElementById('manualIncomeForm');
  if (!form) return;

  // Set default date
  const dateInput = document.getElementById('incomeDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // Populate client datalist
  const datalist = document.getElementById('incomeClientDatalist');
  if (datalist && _clients) {
    datalist.innerHTML = _clients
      .filter(c => c.status !== 'archived')
      .map(c => `<option value="${escapeHtml(c.name)}">`)
      .join('');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = await getUser();
    if (!user) return;

    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const date = document.getElementById('incomeDate').value;
    const clientName = document.getElementById('incomeClient').value.trim();
    const source = document.getElementById('incomeSource').value;
    const note = document.getElementById('incomeNote').value.trim();

    if (!amount || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const description = note || `${source.charAt(0).toUpperCase() + source.slice(1)} payment` + (clientName ? ` from ${clientName}` : '');

    const { error } = await sb
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'income',
        amount: amount,
        date: date,
        description: description,
        merchant: clientName || source,
        is_business: true,
        business_percentage: 100
      });

    if (error) {
      console.error('Failed to add income:', error.message);
      alert('Failed to add income. Please try again.');
      return;
    }

    // Reset form
    form.reset();
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    await loadIncome();
  });
}

// ─── Income by Client ──────────────────────────────────────

function renderIncomeByClient() {
  const el = document.getElementById('incomeByClientList');
  if (!el) return;

  const thisYear = `${new Date().getFullYear()}`;
  const yearTx = _incomeTransactions.filter(t => t.date.startsWith(thisYear));

  const byClient = {};
  for (const t of yearTx) {
    const name = t.invoice?.client?.name || t.merchant || 'Other';
    if (!byClient[name]) byClient[name] = { name, total: 0, count: 0 };
    byClient[name].total += Math.abs(Number(t.amount));
    byClient[name].count++;
  }

  const sorted = Object.values(byClient).sort((a, b) => b.total - a.total);
  const grandTotal = sorted.reduce((s, c) => s + c.total, 0);

  if (sorted.length === 0) {
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--dim);font-size:13px;">No income this year yet.</div>';
    return;
  }

  const colors = ['#5ec269','#6b9cf0','#e8b84a','#e88d6d','#a78bfa','#ec8f95','#7c6df0'];

  el.innerHTML = sorted.map((c, i) => {
    const pct = grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0;
    const color = colors[i % colors.length];
    const initials = c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="width:34px;height:34px;border-radius:10px;background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;">${escapeHtml(initials)}</div>
        <div style="flex:1;min-width:0;">
          <strong style="font-size:13px;">${escapeHtml(c.name)}</strong>
          <div style="font-size:11px;color:var(--dim);">${c.count} payment${c.count !== 1 ? 's' : ''} · ${pct}% of total</div>
        </div>
        <span class="mono" style="font-size:14px;font-weight:600;color:var(--green);">$${fmtK(c.total)}</span>
      </div>`;
  }).join('');
}

// ─── Income Trend Bars ─────────────────────────────────────

function renderIncomeTrend() {
  const el = document.getElementById('incomeTrendBars');
  if (!el) return;

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const isCurrent = i === 0;

    const total = _incomeTransactions
      .filter(t => t.date.startsWith(key))
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    months.push({ label, total, isCurrent });
  }

  const maxVal = Math.max(1, ...months.map(m => m.total));

  el.innerHTML = `<div style="display:flex;gap:8px;align-items:flex-end;height:120px;padding-top:12px;">
    ${months.map(m => {
      const h = Math.max(4, (m.total / maxVal) * 100);
      const labelStyle = m.isCurrent ? 'color:var(--text);font-weight:600;' : 'color:var(--dim);';
      return `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
          <span class="mono" style="font-size:10px;color:var(--dim);">$${fmtK(m.total)}</span>
          <div style="width:100%;max-width:40px;height:${h}px;background:var(--green);border-radius:4px 4px 0 0;opacity:${m.isCurrent ? 1 : 0.6};"></div>
          <span style="font-size:11px;${labelStyle}">${m.label}</span>
        </div>`;
    }).join('')}
  </div>`;
}

// ─── Recent Paid Invoices ──────────────────────────────────

function renderRecentPaidInvoices() {
  const el = document.getElementById('recentPaidInvoices');
  if (!el) return;

  const paidInvoices = (_invoices || [])
    .filter(i => i.status === 'paid')
    .sort((a, b) => (b.paid_date || '').localeCompare(a.paid_date || ''))
    .slice(0, 5);

  if (paidInvoices.length === 0) {
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--dim);font-size:13px;">No paid invoices yet.</div>';
    return;
  }

  el.innerHTML = paidInvoices.map(inv => {
    const clientName = inv.client ? escapeHtml(inv.client.name) : 'No client';
    const paidDate = inv.paid_date ? new Date(inv.paid_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

    return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;">
        <div style="width:28px;height:28px;border-radius:8px;background:var(--green-soft);color:var(--green);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">✓</div>
        <div style="flex:1;min-width:0;">
          <strong>${clientName}</strong>
          <div style="font-size:11px;color:var(--dim);">${escapeHtml(inv.invoice_number)} · paid ${paidDate}</div>
        </div>
        <span class="mono" style="font-weight:600;color:var(--green);">$${Number(inv.total).toFixed(0)}</span>
      </div>`;
  }).join('');
}

// ─── Helpers ───────────────────────────────────────────────

function fmtK(n) {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── Init ──────────────────────────────────────────────────

function initIncome() {
  if (_incomeInitialized) return;
  _incomeInitialized = true;
  console.log('initIncome: starting');
  initIncomeForm();
  loadIncome();
}
