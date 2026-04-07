// ═══════════════════════════════════════════════════════════════
// LensLedger — Clients Module
// ═══════════════════════════════════════════════════════════════

let _clients = [];
let _clientFilter = 'all';
let _clientSearch = '';
let _clientsInitialized = false;

async function loadClients() {
  const user = await getUser();
  if (!user) return;

  const { data, error } = await sb
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load clients:', error.message);
  }
  _clients = data || [];
  renderClientFilters();
  renderClientSummary();
  renderClientGrid();
}

// ─── Filters ────────────────────────────────────────────────

function renderClientFilters() {
  const el = document.getElementById('clientStatusFilters');
  if (!el) return;

  const filters = ['all', 'active', 'lead', 'archived'];
  el.innerHTML = filters.map(f => `
    <button class="tag-button ${_clientFilter === f ? 'is-active' : ''}" type="button"
            onclick="setClientFilter('${f}')">
      ${f.charAt(0).toUpperCase() + f.slice(1)}
    </button>
  `).join('');
}

function setClientFilter(filter) {
  _clientFilter = filter;
  renderClientFilters();
  renderClientGrid();
}

// ─── Summary Stats ──────────────────────────────────────────

function renderClientSummary() {
  const el = document.getElementById('clientSummaryStrip');
  if (!el) return;

  const active = _clients.filter(c => c.status === 'active').length;
  const leads = _clients.filter(c => c.status === 'lead').length;
  const total = _clients.length;

  el.innerHTML = `
    <div class="stat-mini"><span class="stat-mini-value mono">${active}</span><span class="stat-mini-label">Active Clients</span></div>
    <div class="stat-mini"><span class="stat-mini-value mono">${leads}</span><span class="stat-mini-label">Leads</span></div>
    <div class="stat-mini"><span class="stat-mini-value mono">${total}</span><span class="stat-mini-label">Total</span></div>
  `;
}

// ─── Client Grid ────────────────────────────────────────────

function renderClientGrid() {
  const el = document.getElementById('clientGrid');
  if (!el) return;

  let filtered = _clients;
  if (_clientFilter !== 'all') {
    filtered = filtered.filter(c => c.status === _clientFilter);
  }
  if (_clientSearch) {
    const q = _clientSearch.toLowerCase();
    filtered = filtered.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.photography_type || '').toLowerCase().includes(q) ||
      (c.notes || '').toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    el.innerHTML = `<div class="empty-state" style="padding:48px;text-align:center;color:var(--dim);">
      ${_clients.length === 0 ? 'No clients yet. Click "+ Add Client" to get started.' : 'No clients match your filter.'}
    </div>`;
    return;
  }

  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
    ${filtered.map(c => {
      const initials = (c.name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const colors = ['#f09876','#6bcb77','#a78bfa','#7ba4f7','#f0c75e','#e88d6d','#ec8f95'];
      const color = colors[c.name.charCodeAt(0) % colors.length];
      const statusClass = c.status === 'active' ? 'green' : c.status === 'lead' ? 'yellow' : 'neutral';
      return `
        <div class="card" style="padding:20px;cursor:pointer;" onclick="editClient('${c.id}')">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
            <div style="width:44px;height:44px;border-radius:12px;background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0;">${escapeHtml(initials)}</div>
            <div style="flex:1;min-width:0;">
              <strong style="font-size:15px;">${escapeHtml(c.name)}</strong>
              <div style="font-size:12px;color:var(--dim);">${escapeHtml(c.photography_type || 'Photography')}</div>
            </div>
            <span class="pill small ${statusClass}">${escapeHtml(c.status)}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--dim);">
            <div><span style="display:block;color:var(--muted);">Email</span>${escapeHtml(c.email || '—')}</div>
            <div><span style="display:block;color:var(--muted);">Phone</span>${escapeHtml(c.phone || '—')}</div>
          </div>
          ${c.notes ? `<div style="margin-top:10px;font-size:12px;color:var(--dim);border-top:1px solid var(--border);padding-top:10px;">${escapeHtml(c.notes)}</div>` : ''}
        </div>`;
    }).join('')}
  </div>`;
}

// ─── Add/Edit Client Modal ──────────────────────────────────

function showAddClientModal(existingClient) {
  const existing = document.getElementById('clientModal');
  if (existing) existing.remove();

  const c = existingClient || {};
  const isEdit = !!c.id;

  const modal = document.createElement('div');
  modal.id = 'clientModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;padding:24px;';
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:32px;width:100%;max-width:480px;cursor:default;" onclick="event.stopPropagation();">
      <h2 style="font-size:18px;margin-bottom:20px;">${isEdit ? 'Edit Client' : 'Add Client'}</h2>
      <form id="clientForm">
        <div class="manual-grid" style="gap:12px;">
          <div class="field-group full">
            <label for="clientName">Name *</label>
            <input class="field" id="clientName" type="text" value="${escapeHtml(c.name || '')}" required placeholder="Full name or business name">
          </div>
          <div class="field-group">
            <label for="clientEmail">Email</label>
            <input class="field" id="clientEmail" type="email" value="${escapeHtml(c.email || '')}" placeholder="email@example.com">
          </div>
          <div class="field-group">
            <label for="clientPhone">Phone</label>
            <input class="field" id="clientPhone" type="tel" value="${escapeHtml(c.phone || '')}" placeholder="(555) 123-4567">
          </div>
          <div class="field-group">
            <label for="clientType">Photography Type</label>
            <input class="field" id="clientType" type="text" value="${escapeHtml(c.photography_type || '')}" placeholder="Wedding, Portrait, Commercial...">
          </div>
          <div class="field-group">
            <label for="clientStatus">Status</label>
            <select class="field" id="clientStatus">
              <option value="active" ${c.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="lead" ${c.status === 'lead' ? 'selected' : ''}>Lead</option>
              <option value="archived" ${c.status === 'archived' ? 'selected' : ''}>Archived</option>
            </select>
          </div>
          <div class="field-group full">
            <label for="clientNotes">Notes</label>
            <input class="field" id="clientNotes" type="text" value="${escapeHtml(c.notes || '')}" placeholder="Any notes about this client...">
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">
          ${isEdit ? `<button type="button" class="button ghost" style="margin-right:auto;color:var(--red);" onclick="deleteClient('${c.id}')">Delete</button>` : ''}
          <button type="button" class="button secondary" onclick="document.getElementById('clientModal').remove()">Cancel</button>
          <button type="submit" class="button primary">${isEdit ? 'Save Changes' : 'Add Client'}</button>
        </div>
      </form>
    </div>
  `;
  modal.addEventListener('click', () => modal.remove());
  document.body.appendChild(modal);

  document.getElementById('clientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveClient(c.id);
  });
}

async function saveClient(existingId) {
  const user = await getUser();
  if (!user) return;

  const data = {
    user_id: user.id,
    name: document.getElementById('clientName').value.trim(),
    email: document.getElementById('clientEmail').value.trim(),
    phone: document.getElementById('clientPhone').value.trim(),
    photography_type: document.getElementById('clientType').value.trim(),
    status: document.getElementById('clientStatus').value,
    notes: document.getElementById('clientNotes').value.trim()
  };

  if (!data.name) {
    alert('Client name is required.');
    return;
  }

  let error;
  if (existingId) {
    ({ error } = await sb.from('clients').update(data).eq('id', existingId).eq('user_id', user.id));
  } else {
    ({ error } = await sb.from('clients').insert(data));
  }

  if (error) {
    console.error('Failed to save client:', error.message);
    alert('Failed to save client. Please try again.');
    return;
  }

  document.getElementById('clientModal').remove();
  await loadClients();
}

async function editClient(id) {
  const client = _clients.find(c => c.id === id);
  if (client) showAddClientModal(client);
}

async function deleteClient(id) {
  if (!confirm('Delete this client? This cannot be undone.')) return;

  const user = await getUser();
  if (!user) return;

  const { error } = await sb.from('clients').delete().eq('id', id).eq('user_id', user.id);
  if (error) {
    console.error('Failed to delete client:', error.message);
    alert('Failed to delete client.');
    return;
  }

  document.getElementById('clientModal').remove();
  await loadClients();
}

// ─── Wire up buttons ────────────────────────────────────────

function initClients() {
  if (_clientsInitialized) return;
  _clientsInitialized = true;
  console.log('initClients: starting');

  // Wire "+ Add Client" button
  const addBtn = document.querySelector('#clients .button.primary');
  if (addBtn) {
    addBtn.addEventListener('click', () => showAddClientModal());
  }

  // Wire search
  const searchInput = document.getElementById('clientSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      _clientSearch = e.target.value;
      renderClientGrid();
    });
  }

  loadClients();
}
