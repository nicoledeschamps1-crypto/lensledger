// ═══════════════════════════════════════════════════════════════
// Haus Ledger — Onboarding Flow for First-Time Users
// ═══════════════════════════════════════════════════════════════

let _onboardingStep = 0;
const ONBOARDING_STEPS = 4;

async function checkOnboarding() {
  const user = await getUser();
  if (!user) return;

  // Check if user has completed onboarding
  const { data: profile } = await sb
    .from('profiles')
    .select('business_name, full_name')
    .eq('id', user.id)
    .single();

  // If they have a business name set, they've been onboarded
  if (profile && profile.business_name) return;

  // Check localStorage as fallback — skip if already dismissed
  if (localStorage.getItem('haus-ledger-onboarded')) return;

  // Show onboarding
  showOnboarding(profile);
}

function showOnboarding(profile) {
  const overlay = document.createElement('div');
  overlay.id = 'onboardingOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#131318;display:flex;align-items:center;justify-content:center;padding:24px;overflow-y:auto;color:#e8e8ed;font-family:Inter,-apple-system,sans-serif;';

  overlay.innerHTML = `
    <div style="width:100%;max-width:520px;">
      <div id="onboardingContent"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:24px;">
        <div id="onboardingDots" style="display:flex;gap:6px;"></div>
        <div style="display:flex;gap:10px;">
          <button id="onboardSkip" onclick="finishOnboarding(true)" style="font-size:13px;color:#9898a8;background:none;border:none;cursor:pointer;padding:10px 16px;">Skip for now</button>
          <button id="onboardNext" onclick="nextOnboardingStep()" style="padding:10px 24px;background:#7c6df0;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:500;cursor:pointer;">Continue</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  _onboardingStep = 0;
  renderOnboardingStep(profile);
}

function renderOnboardingStep(profile) {
  const content = document.getElementById('onboardingContent');
  const dots = document.getElementById('onboardingDots');
  const nextBtn = document.getElementById('onboardNext');
  if (!content) return;

  // Dots
  dots.innerHTML = Array.from({ length: ONBOARDING_STEPS }, (_, i) =>
    `<div style="width:8px;height:8px;border-radius:50%;background:${i === _onboardingStep ? 'var(--accent)' : 'var(--border)'};transition:background 200ms;"></div>`
  ).join('');

  const userName = profile?.full_name || '';

  switch (_onboardingStep) {
    case 0:
      nextBtn.textContent = 'Get started';
      content.innerHTML = `
        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:36px;font-weight:700;color:#e8e8ed;margin-bottom:16px;letter-spacing:-0.5px;">Welcome to Haus Ledger</div>
          <p style="font-size:16px;color:#9898a8;line-height:1.6;max-width:420px;margin:0 auto;">
            Simple bookkeeping built for freelance photographers. Let's get your studio set up in about 60 seconds.
          </p>
        </div>
      `;
      break;

    case 1:
      nextBtn.textContent = 'Continue';
      content.innerHTML = `
        <div style="margin-bottom:8px;">
          <h2 style="font-size:20px;margin-bottom:4px;color:#e8e8ed;">About your studio</h2>
          <p style="color:#9898a8;font-size:14px;">This appears on your invoices and exports.</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;margin-top:20px;">
          <div style="margin-bottom:4px;">
            <label for="obName">Your name</label>
            <input class="field" id="obName" type="text" value="${userName}" placeholder="Full name" autofocus>
          </div>
          <div style="margin-bottom:4px;">
            <label for="obBusiness">Business name</label>
            <input class="field" id="obBusiness" type="text" placeholder="e.g. Sabrina Lee Photography">
          </div>
          <div style="margin-bottom:4px;">
            <label for="obEmail">Contact email</label>
            <input class="field" id="obEmail" type="email" placeholder="For invoices and client communication">
          </div>
        </div>
      `;
      break;

    case 2:
      nextBtn.textContent = 'Continue';
      content.innerHTML = `
        <div style="margin-bottom:8px;">
          <h2 style="font-size:20px;margin-bottom:4px;color:#e8e8ed;">What do you shoot?</h2>
          <p style="color:#9898a8;font-size:14px;">This helps us set up invoice templates. Pick all that apply.</p>
        </div>
        <div id="obShootTypes" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;">
          ${['Wedding', 'Portrait', 'Commercial', 'Event', 'Brand', 'Real Estate', 'Food', 'Fashion', 'Other'].map(t =>
            `<button type="button" data-type="${t}" onclick="this.dataset.selected = this.dataset.selected === 'true' ? 'false' : 'true'; this.style.background = this.dataset.selected === 'true' ? 'rgba(124,109,240,0.15)' : 'rgba(255,255,255,0.05)'; this.style.borderColor = this.dataset.selected === 'true' ? 'rgba(124,109,240,0.3)' : 'rgba(255,255,255,0.1)'; this.style.color = this.dataset.selected === 'true' ? '#7c6df0' : '#e8e8ed';" data-selected="false" style="padding:8px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#e8e8ed;font-size:13px;cursor:pointer;">${t}</button>`
          ).join('')}
        </div>
      `;
      break;

    case 3:
      nextBtn.textContent = 'Finish setup';
      content.innerHTML = `
        <div style="margin-bottom:8px;">
          <h2 style="font-size:20px;margin-bottom:4px;color:#e8e8ed;">Tax set-aside</h2>
          <p style="color:#9898a8;font-size:14px;">As a freelancer, you owe estimated taxes quarterly. We'll help you track how much to set aside.</p>
        </div>
        <div style="margin-top:20px;">
          <div style="margin-bottom:4px;">
            <label for="obTaxRate">Set-aside percentage</label>
            <input class="field mono" id="obTaxRate" type="number" min="0" max="50" value="25" style="max-width:120px;">
            <p style="font-size:12px;color:#9898a8;margin-top:6px;">
              Most freelance photographers use 25-30%. This isn't your actual tax rate — it's how much of each payment you set aside for taxes. You can change this anytime in Settings.
            </p>
          </div>
        </div>
        <div style="margin-top:20px;">
          <div style="margin-bottom:4px;">
            <label for="obLogo">Business logo (optional)</label>
            <input class="field" id="obLogo" type="file" accept="image/*" style="padding:8px;">
            <p style="font-size:12px;color:#9898a8;margin-top:6px;">Shows on your invoices. You can add this later in Settings too.</p>
          </div>
        </div>
      `;
      break;
  }
}

async function nextOnboardingStep() {
  // Save data from current step before advancing
  if (_onboardingStep === 1) {
    // Validate name
    const name = document.getElementById('obName')?.value.trim();
    const biz = document.getElementById('obBusiness')?.value.trim();
    if (!biz) {
      alert('Please enter a business name — this shows on your invoices.');
      return;
    }
    // Store temporarily
    window._obData = window._obData || {};
    window._obData.name = name;
    window._obData.business = biz;
    window._obData.email = document.getElementById('obEmail')?.value.trim();
  }

  if (_onboardingStep === 2) {
    const selected = document.querySelectorAll('#obShootTypes button[data-selected="true"]');
    window._obData = window._obData || {};
    window._obData.shootTypes = Array.from(selected).map(b => b.dataset.type);
  }

  if (_onboardingStep === 3) {
    // Final step — save everything
    await saveOnboardingData();
    return;
  }

  _onboardingStep++;
  renderOnboardingStep({ full_name: window._obData?.name || '' });
}

async function saveOnboardingData() {
  const user = await getUser();
  if (!user) return;

  const data = window._obData || {};
  const taxRate = parseFloat(document.getElementById('obTaxRate')?.value) || 25;

  // Save profile
  const { error } = await sb.from('profiles').update({
    full_name: data.name || '',
    business_name: data.business || '',
    email: data.email || '',
    tax_rate: taxRate
  }).eq('id', user.id);

  if (error) {
    console.error('Onboarding save failed:', error.message);
  }

  // Upload logo if provided
  const logoInput = document.getElementById('obLogo');
  if (logoInput && logoInput.files.length > 0) {
    const file = logoInput.files[0];
    const path = `${user.id}/logo/business-logo.${file.name.split('.').pop()}`;
    await sb.storage.from('receipts').upload(path, file, { contentType: file.type, upsert: true });
  }

  finishOnboarding(false);
}

function finishOnboarding(skipped) {
  const overlay = document.getElementById('onboardingOverlay');
  if (overlay) overlay.remove();
  window._obData = null;
  localStorage.setItem('haus-ledger-onboarded', 'true');

  if (!skipped) {
    // Reload modules with new profile data
    loadProfile();
    loadClients();
    loadInvoices();
  }
}
