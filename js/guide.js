// ═══════════════════════════════════════════════════════════════
// Haus Ledger — In-App Guide
// ADHD-friendly walkthrough of every section
// ═══════════════════════════════════════════════════════════════

const GUIDE_SECTIONS = [
  {
    icon: '👋',
    title: 'Welcome to Haus Ledger',
    subtitle: 'Your bookkeeping dashboard in 6 sections',
    body: `
      <p>This guide walks you through everything the app does. Tap any section below to jump there, or read through at your own pace.</p>
      <p style="margin-top:12px;"><strong>The weekly flow:</strong></p>
      <ol style="margin-top:8px;padding-left:20px;line-height:2;">
        <li>Import your bank statement (CSV)</li>
        <li>Categorize new expenses</li>
        <li>Attach receipts to transactions</li>
        <li>Send invoices to clients</li>
        <li>Mark invoices as paid when money lands</li>
        <li>Check your tax set-aside</li>
      </ol>
    `
  },
  {
    icon: '◫',
    title: 'Dashboard',
    subtitle: 'Your home base — everything at a glance',
    nav: 'dashboard',
    body: `
      <div class="guide-features">
        <div class="guide-feature">
          <strong>Stats cards</strong>
          <span>Income, pending invoices, expenses, and profit for this month — updates live.</span>
        </div>
        <div class="guide-feature">
          <strong>Weekly Review</strong>
          <span>5 small tasks to keep your books clean. Check them off each week to build a streak.</span>
        </div>
        <div class="guide-feature">
          <strong>Quick Log</strong>
          <span>Shortcut buttons for your most common expense categories.</span>
        </div>
        <div class="guide-feature">
          <strong>Expense Mix</strong>
          <span>Donut chart showing where your money is going this month.</span>
        </div>
        <div class="guide-feature">
          <strong>6-Month Trend</strong>
          <span>Bar chart comparing income vs expenses over time.</span>
        </div>
        <div class="guide-feature">
          <strong>Import Bank Statement</strong>
          <span>The "Import Bank Statement" button is right here on the dashboard AND on the Expenses page. Upload a CSV from your bank to pull in all your transactions at once.</span>
        </div>
      </div>
    `
  },
  {
    icon: '↗',
    title: 'Income',
    subtitle: 'Track every dollar coming in',
    nav: 'income',
    body: `
      <div class="guide-features">
        <div class="guide-feature">
          <strong>Automatic income</strong>
          <span>When you mark an invoice as "Paid" in the Invoices section, the income shows up here automatically.</span>
        </div>
        <div class="guide-feature">
          <strong>Manual income</strong>
          <span>For cash, Venmo, Zelle, checks, or anything that didn't come through an invoice — use the Log Income form.</span>
        </div>
        <div class="guide-feature">
          <strong>Income by Client</strong>
          <span>See which clients are generating the most revenue this year.</span>
        </div>
      </div>
    `
  },
  {
    icon: '⌁',
    title: 'Expenses',
    subtitle: 'Categorize, attach receipts, stay tax-ready',
    nav: 'expenses',
    body: `
      <div class="guide-features">
        <div class="guide-feature" style="background:rgba(124,109,240,0.08);border:1px solid rgba(124,109,240,0.2);">
          <strong style="color:var(--accent);">📎 Import Bank Statement</strong>
          <span>This is the big button at the top of the Expenses page. Click it, pick your bank's CSV file, and all transactions get imported instantly. Then categorize them one by one below.</span>
        </div>
        <div class="guide-feature">
          <strong>Transaction Review</strong>
          <span>New imports land here as "uncategorized." Pick a category from the dropdown to sort them. Once categorized, they move to the bottom list.</span>
        </div>
        <div class="guide-feature">
          <strong>Attach Receipts</strong>
          <span>Each transaction has an "Attach receipt" button. Snap a photo or upload a file — it gets compressed and stored securely.</span>
        </div>
        <div class="guide-feature">
          <strong>Manual Entry</strong>
          <span>For cash purchases or anything not in your bank feed — pick a category, enter the amount, done.</span>
        </div>
        <div class="guide-feature">
          <strong>Category Totals</strong>
          <span>Right sidebar shows running totals per category. Great for seeing where money goes.</span>
        </div>
      </div>
    `
  },
  {
    icon: '☰',
    title: 'Invoices',
    subtitle: 'Bill clients and track payments',
    nav: 'invoices',
    body: `
      <div class="guide-features">
        <div class="guide-feature">
          <strong>Packages (templates)</strong>
          <span>Pre-built invoice templates: Wedding, Portrait, Event, etc. Click "+ New Package" to create your own with custom line items and prices.</span>
        </div>
        <div class="guide-feature">
          <strong>Creating an invoice</strong>
          <span>Pick a package, type a client name, set the due date, click "Create Invoice." If the client doesn't exist yet, they'll be created automatically.</span>
        </div>
        <div class="guide-feature">
          <strong>Status tracking</strong>
          <span>Draft → Sent → Viewed → Paid (or Overdue). Click any invoice to change its status or edit details.</span>
        </div>
        <div class="guide-feature">
          <strong>Mark as Paid</strong>
          <span>When a client pays, click "Mark Paid" — this automatically creates an income entry on your dashboard.</span>
        </div>
        <div class="guide-feature">
          <strong>PDF export</strong>
          <span>Click the "PDF" button on any invoice to open a printable version.</span>
        </div>
      </div>
    `
  },
  {
    icon: '◌',
    title: 'Clients',
    subtitle: 'Keep track of who you work with',
    nav: 'clients',
    body: `
      <div class="guide-features">
        <div class="guide-feature">
          <strong>Add clients</strong>
          <span>Click "+ Add Client" to enter their name, email, phone, photography type, and notes.</span>
        </div>
        <div class="guide-feature">
          <strong>Status</strong>
          <span>Active = current client. Lead = potential client. Archived = past client. Filter by status using the buttons at the top.</span>
        </div>
        <div class="guide-feature">
          <strong>Auto-created</strong>
          <span>When you create an invoice for a new name, the client gets added automatically. Fill in their details later.</span>
        </div>
      </div>
    `
  },
  {
    icon: '◎',
    title: 'Tax Center',
    subtitle: 'Quarterly estimates, deductions, mileage',
    nav: 'tax-center',
    body: `
      <div class="guide-features">
        <div class="guide-feature">
          <strong>Quarterly Breakdown</strong>
          <span>See estimated tax owed per quarter based on your income minus expenses. The set-aside percentage comes from Settings.</span>
        </div>
        <div class="guide-feature">
          <strong>Deductions Tracker</strong>
          <span>Automatically totals your tax-deductible expenses by category. Compares itemized vs standard deduction.</span>
        </div>
        <div class="guide-feature">
          <strong>Mileage Log</strong>
          <span>Click "Log Trip" to record drives to shoots, meetings, and pickups. Uses the current IRS mileage rate to calculate your deduction.</span>
        </div>
        <div class="guide-feature">
          <strong>Deadlines</strong>
          <span>Shows upcoming quarterly tax payment dates with countdowns.</span>
        </div>
        <div class="guide-feature">
          <strong>Export for Accountant</strong>
          <span>Downloads expense + mileage CSVs your accountant can use directly.</span>
        </div>
      </div>
    `
  },
  {
    icon: '⚙',
    title: 'Settings',
    subtitle: 'Profile, tax defaults, exports',
    nav: 'settings',
    body: `
      <div class="guide-features">
        <div class="guide-feature">
          <strong>Profile</strong>
          <span>Your name, business name, email, and logo. These show up on invoices and exports.</span>
        </div>
        <div class="guide-feature">
          <strong>Tax Settings</strong>
          <span>Set your filing status, state, and set-aside percentage (how much of each payment to save for taxes).</span>
        </div>
        <div class="guide-feature">
          <strong>Export</strong>
          <span>Download monthly expense CSVs or full quarterly tax packets for your accountant.</span>
        </div>
      </div>
    `
  }
];

let _guideStep = 0;

function showGuide() {
  const existing = document.getElementById('guideOverlay');
  if (existing) existing.remove();

  _guideStep = 0;

  const overlay = document.createElement('div');
  overlay.id = 'guideOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;padding:24px;overflow-y:auto;';

  overlay.innerHTML = `
    <div style="width:100%;max-width:600px;max-height:90vh;display:flex;flex-direction:column;" onclick="event.stopPropagation();">
      <div id="guideContent" style="flex:1;overflow-y:auto;"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:16px;border-top:1px solid var(--border);margin-top:16px;flex-shrink:0;">
        <div style="display:flex;gap:4px;" id="guideDots"></div>
        <div style="display:flex;gap:8px;">
          <button id="guidePrev" onclick="guideNav(-1)" style="padding:8px 16px;background:var(--surface-raised);color:var(--text);border:1px solid var(--border);border-radius:10px;font-size:13px;cursor:pointer;">Back</button>
          <button id="guideNext" onclick="guideNav(1)" style="padding:8px 20px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;">Next</button>
          <button onclick="closeGuide()" style="padding:8px 16px;background:none;color:var(--dim);border:none;font-size:13px;cursor:pointer;">Close</button>
        </div>
      </div>
    </div>
  `;
  overlay.addEventListener('click', closeGuide);
  document.body.appendChild(overlay);
  renderGuideStep();
}

function renderGuideStep() {
  const section = GUIDE_SECTIONS[_guideStep];
  const content = document.getElementById('guideContent');
  const dots = document.getElementById('guideDots');
  const prevBtn = document.getElementById('guidePrev');
  const nextBtn = document.getElementById('guideNext');
  if (!content) return;

  dots.innerHTML = GUIDE_SECTIONS.map((s, i) => `
    <button onclick="_guideStep=${i};renderGuideStep();" style="width:${i === _guideStep ? '24px' : '8px'};height:8px;border-radius:4px;background:${i === _guideStep ? 'var(--accent)' : 'var(--border)'};border:none;cursor:pointer;transition:all 200ms;" title="${s.title}"></button>
  `).join('');

  prevBtn.style.display = _guideStep === 0 ? 'none' : '';
  nextBtn.textContent = _guideStep === GUIDE_SECTIONS.length - 1 ? 'Done' : 'Next';

  content.innerHTML = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:40px;margin-bottom:12px;">${section.icon}</div>
      <h2 style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:6px;">${section.title}</h2>
      <p style="font-size:14px;color:var(--dim);">${section.subtitle}</p>
    </div>
    <div style="font-size:14px;color:var(--text);line-height:1.7;">
      ${section.body}
    </div>
    ${section.nav ? `<button onclick="closeGuide();document.querySelector('[data-section-trigger=${section.nav}]').click();" style="display:block;margin:16px auto 0;padding:8px 20px;background:var(--surface-raised);color:var(--accent);border:1px solid rgba(124,109,240,0.3);border-radius:10px;font-size:13px;cursor:pointer;">Go to ${section.title}</button>` : ''}
  `;
}

function guideNav(dir) {
  if (dir === 1 && _guideStep === GUIDE_SECTIONS.length - 1) {
    closeGuide();
    return;
  }
  _guideStep = Math.max(0, Math.min(GUIDE_SECTIONS.length - 1, _guideStep + dir));
  renderGuideStep();
}

function closeGuide() {
  const overlay = document.getElementById('guideOverlay');
  if (overlay) overlay.remove();
}
