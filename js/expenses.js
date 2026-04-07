// ═══════════════════════════════════════════════════════════════
// LensLedger — Expenses Module
// Handles: manual entry, transaction list, categories, receipts
// ═══════════════════════════════════════════════════════════════

let _categories = [];
let _transactions = [];
let _selectedCategory = null;
let _expensesInitialized = false;

// ─── Load Categories from Supabase ──────────────────────────

async function loadCategories() {
  const user = await getUser();
  if (!user) return;

  const { data, error } = await sb
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .order('sort_order');

  if (error) {
    console.error('Failed to load categories:', error.message);
    return;
  }
  _categories = data || [];
  renderCategoryGrid();
  renderCategoryTotals();
}

// ─── Render Category Buttons (Manual Entry) ─────────────────

function renderCategoryGrid() {
  const grid = document.getElementById('manualCategoryGrid');
  if (!grid) return;

  grid.innerHTML = _categories.map(cat => `
    <button type="button" class="tag-button ${_selectedCategory === cat.id ? 'is-active' : ''}"
            data-category-id="${cat.id}" onclick="selectCategory('${cat.id}')">
      ${escapeHtml(cat.name)}
    </button>
  `).join('');
}

function selectCategory(id) {
  _selectedCategory = _selectedCategory === id ? null : id;
  renderCategoryGrid();
}

// ─── Load Transactions ──────────────────────────────────────

async function loadTransactions() {
  const user = await getUser();
  if (!user) return;

  const { data, error } = await sb
    .from('transactions')
    .select('*, category:categories(id, name, icon, color), receipts(id, storage_path, filename)')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .order('date', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to load transactions:', error.message);
  }
  _transactions = data || [];
  renderTransactionList();
  renderCategoryTotals();
  updateExpensesSummary();
}

// ─── Render Transaction List ────────────────────────────────

function renderTransactionList() {
  const listEl = document.getElementById('transactionList');
  const catListEl = document.getElementById('categorizedList');
  if (!listEl) return;

  const uncategorized = _transactions.filter(t => !t.category_id);
  const categorized = _transactions.filter(t => t.category_id);

  listEl.innerHTML = uncategorized.length > 0
    ? uncategorized.map(t => renderTransactionRow(t, false)).join('')
    : '<div class="empty-state" style="padding:24px;text-align:center;color:var(--dim);">No uncategorized transactions. You\'re all caught up!</div>';

  if (catListEl) {
    catListEl.innerHTML = categorized.length > 0
      ? categorized.map(t => renderTransactionRow(t, true)).join('')
      : '<div class="empty-state" style="padding:24px;text-align:center;color:var(--dim);">No categorized transactions yet.</div>';
  }

  // Update pills
  const uncatPill = document.getElementById('uncategorizedPill');
  if (uncatPill) uncatPill.textContent = `${uncategorized.length} uncategorized`;

  const reviewPill = document.getElementById('reviewQueuePill');
  if (reviewPill) reviewPill.textContent = `${uncategorized.length} awaiting review`;
}

function renderTransactionRow(t, isCategorized) {
  const cat = t.category;
  const dateStr = new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const hasReceipt = t.receipts && t.receipts.length > 0;
  const amountStr = `$${Math.abs(t.amount).toFixed(2)}`;
  const receiptBadge = hasReceipt
    ? `<span class="pill small green" style="cursor:pointer;" onclick="previewReceipt('${t.receipts[0].storage_path}', '${escapeHtml(t.receipts[0].filename || 'Receipt')}')">Receipt attached — view</span>`
    : `<label class="pill small yellow" style="cursor:pointer;">Attach receipt <input type="file" accept="image/*,.pdf" style="display:none;" onchange="handleInlineReceipt('${t.id}', this)"></label>`;

  if (isCategorized) {
    return `
      <div class="transaction-row categorized" data-id="${t.id}" style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--border);">
        <div style="min-width:50px;color:var(--dim);font-size:13px;">${dateStr}</div>
        <div style="flex:1;min-width:0;">
          <strong style="font-size:14px;">${escapeHtml(t.description || t.merchant || 'Expense')}</strong>
          <div style="font-size:12px;color:var(--dim);margin-top:2px;">${cat ? escapeHtml(cat.name) : 'Uncategorized'}</div>
        </div>
        <span class="mono" style="font-size:14px;font-weight:600;">$${Math.abs(t.amount).toFixed(2)}</span>
        <div style="display:flex;gap:6px;align-items:center;">
          ${cat ? `<span class="pill small" style="background:${cat.color}22;color:${cat.color}">${escapeHtml(cat.name)}</span>` : ''}
          ${receiptBadge}
        </div>
        <button class="button small ghost" onclick="deleteTransaction('${t.id}')" title="Delete" style="opacity:0.5;">x</button>
      </div>`;
  }

  return `
    <div class="transaction-row uncategorized" data-id="${t.id}" style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--border);">
      <div style="min-width:50px;color:var(--dim);font-size:13px;">${dateStr}</div>
      <div style="flex:1;min-width:0;">
        <strong style="font-size:14px;">${escapeHtml(t.description || t.merchant || 'Expense')}</strong>
      </div>
      <span class="mono" style="font-size:14px;font-weight:600;">$${Math.abs(t.amount).toFixed(2)}</span>
      <div style="display:flex;gap:6px;align-items:center;">
        <select class="field small" onchange="categorizeTransaction('${t.id}', this.value)" style="min-width:140px;">
          <option value="">Select category...</option>
          ${_categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
        </select>
        ${receiptBadge}
      </div>
      <button class="button small ghost" onclick="deleteTransaction('${t.id}')" title="Delete" style="opacity:0.5;">x</button>
    </div>`;
}

async function handleInlineReceipt(transactionId, input) {
  if (!input.files.length) return;
  await uploadReceipt(transactionId, input.files[0]);
  await loadTransactions();
}

async function previewReceipt(storagePath, filename) {
  const { data, error } = await sb.storage
    .from('receipts')
    .createSignedUrl(storagePath, 300); // 5 min expiry

  if (error) {
    console.error('Failed to get receipt URL:', error.message);
    alert('Could not load receipt preview.');
    return;
  }

  // Remove existing modal if any
  const existing = document.getElementById('receiptPreviewModal');
  if (existing) existing.remove();

  const isPdf = storagePath.toLowerCase().endsWith('.pdf');
  const contentHtml = isPdf
    ? `<iframe src="${data.signedUrl}" style="width:100%;height:80vh;border:none;border-radius:8px;"></iframe>`
    : `<img src="${data.signedUrl}" style="max-width:100%;max-height:80vh;border-radius:8px;object-fit:contain;">`;

  const modal = document.createElement('div');
  modal.id = 'receiptPreviewModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;cursor:pointer;';
  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:700px;margin-bottom:12px;">
      <span style="color:var(--dim);font-size:13px;">${escapeHtml(filename)}</span>
      <button style="color:var(--text);background:var(--surface-raised);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer;" onclick="document.getElementById('receiptPreviewModal').remove()">Close</button>
    </div>
    <div style="cursor:default;" onclick="event.stopPropagation();">
      ${contentHtml}
    </div>
  `;
  modal.addEventListener('click', () => modal.remove());
  document.body.appendChild(modal);
}

// ─── Categorize a Transaction ───────────────────────────────

async function categorizeTransaction(transactionId, categoryId) {
  if (!categoryId) return;

  const cat = _categories.find(c => c.id === categoryId);
  const { error } = await sb
    .from('transactions')
    .update({
      category_id: categoryId,
      is_tax_deductible: cat ? cat.is_tax_deductible : false
    })
    .eq('id', transactionId);

  if (error) {
    console.error('Failed to categorize:', error.message);
    return;
  }
  await loadTransactions();
}

// ─── Delete Transaction ─────────────────────────────────────

async function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;

  const user = await getUser();
  if (!user) return;

  const { error } = await sb
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to delete:', error.message);
    return;
  }
  await loadTransactions();
}

// ─── Manual Entry Form ──────────────────────────────────────

function initManualExpenseForm() {
  const form = document.getElementById('manualExpenseForm');
  if (!form) return;

  // Set default date to today
  const dateInput = document.getElementById('manualDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = await getUser();
    if (!user) return;

    const amount = parseFloat(document.getElementById('manualAmount').value);
    const date = document.getElementById('manualDate').value;
    const note = document.getElementById('manualNote').value.trim();

    if (!amount || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (!_selectedCategory) {
      alert('Please select a category.');
      return;
    }

    const cat = _categories.find(c => c.id === _selectedCategory);

    const { data: inserted, error } = await sb
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'expense',
        amount: amount,
        date: date,
        description: note || (cat ? cat.name + ' expense' : 'Expense'),
        category_id: _selectedCategory,
        is_tax_deductible: cat ? cat.is_tax_deductible : false,
        is_business: true,
        business_percentage: 100
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add expense:', error.message);
      alert('Failed to add expense. Please try again.');
      return;
    }

    // Upload receipt if provided
    const receiptInput = document.getElementById('manualReceipt');
    if (receiptInput && receiptInput.files.length > 0 && inserted) {
      await uploadReceipt(inserted.id, receiptInput.files[0]);
    }

    // Reset form
    form.reset();
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    _selectedCategory = null;
    renderCategoryGrid();

    // Reload data
    await loadTransactions();
  });
}

// ─── Category Totals ────────────────────────────────────────

function renderCategoryTotals() {
  const listEl = document.getElementById('categoryTotalsList');
  if (!listEl) return;

  // Sum by category
  const totals = {};
  for (const t of _transactions) {
    if (!t.category_id || !t.category) continue;
    const catId = t.category_id;
    if (!totals[catId]) {
      totals[catId] = { ...t.category, total: 0 };
    }
    totals[catId].total += Math.abs(t.amount);
  }

  const sorted = Object.values(totals).sort((a, b) => b.total - a.total);
  const grandTotal = sorted.reduce((sum, c) => sum + c.total, 0);

  listEl.innerHTML = sorted.length > 0
    ? sorted.map(c => `
        <div class="category-total-row">
          <span class="category-icon" style="background:${c.color}22;color:${c.color}">${escapeHtml(c.icon)}</span>
          <div class="category-total-info">
            <strong>${escapeHtml(c.name)}</strong>
            <span>Running total for April</span>
          </div>
          <span class="mono" style="color:${c.color}"><strong>$${c.total.toFixed(2)}</strong></span>
        </div>
      `).join('')
    : '<div class="empty-state" style="padding:24px;text-align:center;color:var(--dim);">No expenses logged yet. Add one above!</div>';

  // Update header total
  const headerTotal = document.getElementById('expensesHeaderTotal');
  if (headerTotal) headerTotal.textContent = `$${grandTotal.toFixed(2)}`;
}

// ─── Summary Stats ──────────────────────────────────────────

function updateExpensesSummary() {
  const categorized = _transactions.filter(t => t.category_id);
  const uncategorized = _transactions.filter(t => !t.category_id);
  const withReceipt = _transactions.filter(t => t.receipt && t.receipt.length > 0);
  const missingReceipt = _transactions.filter(t => !t.receipt || t.receipt.length === 0);

  const el = (id, text) => {
    const e = document.getElementById(id);
    if (e) e.textContent = text;
  };

  el('categorizedHeadline', `${categorized.length} categorized this month`);
  el('categorizedPill', `${categorized.length} ready`);
  el('missingReceiptHeadline', `${missingReceipt.length} transactions missing receipts`);
  el('receiptMissingPill', `${missingReceipt.length} open`);
  el('receiptQueueBadge', `${missingReceipt.length} missing`);
  el('receiptHighlightTitle', `${missingReceipt.length} transactions missing receipts`);

  // Top category
  const totals = {};
  for (const t of categorized) {
    if (!t.category) continue;
    const name = t.category.name;
    totals[name] = (totals[name] || 0) + Math.abs(t.amount);
  }
  const topCat = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    el('topCategoryHeadline', `${topCat[0]} leads April spend`);
    el('topCategoryPill', topCat[0]);
  }
}

// ─── Receipt Upload ─────────────────────────────────────────

async function uploadReceipt(transactionId, file) {
  const user = await getUser();
  if (!user) return;

  if (!validateFileType(file)) {
    alert('Only images and PDFs are allowed.');
    return;
  }

  console.log('uploadReceipt: starting', file.name, file.type, file.size);

  let uploadFile = file;
  let contentType = file.type || 'application/octet-stream';

  // Convert HEIC/HEIF (iPhone photos) to JPEG using heic2any library
  const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';

  if (isHeic && typeof heic2any !== 'undefined') {
    try {
      console.log('uploadReceipt: converting HEIC to JPEG...');
      const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
      const converted = Array.isArray(blob) ? blob[0] : blob;
      uploadFile = new File([converted], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
      contentType = 'image/jpeg';
      console.log('uploadReceipt: HEIC converted to JPEG', uploadFile.size);
    } catch (e) {
      console.warn('HEIC conversion failed, uploading original:', e);
    }
  }

  // Compress standard images if over 300KB
  const compressible = ['image/jpeg', 'image/png', 'image/webp'];
  if (uploadFile.size > 300 * 1024 && compressible.includes(contentType)) {
    try {
      uploadFile = await compressImage(uploadFile, 300 * 1024);
      contentType = 'image/jpeg';
    } catch (e) {
      console.warn('Compression failed, uploading as-is:', e);
    }
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${user.id}/${Date.now()}-${safeName}`;

  const { data, error } = await sb.storage
    .from('receipts')
    .upload(path, uploadFile, {
      contentType: contentType,
      upsert: false
    });

  if (error) {
    console.error('Receipt upload failed:', error.message);
    alert('Failed to upload receipt: ' + error.message);
    return;
  }

  console.log('uploadReceipt: file uploaded to', path);

  const { error: dbError } = await sb
    .from('receipts')
    .insert({
      user_id: user.id,
      transaction_id: transactionId,
      storage_path: path,
      filename: file.name,
      file_size: uploadFile.size
    });

  if (dbError) {
    console.error('Failed to save receipt reference:', dbError.message);
    alert('File uploaded but failed to link to expense: ' + dbError.message);
    return;
  }

  console.log('uploadReceipt: done');
}

function compressImage(file, maxSize) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if very large
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
          'image/jpeg',
          0.7
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── CSV Import ─────────────────────────────────────────────

async function importCSV(file) {
  const user = await getUser();
  if (!user) return;

  const text = await file.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    alert('CSV file appears to be empty.');
    return;
  }

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const descIdx = headers.findIndex(h => h.includes('description') || h.includes('memo') || h.includes('merchant'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('debit'));

  if (dateIdx === -1 || amountIdx === -1) {
    alert('Could not find date and amount columns in CSV. Make sure your file has "Date" and "Amount" headers.');
    return;
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
    const amount = Math.abs(parseFloat(cols[amountIdx]));
    if (isNaN(amount) || amount === 0) continue;

    // Validate date format (YYYY-MM-DD or common date formats)
    const rawDate = cols[dateIdx];
    const parsedDate = new Date(rawDate);
    if (!rawDate || isNaN(parsedDate.getTime())) continue;

    // Normalize to YYYY-MM-DD
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const normalizedDate = `${year}-${month}-${day}`;

    rows.push({
      user_id: user.id,
      type: 'expense',
      amount: amount,
      date: normalizedDate,
      description: descIdx >= 0 ? cols[descIdx] : '',
      merchant: descIdx >= 0 ? cols[descIdx] : '',
      is_business: true,
      business_percentage: 100
    });
  }

  if (rows.length === 0) {
    alert('No valid transactions found in CSV.');
    return;
  }

  const { error } = await sb.from('transactions').insert(rows);

  if (error) {
    console.error('CSV import failed:', error.message);
    alert('Failed to import CSV. Please check the file format.');
    return;
  }

  alert(`Imported ${rows.length} transactions! Categorize them in the review flow.`);
  await loadTransactions();
}

// ─── Initialize ─────────────────────────────────────────────

async function initExpenses() {
  if (_expensesInitialized) return;
  _expensesInitialized = true;
  console.log('initExpenses: starting');
  try {
    await loadCategories();
    console.log('initExpenses: categories loaded:', _categories.length);
  } catch (e) {
    console.error('initExpenses: categories failed:', e);
  }
  try {
    await loadTransactions();
    console.log('initExpenses: transactions loaded:', _transactions.length);
  } catch (e) {
    console.error('initExpenses: transactions failed:', e);
  }
  initManualExpenseForm();
  console.log('initExpenses: form handler attached');
}
