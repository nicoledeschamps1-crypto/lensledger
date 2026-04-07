// ═══════════════════════════════════════════════════════════════
// LensLedger — Tax Center Module
// ═══════════════════════════════════════════════════════════════

let _mileageEntries = [];
let _taxInitialized = false;
const IRS_RATE = 0.70; // 2026 IRS standard mileage rate
const STANDARD_DEDUCTION = 15000;

const TAX_DEADLINES = [
  { label: 'Q1 estimated tax', date: '2026-04-15', desc: 'First quarterly estimated payment for 2026.' },
  { label: 'Q2 estimated tax', date: '2026-06-15', desc: 'Second quarterly estimated payment for 2026.' },
  { label: 'Q3 estimated tax', date: '2026-09-15', desc: 'Third quarterly estimated payment for 2026.' },
  { label: 'Q4 estimated tax', date: '2027-01-15', desc: 'Fourth quarterly estimated payment for 2026.' }
];

async function loadTaxData() {
  await loadMileage();
  renderQuarterGrid();
  renderDeductionList();
  renderDeadlines();
  renderMileageList();
  renderRecommendedActions();
}

// ─── Quarterly Breakdown ────────────────────────────────────

function renderQuarterGrid() {
  const el = document.getElementById('quarterGrid');
  if (!el) return;

  // Calculate income by quarter from transactions
  const allTx = _transactions || [];
  const year = new Date().getFullYear();

  const quarters = [
    { name: 'Q1', start: `${year}-01-01`, end: `${year}-03-31`, due: `${year}-04-15` },
    { name: 'Q2', start: `${year}-04-01`, end: `${year}-06-30`, due: `${year}-06-15` },
    { name: 'Q3', start: `${year}-07-01`, end: `${year}-09-30`, due: `${year}-09-15` },
    { name: 'Q4', start: `${year}-10-01`, end: `${year}-12-31`, due: `${year + 1}-01-15` }
  ];

  const now = new Date();
  const currentQ = Math.floor(now.getMonth() / 3);

  el.innerHTML = quarters.map((q, i) => {
    const qIncome = allTx
      .filter(t => t.type === 'income' && t.date >= q.start && t.date <= q.end)
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const qExpenses = allTx
      .filter(t => t.type === 'expense' && t.date >= q.start && t.date <= q.end)
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const profit = qIncome - qExpenses;
    const estimated = Math.max(0, profit * 0.25);
    const isPast = i < currentQ;
    const isCurrent = i === currentQ;
    const status = isPast ? 'Complete' : isCurrent ? 'In progress' : 'Planning';
    const statusClass = isPast ? 'green' : isCurrent ? 'blue' : 'neutral';

    return `
      <div class="card" style="padding:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <strong>${q.name}</strong>
          <span class="pill small ${statusClass}">${status}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
          <div><span style="color:var(--muted);display:block;">Estimated Tax</span><strong class="mono" style="font-size:16px;">$${estimated.toFixed(0)}</strong></div>
          <div><span style="color:var(--muted);display:block;">Net Profit</span><strong class="mono" style="font-size:16px;">$${profit.toFixed(0)}</strong></div>
        </div>
        <div style="font-size:11px;color:var(--dim);margin-top:8px;">Due ${new Date(q.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      </div>`;
  }).join('');
}

// ─── Deductions Tracker ─────────────────────────────────────

function renderDeductionList() {
  const el = document.getElementById('deductionList');
  if (!el) return;

  const allTx = _transactions || [];
  const deductible = allTx.filter(t => t.type === 'expense' && t.is_tax_deductible && t.category);

  const byCategory = {};
  for (const t of deductible) {
    const name = t.category.name;
    const color = t.category.color;
    if (!byCategory[name]) byCategory[name] = { name, color, total: 0 };
    byCategory[name].total += Math.abs(Number(t.amount));
  }

  const sorted = Object.values(byCategory).sort((a, b) => b.total - a.total);
  const totalDeductions = sorted.reduce((s, c) => s + c.total, 0);

  el.innerHTML = sorted.length > 0
    ? sorted.map(c => `
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:4px;">
            <strong>${c.name}</strong>
            <span class="mono">$${c.total.toFixed(0)}</span>
          </div>
          <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${Math.min(100, (c.total / (totalDeductions || 1)) * 100)}%;background:${c.color};border-radius:3px;"></div>
          </div>
        </div>
      `).join('')
    : '<div style="padding:24px;text-align:center;color:var(--dim);">No deductible expenses logged yet.</div>';

  // Update the comparison card
  const itemizedEl = document.querySelector('.comparison-item:last-child .mono');
  if (itemizedEl) itemizedEl.textContent = `$${totalDeductions.toFixed(0)}`;
}

// ─── Mileage Log ────────────────────────────────────────────

async function loadMileage() {
  const user = await getUser();
  if (!user) return;

  const { data, error } = await sb
    .from('mileage_log')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(50);

  if (error) console.error('Failed to load mileage:', error.message);
  _mileageEntries = data || [];
}

function renderMileageList() {
  const el = document.getElementById('mileageList');
  if (!el) return;

  if (_mileageEntries.length === 0) {
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--dim);">No trips logged yet. Click "Log Trip" to start tracking mileage.</div>';
    return;
  }

  el.innerHTML = _mileageEntries.map(m => {
    const dateStr = new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;">
        <span style="color:var(--dim);min-width:90px;">${dateStr}</span>
        <span style="flex:1;">${m.start_location || ''} → ${m.end_location || ''}</span>
        <span class="mono" style="min-width:50px;">${Number(m.miles).toFixed(1)} mi</span>
        <span class="mono" style="color:var(--green);min-width:60px;">$${Number(m.deductible_amount || 0).toFixed(2)}</span>
        <button class="button small ghost" onclick="deleteMileage('${m.id}')" style="opacity:0.5;">x</button>
      </div>`;
  }).join('');
}

function showMileageModal() {
  const existing = document.getElementById('mileageModal');
  if (existing) existing.remove();

  const today = new Date().toISOString().split('T')[0];
  const modal = document.createElement('div');
  modal.id = 'mileageModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;padding:24px;';
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:32px;width:100%;max-width:420px;cursor:default;" onclick="event.stopPropagation();">
      <h2 style="font-size:18px;margin-bottom:20px;">Log Trip</h2>
      <form id="mileageForm">
        <div class="manual-grid" style="gap:12px;">
          <div class="field-group">
            <label for="mileageDate">Date</label>
            <input class="field" id="mileageDate" type="date" value="${today}" required>
          </div>
          <div class="field-group">
            <label for="mileageMiles">Miles</label>
            <input class="field mono" id="mileageMiles" type="number" min="0" step="0.1" required placeholder="0.0">
          </div>
          <div class="field-group full">
            <label for="mileageFrom">From</label>
            <input class="field" id="mileageFrom" type="text" placeholder="Home, Studio, etc.">
          </div>
          <div class="field-group full">
            <label for="mileageTo">To</label>
            <input class="field" id="mileageTo" type="text" placeholder="Venue, Client location, etc.">
          </div>
          <div class="field-group full">
            <label for="mileagePurpose">Purpose</label>
            <input class="field" id="mileagePurpose" type="text" placeholder="Client shoot, equipment pickup, etc.">
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">
          <button type="button" class="button secondary" onclick="document.getElementById('mileageModal').remove()">Cancel</button>
          <button type="submit" class="button primary">Log Trip</button>
        </div>
      </form>
    </div>
  `;
  modal.addEventListener('click', () => modal.remove());
  document.body.appendChild(modal);

  document.getElementById('mileageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveMileage();
  });
}

async function saveMileage() {
  const user = await getUser();
  if (!user) return;

  const miles = parseFloat(document.getElementById('mileageMiles').value);
  if (!miles || miles <= 0) { alert('Enter valid miles.'); return; }

  const { error } = await sb.from('mileage_log').insert({
    user_id: user.id,
    date: document.getElementById('mileageDate').value,
    miles: miles,
    start_location: document.getElementById('mileageFrom').value.trim(),
    end_location: document.getElementById('mileageTo').value.trim(),
    purpose: document.getElementById('mileagePurpose').value.trim(),
    irs_rate: IRS_RATE
  });

  if (error) {
    console.error('Failed to log mileage:', error.message);
    alert('Failed to save trip.');
    return;
  }

  document.getElementById('mileageModal').remove();
  await loadMileage();
  renderMileageList();
}

async function deleteMileage(id) {
  if (!confirm('Delete this trip?')) return;
  await sb.from('mileage_log').delete().eq('id', id);
  await loadMileage();
  renderMileageList();
}

// ─── Deadlines ──────────────────────────────────────────────

function renderDeadlines() {
  const el = document.getElementById('deadlineList');
  if (!el) return;

  const now = new Date();
  el.innerHTML = TAX_DEADLINES.map(d => {
    const date = new Date(d.date + 'T00:00:00');
    const daysLeft = Math.ceil((date - now) / 86400000);
    const isPast = daysLeft < 0;
    const isUrgent = daysLeft <= 30 && daysLeft >= 0;
    const pillClass = isPast ? 'green' : isUrgent ? 'yellow' : 'blue';
    const pillText = isPast ? 'Done' : `${daysLeft} days`;

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);">
        <div style="flex:1;">
          <strong style="font-size:14px;">${d.label}</strong>
          <div style="font-size:12px;color:var(--dim);">${d.desc}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
        <span class="pill small ${pillClass}">${pillText}</span>
      </div>`;
  }).join('');
}

// ─── Recommended Actions ────────────────────────────────────

function renderRecommendedActions() {
  // These are already hardcoded in the HTML, but we can update counts
  const allTx = _transactions || [];
  const missingReceipts = allTx.filter(t => t.type === 'expense' && (!t.receipts || t.receipts.length === 0)).length;

  const receiptPill = document.querySelector('.settings-list .pill.yellow');
  if (receiptPill) receiptPill.textContent = `${missingReceipts} open`;
}

// ─── Init ───────────────────────────────────────────────────

function initTax() {
  if (_taxInitialized) return;
  _taxInitialized = true;
  console.log('initTax: starting');

  // Wire Log Trip button
  const logBtn = document.querySelector('.mileage-card .button.primary');
  if (logBtn) {
    logBtn.addEventListener('click', showMileageModal);
  }

  loadTaxData();
}
