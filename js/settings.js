// ═══════════════════════════════════════════════════════════════
// Haus Ledger — Settings Module
// ═══════════════════════════════════════════════════════════════

let _settingsInitialized = false;

async function loadProfile() {
  const user = await getUser();
  if (!user) return;

  const { data: profile } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile) {
    const nameEl = document.getElementById('profileName');
    const bizEl = document.getElementById('businessName');
    const emailEl = document.getElementById('businessEmail');
    const taxEl = document.getElementById('setAside');

    if (nameEl) nameEl.value = profile.full_name || '';
    if (bizEl) bizEl.value = profile.business_name || '';
    if (emailEl) emailEl.value = profile.email || user.email || '';
    if (taxEl) taxEl.value = (profile.tax_rate || 25) + '%';
  }

  // Check for existing logo
  try {
    const { data: logoFiles } = await sb.storage.from('receipts').list(user.id + '/logo');
    if (logoFiles && logoFiles.length > 0) {
      const { data: logoUrl } = await sb.storage.from('receipts').createSignedUrl(
        user.id + '/logo/' + logoFiles[0].name, 600
      );
      if (logoUrl) {
        const preview = document.getElementById('logoPreview');
        if (preview) preview.innerHTML = `<img src="${logoUrl.signedUrl}" style="max-height:50px;border-radius:6px;">`;
      }
    }
  } catch (e) { /* no logo yet */ }
}

async function saveProfile() {
  const user = await getUser();
  if (!user) return;

  const fullName = document.getElementById('profileName').value.trim();
  const businessName = document.getElementById('businessName').value.trim();
  const email = document.getElementById('businessEmail').value.trim();
  const taxStr = document.getElementById('setAside').value.replace('%', '').trim();
  const taxRate = Math.min(Math.max(parseFloat(taxStr) || 25, 0), 60);

  const { error } = await sb
    .from('profiles')
    .update({
      full_name: fullName,
      business_name: businessName,
      email: email,
      tax_rate: taxRate
    })
    .eq('id', user.id);

  if (error) {
    console.error('Failed to save profile:', error.message);
    alert('Failed to save profile.');
    return;
  }

  // Upload logo if selected
  const logoInput = document.getElementById('businessLogoUpload');
  if (logoInput && logoInput.files.length > 0) {
    const file = logoInput.files[0];
    const path = `${user.id}/logo/business-logo.${file.name.split('.').pop()}`;

    // Delete old logo first
    try {
      const { data: oldFiles } = await sb.storage.from('receipts').list(user.id + '/logo');
      if (oldFiles && oldFiles.length > 0) {
        await sb.storage.from('receipts').remove(oldFiles.map(f => user.id + '/logo/' + f.name));
      }
    } catch (e) { /* no old logo */ }

    const { error: uploadError } = await sb.storage
      .from('receipts')
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error('Logo upload failed:', uploadError.message);
    } else {
      const { data: logoUrl } = await sb.storage.from('receipts').createSignedUrl(path, 600);
      if (logoUrl) {
        const preview = document.getElementById('logoPreview');
        if (preview) preview.innerHTML = `<img src="${logoUrl.signedUrl}" style="max-height:50px;border-radius:6px;">`;
      }
    }
  }

  alert('Profile saved.');
}

// ─── CSV Export ─────────────────────────────────────────────

async function exportExpenseCSV() {
  const user = await getUser();
  if (!user) return;

  const { data: transactions } = await sb
    .from('transactions')
    .select('*, category:categories(name)')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .order('date', { ascending: true });

  if (!transactions || transactions.length === 0) {
    alert('No expenses to export.');
    return;
  }

  const headers = ['Date', 'Description', 'Category', 'Amount', 'Tax Deductible', 'Business %'];
  const rows = transactions.map(t => [
    t.date,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.category ? t.category.name : '',
    Math.abs(Number(t.amount)).toFixed(2),
    t.is_tax_deductible ? 'Yes' : 'No',
    t.business_percentage || 100
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, `haus-ledger-expenses-${new Date().toISOString().slice(0, 7)}.csv`, 'text/csv');
}

async function exportMileageCSV() {
  const user = await getUser();
  if (!user) return;

  const { data: entries } = await sb
    .from('mileage_log')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  if (!entries || entries.length === 0) {
    alert('No mileage entries to export.');
    return;
  }

  const headers = ['Date', 'From', 'To', 'Miles', 'IRS Rate', 'Deductible Amount', 'Purpose'];
  const rows = entries.map(m => [
    m.date,
    `"${(m.start_location || '').replace(/"/g, '""')}"`,
    `"${(m.end_location || '').replace(/"/g, '""')}"`,
    Number(m.miles).toFixed(1),
    Number(m.irs_rate).toFixed(4),
    Number(m.deductible_amount || 0).toFixed(2),
    `"${(m.purpose || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, `haus-ledger-mileage-${new Date().toISOString().slice(0, 7)}.csv`, 'text/csv');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Settings Categories ────────────────────────────────────

async function renderSettingsCategoriesList() {
  const el = document.getElementById('settingsCategoryChips');
  if (!el) return;

  const cats = _categories || [];
  el.innerHTML = cats.length > 0
    ? cats.map(c => `<span class="tag-button" style="cursor:default;">${c.name}</span>`).join('')
    : '<span style="color:var(--dim);font-size:13px;">Categories will appear here after loading.</span>';
}

// ─── Init ───────────────────────────────────────────────────

function initSettings() {
  if (_settingsInitialized) return;
  _settingsInitialized = true;
  console.log('initSettings: starting');

  loadProfile();
  renderSettingsCategoriesList();

  // Wire save button
  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveProfile);

  // Wire tax defaults button
  const taxBtn = document.querySelector('#settings .inline-actions .button.primary:not(#saveProfileBtn)');
  if (taxBtn) taxBtn.addEventListener('click', saveProfile);

  // Wire export buttons
  const exportBtns = document.querySelectorAll('#settings .setting-row .button');
  if (exportBtns[0]) exportBtns[0].addEventListener('click', exportExpenseCSV);
  if (exportBtns[1]) exportBtns[1].addEventListener('click', exportTaxPacket);

  // Wire "Export for accountant" in tax center
  const taxExportBtn = document.querySelector('#tax-center .header-actions .button.secondary');
  if (taxExportBtn) taxExportBtn.addEventListener('click', exportTaxPacket);
}

async function exportTaxPacket() {
  await exportExpenseCSV();
  await exportMileageCSV();
  alert('Tax packet exported: expenses CSV + mileage CSV downloaded.');
}
