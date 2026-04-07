// ═══════════════════════════════════════════════════════════════
// LensLedger — Invoices Module
// ═══════════════════════════════════════════════════════════════

let _invoices = [];
let _invoiceFilter = 'all';
let _invoicesInitialized = false;
let _nextInvoiceNum = 1;

const INVOICE_TEMPLATES = {
  Wedding:     [{ description: 'Wedding collection balance', price: 2200 }, { description: 'Album design retainer', price: 200 }],
  Portrait:    [{ description: 'Portrait session fee', price: 350 }, { description: 'Digital delivery package', price: 100 }],
  Commercial:  [{ description: 'Commercial shoot — half day', price: 800 }, { description: 'Usage license (1 year)', price: 400 }],
  Event:       [{ description: 'Event coverage (4 hours)', price: 600 }, { description: 'Same-day preview edit', price: 150 }],
  Custom:      [{ description: 'Custom service', price: 0 }]
};

async function loadInvoices() {
  const user = await getUser();
  if (!user) return;

  const { data, error } = await sb
    .from('invoices')
    .select('*, client:clients(id, name), items:invoice_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load invoices:', error.message);
  }
  _invoices = data || [];
  _nextInvoiceNum = _invoices.length + 1;
  renderInvoiceStats();
  renderInvoiceFilters();
  renderInvoiceList();
  renderTemplateGrid();
}

// ─── Stats ──────────────────────────────────────────────────

function renderInvoiceStats() {
  const el = document.getElementById('invoiceStats');
  if (!el) return;

  const outstanding = _invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status))
    .reduce((s, i) => s + Number(i.total), 0);
  const overdue = _invoices.filter(i => i.status === 'overdue').length;
  const paidThisMonth = _invoices.filter(i => i.status === 'paid' && i.paid_date && i.paid_date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, i) => s + Number(i.total), 0);
  const paidInvoices = _invoices.filter(i => i.status === 'paid' && i.paid_date && i.issue_date);
  const avgDays = paidInvoices.length > 0
    ? Math.round(paidInvoices.reduce((s, i) => s + (new Date(i.paid_date) - new Date(i.issue_date)) / 86400000, 0) / paidInvoices.length)
    : 0;

  el.innerHTML = `
    <div class="stat-mini"><span class="stat-mini-label">Outstanding Total</span><span class="stat-mini-value mono" style="color:var(--yellow);">$${outstanding.toFixed(2)}</span></div>
    <div class="stat-mini"><span class="stat-mini-label">Overdue Count</span><span class="stat-mini-value mono" style="color:var(--red);">${overdue}</span></div>
    <div class="stat-mini"><span class="stat-mini-label">Paid This Month</span><span class="stat-mini-value mono" style="color:var(--green);">$${paidThisMonth.toFixed(2)}</span></div>
    <div class="stat-mini"><span class="stat-mini-label">Avg Days to Pay</span><span class="stat-mini-value mono">${avgDays} days</span></div>
  `;
}

// ─── Filters ────────────────────────────────────────────────

function renderInvoiceFilters() {
  const el = document.getElementById('invoiceFilterRow');
  if (!el) return;

  const filters = ['all', 'draft', 'sent', 'viewed', 'paid', 'overdue'];
  el.innerHTML = filters.map(f => `
    <button class="tag-button ${_invoiceFilter === f ? 'is-active' : ''}" type="button"
            onclick="setInvoiceFilter('${f}')">
      ${f.charAt(0).toUpperCase() + f.slice(1)}
    </button>
  `).join('');
}

function setInvoiceFilter(filter) {
  _invoiceFilter = filter;
  renderInvoiceFilters();
  renderInvoiceList();
}

// ─── Invoice List ───────────────────────────────────────────

function renderInvoiceList() {
  const el = document.getElementById('invoiceList');
  if (!el) return;

  let filtered = _invoices;
  if (_invoiceFilter !== 'all') {
    filtered = filtered.filter(i => i.status === _invoiceFilter);
  }

  if (filtered.length === 0) {
    el.innerHTML = `<div class="empty-state" style="padding:48px;text-align:center;color:var(--dim);">
      ${_invoices.length === 0 ? 'No invoices yet. Create one from a template on the right.' : 'No invoices match this filter.'}
    </div>`;
    return;
  }

  el.innerHTML = filtered.map(inv => {
    const clientName = inv.client ? escapeHtml(inv.client.name) : 'No client';
    const statusColors = { draft: 'neutral', sent: 'blue', viewed: 'blue', paid: 'green', overdue: 'red', cancelled: 'neutral' };
    const statusClass = statusColors[inv.status] || 'neutral';
    const issueDate = inv.issue_date ? new Date(inv.issue_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const dueDate = inv.due_date ? new Date(inv.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const safeInvoiceNumber = escapeHtml(inv.invoice_number);
    const safeStatus = escapeHtml(inv.status);

    return `
      <div style="display:flex;align-items:center;gap:14px;padding:14px;border-bottom:1px solid var(--border);cursor:pointer;" onclick="editInvoice('${inv.id}')">
        <div style="flex:1;min-width:0;">
          <strong style="font-size:14px;">${clientName}</strong>
          <div style="font-size:12px;color:var(--dim);">${safeInvoiceNumber}</div>
        </div>
        <span class="mono" style="font-size:14px;font-weight:600;">$${Number(inv.total).toFixed(2)}</span>
        <div style="font-size:12px;color:var(--dim);min-width:90px;text-align:right;">
          <div>${issueDate}</div>
          <div>${dueDate ? 'Due ' + dueDate : ''}</div>
        </div>
        <span class="pill small ${statusClass}">${safeStatus.toUpperCase()}</span>
        <div style="display:flex;gap:4px;">
          <button class="button small secondary" onclick="event.stopPropagation();window.open('/invoice-print.html?id=${inv.id}','_blank')">PDF</button>
          ${inv.status === 'sent' || inv.status === 'viewed' || inv.status === 'overdue' ? `<button class="button small primary" onclick="event.stopPropagation();markInvoicePaid('${inv.id}')">Mark Paid</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ─── Template Grid ──────────────────────────────────────────

let _selectedTemplate = null;

function renderTemplateGrid() {
  const el = document.getElementById('templateGrid');
  if (!el) return;

  el.innerHTML = Object.keys(INVOICE_TEMPLATES).map(name => `
    <button class="tag-button ${_selectedTemplate === name ? 'is-active' : ''}" type="button" onclick="selectTemplate('${name}')">
      ${name}
    </button>
  `).join('');

  populateClientDatalist();
  renderTemplatePreview();
}

function selectTemplate(name) {
  _selectedTemplate = _selectedTemplate === name ? null : name;
  renderTemplateGrid();
}

function renderTemplatePreview() {
  const el = document.getElementById('templatePreview');
  if (!el) return;

  if (!_selectedTemplate) {
    el.innerHTML = '<div style="padding:16px;text-align:center;color:var(--dim);font-size:13px;">Select a template above to see line items</div>';
    return;
  }

  const items = INVOICE_TEMPLATES[_selectedTemplate];
  const total = items.reduce((s, i) => s + i.price, 0);

  el.innerHTML = `
    <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:12px;">
      ${items.map(item => `
        <div style="display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border);font-size:13px;">
          <span>${item.description}</span>
          <span class="mono">$${item.price.toFixed(2)}</span>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;padding:12px 14px;font-weight:600;">
        <span>Template total</span>
        <span class="mono">$${total.toFixed(2)}</span>
      </div>
    </div>
  `;
}

function populateClientDatalist() {
  const datalist = document.getElementById('clientDatalist');
  if (!datalist || !_clients) return;

  datalist.innerHTML = _clients
    .filter(c => c.status !== 'archived')
    .map(c => `<option value="${escapeHtml(c.name)}">`)
    .join('');
}

// ─── Create Invoice from Template ───────────────────────────

async function createInvoice() {
  const user = await getUser();
  if (!user) return;

  const clientNameInput = document.getElementById('invoiceClientName');
  const clientName = clientNameInput ? clientNameInput.value.trim() : '';
  const shootType = document.getElementById('invoiceShootType').value.trim();
  const dueDate = document.getElementById('invoiceDueDate').value;
  const customAmount = parseFloat(document.getElementById('invoiceCustomAmount').value);

  if (!clientName) {
    alert('Please enter a client name.');
    return;
  }

  if (!_selectedTemplate) {
    alert('Please select a template (Wedding, Portrait, etc.).');
    return;
  }

  // Find or create client
  let clientId = null;
  const existingClient = _clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());

  if (existingClient) {
    clientId = existingClient.id;
  } else {
    // Auto-create client with minimal info
    const { data: newClient, error: clientError } = await sb
      .from('clients')
      .insert({
        user_id: user.id,
        name: clientName,
        photography_type: shootType || _selectedTemplate,
        status: 'active',
        notes: 'Auto-created from invoice — fill in contact details when available'
      })
      .select()
      .single();

    if (clientError) {
      console.error('Failed to create client:', clientError.message);
      alert('Failed to create client.');
      return;
    }
    clientId = newClient.id;
    // Reload clients so the new one appears everywhere
    await loadClients();
  }

  // Build line items from template
  const templateItems = INVOICE_TEMPLATES[_selectedTemplate];
  let subtotal;

  if (!isNaN(customAmount) && customAmount > 0) {
    subtotal = customAmount;
  } else {
    subtotal = templateItems.reduce((s, i) => s + i.price, 0);
  }

  const year = new Date().getFullYear();
  const invoiceNumber = `LL-${year}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

  const { data: invoice, error } = await sb
    .from('invoices')
    .insert({
      user_id: user.id,
      client_id: clientId,
      invoice_number: invoiceNumber,
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate || null,
      subtotal: subtotal,
      total: subtotal
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create invoice:', error.message);
    alert('Failed to create invoice.');
    return;
  }

  // Insert line items
  let lineItems;
  if (!isNaN(customAmount) && customAmount > 0) {
    lineItems = [{ invoice_id: invoice.id, description: `${_selectedTemplate} — custom amount`, quantity: 1, unit_price: customAmount, total: customAmount }];
  } else {
    lineItems = templateItems.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: 1,
      unit_price: item.price,
      total: item.price
    }));
  }

  const { error: itemsError } = await sb.from('invoice_items').insert(lineItems);
  if (itemsError) {
    console.error('Failed to add line items:', itemsError.message);
  }

  // Reset form
  clientNameInput.value = '';
  document.getElementById('invoiceShootType').value = '';
  document.getElementById('invoiceDueDate').value = '';
  document.getElementById('invoiceCustomAmount').value = '';
  _selectedTemplate = null;

  await loadInvoices();
}

// ─── Mark Paid ──────────────────────────────────────────────

async function markInvoicePaid(id) {
  const user = await getUser();
  if (!user) return;

  const invoice = _invoices.find(i => i.id === id);
  if (!invoice) return;

  const { error } = await sb
    .from('invoices')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0]
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to mark paid:', error.message);
    return;
  }

  // Create income transaction
  await sb.from('transactions').insert({
    user_id: user.id,
    type: 'income',
    amount: Number(invoice.total),
    date: new Date().toISOString().split('T')[0],
    description: `Invoice ${escapeHtml(invoice.invoice_number)} paid`,
    invoice_id: id,
    is_business: true,
    business_percentage: 100
  });

  await loadInvoices();
}

// ─── Edit Invoice (status change) ───────────────────────────

async function editInvoice(id) {
  const inv = _invoices.find(i => i.id === id);
  if (!inv) return;

  const existing = document.getElementById('invoiceModal');
  if (existing) existing.remove();

  const clientName = inv.client ? escapeHtml(inv.client.name) : 'No client';
  const safeInvoiceNumber = escapeHtml(inv.invoice_number);
  const safeStatus = escapeHtml(inv.status);
  const items = inv.items || [];

  const modal = document.createElement('div');
  modal.id = 'invoiceModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;padding:24px;';
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:32px;width:100%;max-width:520px;cursor:default;" onclick="event.stopPropagation();">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;">
        <div>
          <h2 style="font-size:18px;">${safeInvoiceNumber}</h2>
          <div style="font-size:13px;color:var(--dim);margin-top:4px;">${clientName}</div>
        </div>
        <span class="pill ${inv.status === 'paid' ? 'green' : inv.status === 'overdue' ? 'red' : 'blue'}">${safeStatus.toUpperCase()}</span>
      </div>

      <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;">
        ${items.map(item => `
          <div style="display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border);font-size:13px;">
            <span>${escapeHtml(item.description)}</span>
            <span class="mono">$${Number(item.total).toFixed(2)}</span>
          </div>
        `).join('')}
        <div style="display:flex;justify-content:space-between;padding:12px 14px;font-weight:600;">
          <span>Total</span>
          <span class="mono">$${Number(inv.total).toFixed(2)}</span>
        </div>
      </div>

      <div class="manual-grid" style="gap:12px;">
        <div class="field-group">
          <label>Status</label>
          <select class="field" id="invoiceStatusSelect">
            ${['draft','sent','viewed','paid','overdue','cancelled'].map(s =>
              `<option value="${s}" ${inv.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="field-group">
          <label>Due Date</label>
          <input class="field" id="invoiceDueDateEdit" type="date" value="${inv.due_date || ''}">
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">
        <button class="button ghost" style="margin-right:auto;color:var(--red);" onclick="deleteInvoice('${inv.id}')">Delete</button>
        <button class="button secondary" onclick="document.getElementById('invoiceModal').remove()">Cancel</button>
        <button class="button primary" onclick="updateInvoice('${inv.id}')">Save</button>
      </div>
    </div>
  `;
  modal.addEventListener('click', () => modal.remove());
  document.body.appendChild(modal);
}

async function updateInvoice(id) {
  const user = await getUser();
  if (!user) return;

  const newStatus = document.getElementById('invoiceStatusSelect').value;
  const newDueDate = document.getElementById('invoiceDueDateEdit').value;

  const update = { status: newStatus, due_date: newDueDate || null };
  if (newStatus === 'paid') {
    update.paid_date = new Date().toISOString().split('T')[0];
  }

  const { error } = await sb.from('invoices').update(update).eq('id', id).eq('user_id', user.id);
  if (error) {
    console.error('Failed to update invoice:', error.message);
    return;
  }

  document.getElementById('invoiceModal').remove();

  // If marked paid, create income transaction
  if (newStatus === 'paid') {
    const inv = _invoices.find(i => i.id === id);
    if (inv) {
      await sb.from('transactions').insert({
        user_id: user.id,
        type: 'income',
        amount: Number(inv.total),
        date: new Date().toISOString().split('T')[0],
        description: `Invoice ${escapeHtml(inv.invoice_number)} paid`,
        invoice_id: id,
        is_business: true,
        business_percentage: 100
      });
    }
  }

  await loadInvoices();
}

async function deleteInvoice(id) {
  if (!confirm('Delete this invoice? This cannot be undone.')) return;

  const user = await getUser();
  if (!user) return;

  const { error } = await sb.from('invoices').delete().eq('id', id).eq('user_id', user.id);
  if (error) {
    console.error('Failed to delete invoice:', error.message);
    return;
  }

  document.getElementById('invoiceModal').remove();
  await loadInvoices();
}

// ─── Init ───────────────────────────────────────────────────

function initInvoices() {
  if (_invoicesInitialized) return;
  _invoicesInitialized = true;
  console.log('initInvoices: starting');

  // Wire "+ Create Invoice" header button to scroll to template section
  const headerBtn = document.querySelector('#invoices .header-actions .button.primary');
  if (headerBtn) {
    headerBtn.addEventListener('click', () => {
      const templateEl = document.getElementById('templateGrid');
      if (templateEl) templateEl.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Wire the actual "Create Invoice" submit button
  const createBtn = document.getElementById('createInvoiceBtn');
  if (createBtn) {
    createBtn.addEventListener('click', createInvoice);
  }

  loadInvoices();
}
