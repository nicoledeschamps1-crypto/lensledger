const mockToday = new Date("2026-04-07T12:00:00-04:00");
    const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    const moneyPrecise = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const expenseCategories = [
      "Gear",
      "Mileage",
      "Software",
      "Home Office",
      "Props",
      "Travel",
      "Meals",
      "Insurance",
      "Marketing",
      "Education",
      "Other"
    ];

    const categoryIcons = {
      "Gear": "📸",
      "Mileage": "🚗",
      "Software": "💻",
      "Home Office": "🪑",
      "Props": "🎬",
      "Travel": "✈️",
      "Meals": "🍽️",
      "Insurance": "🛡️",
      "Marketing": "📣",
      "Education": "🎓",
      "Other": "🗂️"
    };

    const palette = [
      "linear-gradient(135deg, #7c6df0 0%, #6b9cf0 100%)",
      "linear-gradient(135deg, #6b9cf0 0%, #5ec269 100%)",
      "linear-gradient(135deg, #e88d6d 0%, #e8b84a 100%)",
      "linear-gradient(135deg, #5ec269 0%, #7c6df0 100%)",
      "linear-gradient(135deg, #6b9cf0 0%, #e88d6d 100%)",
      "linear-gradient(135deg, #e8b84a 0%, #7c6df0 100%)"
    ];

    const state = {
      currentSection: "dashboard",
      reviewTasks: [
        { id: "review-bank", title: "Review bank feed", detail: "Clear uncategorized transactions.", checked: true },
        { id: "match-receipts", title: "Match receipts", detail: "Attach this week’s missing proof.", checked: true },
        { id: "send-reminders", title: "Send invoice reminders", detail: "Ping two overdue balances.", checked: false },
        { id: "transfer-tax", title: "Transfer tax set-aside", detail: "Move funds before Friday.", checked: true },
        { id: "book-admin", title: "Schedule admin hour", detail: "Lock next Friday review block.", checked: false }
      ],
      reviewBaseStreak: 4,
      quickLogItems: [
        { icon: "🚗", title: "Parking", subtitle: "Client garages + meters" },
        { icon: "☕", title: "Coffee", subtitle: "Client meetings" },
        { icon: "💾", title: "SD Cards", subtitle: "Consumables + media" },
        { icon: "🚕", title: "Ride Share", subtitle: "Shoot-day transit" },
        { icon: "🕯", title: "Props", subtitle: "Small styling extras" },
        { icon: "☁️", title: "Software", subtitle: "Renewals + add-ons" }
      ],
      donutLegend: [
        { label: "Travel", amount: 382, color: "var(--coral)" },
        { label: "Gear", amount: 412, color: "var(--blue)" },
        { label: "Home Office", amount: 186, color: "var(--yellow)" },
        { label: "Mileage", amount: 148, color: "var(--green)" }
      ],
      activityFeed: [
        { icon: "✅", title: "Invoice LL-2041 paid by Common Ground Studio", detail: "Deposit hit Mercury and was auto-matched to invoice.", amount: "+$800", tone: "green" },
        { icon: "🧾", title: "Receipt matched to B&H Photo transaction", detail: "Gear purchase for LED panel replacement.", amount: "Ready", tone: "blue" },
        { icon: "💸", title: "Q1 estimated tax payment exported", detail: "Packet prepared and moved into accountant share folder.", amount: "Filed", tone: "yellow" },
        { icon: "✈️", title: "Delta airfare categorized as Travel", detail: "Commercial portrait trip for Archer Brand Studio.", amount: "-$382", tone: "coral" },
        { icon: "🔔", title: "Westfield Coffee invoice now overdue", detail: "Reminder drafted and ready to send today.", amount: "2 days late", tone: "red" }
      ],
      recurringExpenses: [
        { icon: "🎞", title: "Adobe Creative Cloud", detail: "Editing suite · due Apr 11", amount: "$59/mo", tone: "blue" },
        { icon: "🖼", title: "Pixieset", detail: "Gallery delivery · renews Apr 18", amount: "$28/mo", tone: "green" },
        { icon: "📚", title: "QuickBooks", detail: "Accounting sync backup · renews Apr 20", amount: "$34/mo", tone: "yellow" },
        { icon: "🛡", title: "Studio Insurance", detail: "Equipment coverage · renews Apr 28", amount: "$92/mo", tone: "coral" }
      ],
      trendData: [
        { month: "Nov", income: 3800, expenses: 980 },
        { month: "Dec", income: 4450, expenses: 1210 },
        { month: "Jan", income: 3120, expenses: 940 },
        { month: "Feb", income: 4620, expenses: 1335 },
        { month: "Mar", income: 4110, expenses: 1140 },
        { month: "Apr", income: 4850, expenses: 1340 }
      ],
      uncategorizedTransactions: [
        { id: "txn-1", month: "Apr", day: "06", merchant: "B&H Photo", amount: 412.50, category: "Gear", confidence: 95, account: "Mercury Visa • 4821", note: "LED panel replacement for spring wedding kit", receipt: true, split: false },
        { id: "txn-2", month: "Apr", day: "05", merchant: "Shell Midtown", amount: 68.12, category: "Mileage", confidence: 92, account: "Mercury Visa • 4821", note: "Fuel for two-location portrait session", receipt: false, split: false },
        { id: "txn-3", month: "Apr", day: "04", merchant: "Notion Labs", amount: 12.00, category: "Software", confidence: 99, account: "Mercury Visa • 4821", note: "Client planning workspace", receipt: true, split: false },
        { id: "txn-4", month: "Apr", day: "04", merchant: "IKEA Brooklyn", amount: 186.40, category: "Home Office", confidence: 81, account: "Mercury Visa • 4821", note: "Editing chair and cable storage", receipt: false, split: true },
        { id: "txn-5", month: "Apr", day: "03", merchant: "Sweetgreen SoHo", amount: 28.94, category: "Meals", confidence: 76, account: "Mercury Visa • 4821", note: "Client lunch between location scout and walkthrough", receipt: true, split: false },
        { id: "txn-6", month: "Apr", day: "02", merchant: "Delta Airlines", amount: 382.20, category: "Travel", confidence: 88, account: "Mercury Visa • 4821", note: "Commercial portrait travel to Chicago", receipt: false, split: false }
      ],
      categorizedTransactions: [
        { id: "cat-1", month: "Apr", day: "01", merchant: "Meta Ads", amount: 140.00, category: "Marketing", confidence: 97, account: "Mercury Visa • 4821", note: "Lead generation ad spend", receipt: true, source: "Confirmed automatically" },
        { id: "cat-2", month: "Mar", day: "31", merchant: "Skillshare", amount: 24.00, category: "Education", confidence: 90, account: "Mercury Visa • 4821", note: "Lighting course renewal", receipt: true, source: "Confirmed automatically" },
        { id: "cat-3", month: "Mar", day: "29", merchant: "State Farm", amount: 210.00, category: "Insurance", confidence: 100, account: "Mercury ACH", note: "Annual equipment rider installment", receipt: true, source: "Recurring rule" },
        { id: "cat-4", month: "Mar", day: "28", merchant: "Canal Props", amount: 96.00, category: "Props", confidence: 84, account: "Mercury Visa • 4821", note: "Background fabric and table styling", receipt: true, source: "Confirmed automatically" }
      ],
      categorizedCollapsed: false,
      manualCategory: "Gear",
      invoiceFilter: "all",
      invoiceTemplate: "Wedding",
      clientSearch: "",
      clientStatus: "all",
      invoices: [
        {
          id: "LL-2047",
          client: "Lena & Miles",
          type: "Wedding",
          amount: 2400,
          dateSent: "Apr 2, 2026",
          dueDate: "Apr 16, 2026",
          status: "viewed",
          note: "Final gallery payment due before album design begins.",
          items: [
            { label: "Wedding collection balance", amount: 2200 },
            { label: "Rush teaser delivery", amount: 200 }
          ]
        },
        {
          id: "LL-2046",
          client: "Westfield Coffee",
          type: "Brand",
          amount: 1100,
          dateSent: "Mar 20, 2026",
          dueDate: "Mar 30, 2026",
          status: "overdue",
          note: "Reminder drafted. Client asked for a revised usage line, but payment is still outstanding.",
          items: [
            { label: "Spring menu photo update", amount: 900 },
            { label: "Social crop exports", amount: 200 }
          ]
        },
        {
          id: "LL-2045",
          client: "Nora Patel",
          type: "Portrait",
          amount: 450,
          dateSent: "Apr 5, 2026",
          dueDate: "Apr 19, 2026",
          status: "sent",
          note: "Mini portrait session invoice sent after gallery proof delivery.",
          items: [
            { label: "Portrait session", amount: 350 },
            { label: "Retouched selects", amount: 100 }
          ]
        },
        {
          id: "LL-2044",
          client: "Common Ground Studio",
          type: "Commercial",
          amount: 800,
          dateSent: "Mar 12, 2026",
          dueDate: "Mar 26, 2026",
          status: "paid",
          paidDays: 9,
          note: "Paid this month with no follow-up needed.",
          items: [
            { label: "Maker portrait session", amount: 650 },
            { label: "Usage license", amount: 150 }
          ]
        },
        {
          id: "LL-2043",
          client: "Archer Brand Studio",
          type: "Commercial",
          amount: 1800,
          dateSent: "Apr 1, 2026",
          dueDate: "Apr 15, 2026",
          status: "viewed",
          note: "Travel line item approved. Awaiting approval from finance contact.",
          items: [
            { label: "Half-day campaign shoot", amount: 1500 },
            { label: "Travel reimbursement", amount: 300 }
          ]
        },
        {
          id: "LL-2042",
          client: "Willow & James",
          type: "Wedding",
          amount: 3200,
          dateSent: "Mar 10, 2026",
          dueDate: "Mar 24, 2026",
          status: "paid",
          paidDays: 13,
          note: "Second installment cleared in March.",
          items: [
            { label: "Wedding collection retainer", amount: 3000 },
            { label: "Engagement add-on", amount: 200 }
          ]
        },
        {
          id: "LL-2041",
          client: "Juniper Skin",
          type: "Brand",
          amount: 960,
          dateSent: "Mar 27, 2026",
          dueDate: "Apr 10, 2026",
          status: "draft",
          note: "Waiting for final SKU count before sending.",
          items: [
            { label: "Product stills package", amount: 780 },
            { label: "Prop sourcing", amount: 180 }
          ]
        },
        {
          id: "LL-2040",
          client: "Northline Realty",
          type: "Commercial",
          amount: 580,
          dateSent: "Mar 18, 2026",
          dueDate: "Apr 1, 2026",
          status: "overdue",
          note: "Second reminder should go out today.",
          items: [
            { label: "Property walkthrough coverage", amount: 580 }
          ]
        }
      ],
      templates: {
        "Wedding": {
          description: "Built for retainers, balances, and album upgrades.",
          amount: 2400,
          items: [
            { label: "Wedding collection balance", amount: 2200 },
            { label: "Album design retainer", amount: 200 }
          ],
          terms: "Balance due two weeks before delivery timeline begins."
        },
        "Portrait": {
          description: "Good for individual, family, and editorial portrait sessions.",
          amount: 450,
          items: [
            { label: "Portrait session", amount: 350 },
            { label: "Retouched selects", amount: 100 }
          ],
          terms: "Due upon gallery delivery."
        },
        "Commercial": {
          description: "Structured for half-day or full-day brand shoots with usage.",
          amount: 1800,
          items: [
            { label: "Half-day commercial shoot", amount: 1500 },
            { label: "Usage license", amount: 300 }
          ],
          terms: "Net 14 with usage beginning after payment clears."
        },
        "Event": {
          description: "For launch events, dinners, or small brand activations.",
          amount: 900,
          items: [
            { label: "Two-hour event coverage", amount: 700 },
            { label: "48-hour edit turnaround", amount: 200 }
          ],
          terms: "Net 10 after gallery preview is delivered."
        },
        "Custom": {
          description: "Flexible draft with room for line items and reimbursements.",
          amount: 1250,
          items: [
            { label: "Custom creative fee", amount: 950 },
            { label: "Expenses / reimbursements", amount: 300 }
          ],
          terms: "Terms vary by project scope."
        }
      },
      clients: [
        {
          name: "Lena & Miles",
          initials: "LM",
          type: "Wedding",
          earned: 4200,
          lastShoot: "Mar 29, 2026",
          shoots: 2,
          status: "active",
          notes: "Final album decisions expected in late April.",
          history: [
            "Engagement session · Nov 2025",
            "Wedding day coverage · Mar 2026"
          ],
          invoices: [
            "LL-2047 · Viewed · $2,400",
            "LL-2018 · Paid · $1,800"
          ]
        },
        {
          name: "Willow & James",
          initials: "WJ",
          type: "Wedding",
          earned: 3200,
          lastShoot: "Feb 18, 2026",
          shoots: 1,
          status: "active",
          notes: "Timeline finalized. Album upsell likely after delivery.",
          history: [
            "Wedding coverage booked · Feb 2026"
          ],
          invoices: [
            "LL-2042 · Paid · $3,200"
          ]
        },
        {
          name: "Archer Brand Studio",
          initials: "AB",
          type: "Commercial",
          earned: 5200,
          lastShoot: "Apr 2, 2026",
          shoots: 4,
          status: "active",
          notes: "Strong repeat client. Pays reliably after finance review.",
          history: [
            "Editorial portrait campaign · Jan 2026",
            "Chicago product story shoot · Apr 2026"
          ],
          invoices: [
            "LL-2043 · Viewed · $1,800",
            "LL-1986 · Paid · $1,600"
          ]
        },
        {
          name: "Common Ground Studio",
          initials: "CG",
          type: "Commercial",
          earned: 2800,
          lastShoot: "Mar 14, 2026",
          shoots: 3,
          status: "active",
          notes: "Potential summer maker series in discussion.",
          history: [
            "Founder portraits · Oct 2025",
            "Studio maker stories · Mar 2026"
          ],
          invoices: [
            "LL-2044 · Paid · $800"
          ]
        },
        {
          name: "Northline Realty",
          initials: "NR",
          type: "Commercial",
          earned: 1740,
          lastShoot: "Mar 26, 2026",
          shoots: 3,
          status: "lead",
          notes: "Late payer. Keep usage terms tight on future work.",
          history: [
            "Property walkthroughs · Jan 2026",
            "Leasing refresh stills · Mar 2026"
          ],
          invoices: [
            "LL-2040 · Overdue · $580"
          ]
        },
        {
          name: "Talia Brooks",
          initials: "TB",
          type: "Portrait",
          earned: 860,
          lastShoot: "Mar 8, 2026",
          shoots: 2,
          status: "archived",
          notes: "Graduate portraits finished. No immediate follow-up needed.",
          history: [
            "Headshots · Aug 2025",
            "Graduation portraits · Mar 2026"
          ],
          invoices: [
            "LL-2019 · Paid · $430",
            "LL-2032 · Paid · $430"
          ]
        },
        {
          name: "Juniper Skin",
          initials: "JS",
          type: "Brand",
          earned: 960,
          lastShoot: "Mar 17, 2026",
          shoots: 1,
          status: "lead",
          notes: "Awaiting revised SKU list before draft invoice is sent.",
          history: [
            "Product concept consult · Mar 2026"
          ],
          invoices: [
            "LL-2041 · Draft · $960"
          ]
        },
        {
          name: "Cedar Street Events",
          initials: "CE",
          type: "Event",
          earned: 1480,
          lastShoot: "Feb 25, 2026",
          shoots: 2,
          status: "active",
          notes: "Summer rooftop event inquiry coming next month.",
          history: [
            "Launch dinner coverage · Feb 2026",
            "Gallery delivery complete · Mar 2026"
          ],
          invoices: [
            "LL-2036 · Paid · $740",
            "LL-2037 · Paid · $740"
          ]
        }
      ],
      quarters: [
        { name: "Q1", estimated: 2650, saved: 2750, due: "Apr 15, 2026", status: "Complete", tone: "green" },
        { name: "Q2", estimated: 2820, saved: 2140, due: "Jun 15, 2026", status: "In progress", tone: "yellow" },
        { name: "Q3", estimated: 3010, saved: 980, due: "Sep 15, 2026", status: "Planning", tone: "blue" },
        { name: "Q4", estimated: 3240, saved: 420, due: "Jan 15, 2027", status: "Planning", tone: "coral" }
      ],
      deductions: [
        { label: "Gear", amount: 2100, progress: 84, tone: "blue" },
        { label: "Mileage", amount: 1400, progress: 67, tone: "green" },
        { label: "Software", amount: 1200, progress: 58, tone: "yellow" },
        { label: "Home Office", amount: 800, progress: 42, tone: "coral" },
        { label: "Travel", amount: 600, progress: 31, tone: "blue" }
      ],
      mileage: [
        { date: "Apr 5, 2026", route: "Brooklyn studio → SoHo client scout", miles: 18, amount: 12.06 },
        { date: "Apr 2, 2026", route: "Home office → JFK airport", miles: 24, amount: 16.08 },
        { date: "Mar 29, 2026", route: "Williamsburg → Prospect Park wedding", miles: 14, amount: 9.38 },
        { date: "Mar 22, 2026", route: "Home office → Northline Realty walkthrough", miles: 20, amount: 13.40 },
        { date: "Mar 17, 2026", route: "Studio → Juniper Skin consult", miles: 16, amount: 10.72 }
      ],
      deadlines: [
        { icon: "🗓", title: "Q2 estimated tax", date: "2026-06-15", detail: "Second quarterly estimated payment for 2026." },
        { icon: "🗓", title: "NY state estimated tax", date: "2026-06-15", detail: "State estimated payment aligned with federal quarter." },
        { icon: "📦", title: "Send accountant April export", date: "2026-05-03", detail: "Expense CSV, receipts status, and mileage summary." },
        { icon: "💼", title: "Insurance renewal review", date: "2026-04-28", detail: "Check equipment coverage before wedding season loadout." }
      ],
      timer: {
        open: false,
        duration: 1500,
        remaining: 1500,
        running: false,
        intervalId: null
      }
    };

    function formatMoney(value, precise = false) {
      return precise ? moneyPrecise.format(value) : money.format(value);
    }

    function speak(message) {
      const liveRegion = document.getElementById("liveRegion");
      liveRegion.textContent = message;
    }

    function showSection(targetId) {
      state.currentSection = targetId;
      const sections = document.querySelectorAll(".section");
      const triggers = document.querySelectorAll("[data-section-trigger]");

      sections.forEach((section) => {
        section.classList.toggle("is-active", section.id === targetId);
      });

      triggers.forEach((trigger) => {
        const isActive = trigger.dataset.sectionTrigger === targetId;
        trigger.classList.toggle("is-active", isActive);
        if (isActive) {
          trigger.setAttribute("aria-current", "page");
        } else {
          trigger.removeAttribute("aria-current");
        }
      });

      document.title = `Haus Ledger | ${targetId.replace("-", " ").replace(/\b\w/g, (char) => char.toUpperCase())}`;
      document.querySelector(".main-area").scrollTo({ top: 0, behavior: "smooth" });
      speak(`${targetId.replace("-", " ")} section open`);
    }

    window.showSection = showSection;

    function renderReviewChecklist() {
      const container = document.getElementById("reviewChecklist");
      container.innerHTML = state.reviewTasks.map((task) => `
        <label class="review-item ${task.checked ? "is-complete" : ""}" for="${task.id}">
          <input id="${task.id}" type="checkbox" data-review-id="${task.id}" ${task.checked ? "checked" : ""}>
          <span class="review-check" aria-hidden="true">✓</span>
          <span class="review-copy">
            <strong>${task.title}</strong>
            <span>${task.detail}</span>
          </span>
        </label>
      `).join("");
      updateReviewProgress();
    }

    function updateReviewProgress() {
      const total = state.reviewTasks.length;
      const complete = state.reviewTasks.filter((task) => task.checked).length;
      const progress = (complete / total) * 100;
      const fullComplete = complete === total;
      document.getElementById("reviewProgressBar").style.width = `${progress}%`;
      document.querySelector(".review-progress").setAttribute("aria-valuenow", String(complete));
      document.getElementById("reviewCountPill").textContent = `${complete} / ${total} complete`;
      document.getElementById("reviewStreakPill").textContent = `${state.reviewBaseStreak + (fullComplete ? 1 : 0)} week streak`;
      document.getElementById("reviewMetaCopy").textContent = complete === total
        ? "Weekly review complete. Keep the streak alive."
        : `${total - complete} admin task${total - complete === 1 ? "" : "s"} left for this week.`;
    }

    function renderQuickLog() {
      const container = document.getElementById("quickLogGrid");
      container.innerHTML = state.quickLogItems.map((item, index) => `
        <button class="quick-log-button" type="button" data-quick-log="${index}">
          <strong>${item.icon} ${item.title}</strong>
          <span>${item.subtitle}</span>
        </button>
      `).join("");
    }

    function renderDonutLegend() {
      const container = document.getElementById("donutLegend");
      container.innerHTML = state.donutLegend.map((item) => `
        <div class="legend-item">
          <div class="legend-label">
            <span class="legend-dot" style="background:${item.color};"></span>
            <span>${item.label}</span>
          </div>
          <strong class="mono">${formatMoney(item.amount)}</strong>
        </div>
      `).join("");
    }

    function renderRecentClientsMini() {
      const container = document.getElementById("recentClientsMini");
      const clients = state.clients.slice(0, 4);
      container.innerHTML = clients.map((client, index) => `
        <article class="client-mini">
          <div class="client-mini-head">
            <div class="client-avatar" style="background:${palette[index % palette.length]};">${client.initials}</div>
            <div>
              <strong>${client.name}</strong>
              <small>${client.type}</small>
            </div>
          </div>
          <dl>
            <div>
              <dt>Total earned</dt>
              <dd class="mono">${formatMoney(client.earned)}</dd>
            </div>
            <div>
              <dt>Last shoot</dt>
              <dd>${client.lastShoot}</dd>
            </div>
            <div>
              <dt>Shoots</dt>
              <dd>${client.shoots}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>${client.status}</dd>
            </div>
          </dl>
        </article>
      `).join("");
    }

    function tonePillClass(tone) {
      return tone === "green" ? "green" :
        tone === "yellow" ? "yellow" :
        tone === "coral" ? "coral" :
        tone === "blue" ? "blue" :
        tone === "red" ? "red" : "neutral";
    }

    function renderActivity() {
      const container = document.getElementById("activityList");
      container.innerHTML = state.activityFeed.map((item) => `
        <div class="activity-item">
          <div class="activity-main">
            <div class="activity-icon">${item.icon}</div>
            <div class="activity-copy">
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
            </div>
          </div>
          <span class="pill ${tonePillClass(item.tone)}">${item.amount}</span>
        </div>
      `).join("");
    }

    function renderTaxSnapshot() {
      const items = [
        { title: "Federal set-aside", value: "$6,290", detail: "74% of current estimate covered", tone: "blue" },
        { title: "Q2 due", value: "Jun 15", detail: "69 days from this dashboard date", tone: "yellow" },
        { title: "Deductible tracked", value: "$6,100", detail: "Itemized business expenses logged", tone: "green" },
        { title: "Mileage logged", value: "92 mi", detail: "Worth $61.64 at the current rate", tone: "coral" }
      ];

      const container = document.getElementById("taxSnapshotGrid");
      container.innerHTML = items.map((item) => `
        <div class="snapshot-item">
          <span>${item.title}</span>
          <strong class="mono" style="color: var(--${item.tone});">${item.value}</strong>
          <span>${item.detail}</span>
        </div>
      `).join("");
    }

    function renderRecurring() {
      const container = document.getElementById("recurringList");
      container.innerHTML = state.recurringExpenses.map((item) => `
        <div class="recurring-item">
          <div class="recurring-main">
            <div class="recurring-icon">${item.icon}</div>
            <div class="recurring-copy">
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
            </div>
          </div>
          <span class="pill ${tonePillClass(item.tone)}">${item.amount}</span>
        </div>
      `).join("");
    }

    function renderTrendBars() {
      const maxIncome = Math.max(...state.trendData.map((item) => item.income));
      const maxExpense = Math.max(...state.trendData.map((item) => item.expenses));
      const container = document.getElementById("trendBars");

      container.innerHTML = state.trendData.map((item) => {
        const incomeWidth = (item.income / maxIncome) * 72;
        const expenseWidth = (item.expenses / maxExpense) * 22;
        return `
          <div class="trend-row">
            <span>${item.month}</span>
            <div class="trend-track" aria-hidden="true">
              <div class="trend-income" style="width:${incomeWidth}%"></div>
              <div class="trend-expense" style="width:${expenseWidth}%"></div>
            </div>
            <div class="trend-value">${formatMoney(item.income)} / ${formatMoney(item.expenses)}</div>
          </div>
        `;
      }).join("");
    }

    function sortedCategoryTotals() {
      const allTransactions = [...state.uncategorizedTransactions, ...state.categorizedTransactions];
      const totals = expenseCategories.map((category) => {
        const total = allTransactions
          .filter((transaction) => transaction.category === category)
          .reduce((sum, transaction) => sum + transaction.amount, 0);
        return { category, total };
      });
      return totals.filter((item) => item.total > 0).sort((a, b) => b.total - a.total);
    }

    function renderTransactions() {
      const container = document.getElementById("transactionList");
      container.innerHTML = state.uncategorizedTransactions.map((transaction) => `
        <article class="transaction-row ${transaction.split ? "is-split" : ""}">
          <div class="transaction-row-top">
            <div class="transaction-main">
              <div class="transaction-date">
                <strong>${transaction.day}</strong>
                <span>${transaction.month}</span>
              </div>
              <div class="transaction-copy">
                <strong>${transaction.merchant}</strong>
                <span>${transaction.account} · ${transaction.note}</span>
              </div>
            </div>
            <div class="transaction-amount">
              <strong class="mono">${formatMoney(transaction.amount, true)}</strong>
              <span>Business card</span>
            </div>
          </div>

          <div class="transaction-controls">
            <div class="suggestion-pill">
              <span>${categoryIcons[transaction.category] || "🗂️"} ${transaction.category}</span>
              <span class="confidence">${transaction.confidence}% match</span>
            </div>
            <button class="mini-button" type="button" data-action="confirm-transaction" data-id="${transaction.id}">✓ Confirm</button>
            <label class="select-wrap">
              <span class="sr-only">Change category for ${transaction.merchant}</span>
              <select data-action="change-category" data-id="${transaction.id}">
                ${expenseCategories.map((category) => `
                  <option value="${category}" ${transaction.category === category ? "selected" : ""}>${category}</option>
                `).join("")}
              </select>
            </label>
            <button class="mini-button" type="button" data-action="toggle-split" data-id="${transaction.id}">${transaction.split ? "Unsplit" : "Split"}</button>
            <button class="mini-button ${transaction.receipt ? "receipt-matched" : ""}" type="button" data-action="toggle-receipt" data-id="${transaction.id}">
              ${transaction.receipt ? "Receipt attached" : "Attach receipt"}
            </button>
            ${transaction.receipt ? '<div class="receipt-thumb" aria-label="Receipt thumbnail">JPG</div>' : ""}
          </div>

          ${transaction.split ? `
            <div class="split-note">
              Split preview: 80% business / 20% personal. This mixed purchase is being held for manual confirmation before export so reimbursements stay clean.
            </div>
          ` : ""}
        </article>
      `).join("");
    }

    function renderCategorizedTransactions() {
      const container = document.getElementById("categorizedList");
      container.innerHTML = state.categorizedTransactions.map((transaction) => `
        <article class="transaction-row">
          <div class="transaction-row-top">
            <div class="transaction-main">
              <div class="transaction-date">
                <strong>${transaction.day}</strong>
                <span>${transaction.month}</span>
              </div>
              <div class="transaction-copy">
                <strong>${transaction.merchant}</strong>
                <span>${transaction.account} · ${transaction.note}</span>
              </div>
            </div>
            <div class="transaction-amount">
              <strong class="mono">${formatMoney(transaction.amount, true)}</strong>
              <span>${transaction.source || "Categorized"}</span>
            </div>
          </div>
          <div class="transaction-controls">
            <div class="suggestion-pill">
              <span>${categoryIcons[transaction.category] || "🗂️"} ${transaction.category}</span>
              <span class="confidence">Filed</span>
            </div>
            <button class="mini-button confirmed" type="button">Confirmed</button>
            <button class="mini-button ${transaction.receipt ? "receipt-matched" : ""}" type="button">${transaction.receipt ? "Receipt matched" : "Missing receipt"}</button>
            ${transaction.receipt ? '<div class="receipt-thumb" aria-hidden="true">PDF</div>' : ""}
          </div>
        </article>
      `).join("");
    }

    function renderReceiptPanel() {
      const container = document.getElementById("receiptList");
      const missingReceipts = [...state.uncategorizedTransactions, ...state.categorizedTransactions].filter((transaction) => !transaction.receipt);

      container.innerHTML = missingReceipts.length ? missingReceipts.map((transaction) => `
        <div class="receipt-item">
          <div class="receipt-main">
            <div class="receipt-icon">${categoryIcons[transaction.category] || "🧾"}</div>
            <div class="receipt-copy">
              <strong>${transaction.merchant}</strong>
              <span>${transaction.month} ${transaction.day} · ${formatMoney(transaction.amount, true)} · ${transaction.category}</span>
            </div>
          </div>
          <button class="button small secondary" type="button" data-action="attach-from-receipt-panel" data-id="${transaction.id}">Attach</button>
        </div>
      `).join("") : `
        <div class="receipt-item">
          <div class="receipt-main">
            <div class="receipt-icon">✅</div>
            <div class="receipt-copy">
              <strong>All receipts matched</strong>
              <span>Every deductible transaction currently has proof attached.</span>
            </div>
          </div>
          <span class="pill green">Clean</span>
        </div>
      `;
    }

    function renderCategoryTotals() {
      const container = document.getElementById("categoryTotalsList");
      const totals = sortedCategoryTotals();

      container.innerHTML = totals.map((item) => `
        <div class="category-total-item">
          <div class="activity-main">
            <div class="activity-icon">${categoryIcons[item.category] || "🗂️"}</div>
            <div class="activity-copy">
              <strong>${item.category}</strong>
              <span>Running total for April</span>
            </div>
          </div>
          <strong class="mono">${formatMoney(item.total)}</strong>
        </div>
      `).join("");

      const totalMonthSpend = totals.reduce((sum, item) => sum + item.total, 0);
      const topCategory = totals[0];
      document.getElementById("expensesHeaderTotal").textContent = formatMoney(totalMonthSpend);
      document.getElementById("topCategoryHeadline").textContent = topCategory ? `${topCategory.category} leads April spend` : "No categories tracked yet";
      document.getElementById("topCategoryPill").textContent = topCategory ? topCategory.category : "None";
    }

    function updateExpenseSummary() {
      const uncategorizedCount = state.uncategorizedTransactions.length;
      const categorizedCount = state.categorizedTransactions.length;
      const missingReceipts = [...state.uncategorizedTransactions, ...state.categorizedTransactions].filter((transaction) => !transaction.receipt).length;
      const totals = sortedCategoryTotals();

      document.getElementById("reviewQueuePill").textContent = `${uncategorizedCount} awaiting review`;
      document.getElementById("uncategorizedPill").textContent = `${uncategorizedCount} uncategorized`;
      document.getElementById("missingReceiptHeadline").textContent = `${missingReceipts} transaction${missingReceipts === 1 ? "" : "s"} missing receipts`;
      document.getElementById("receiptMissingPill").textContent = `${missingReceipts} open`;
      document.getElementById("receiptQueueBadge").textContent = `${missingReceipts} missing`;
      document.getElementById("receiptHighlightTitle").textContent = `${missingReceipts} transaction${missingReceipts === 1 ? "" : "s"} missing receipts`;
      document.getElementById("categorizedHeadline").textContent = `${categorizedCount} categorized this month`;
      document.getElementById("categorizedPill").textContent = `${categorizedCount} ready`;
      document.getElementById("categorizedToggleLabel").textContent = state.categorizedCollapsed ? "Expand" : "Collapse";
      document.getElementById("categorizedToggle").setAttribute("aria-expanded", String(!state.categorizedCollapsed));
      document.getElementById("categorizedBody").classList.toggle("is-hidden", state.categorizedCollapsed);

      if (totals.length > 0) {
        document.getElementById("topCategoryHeadline").textContent = `${totals[0].category} leads April spend`;
        document.getElementById("topCategoryPill").textContent = totals[0].category;
      }
    }

    function renderManualCategories() {
      const container = document.getElementById("manualCategoryGrid");
      const preferredOrder = ["Gear", "Mileage", "Software", "Travel", "Meals", "Marketing", "Home Office", "Props", "Insurance", "Education", "Other"];

      container.innerHTML = preferredOrder.map((category) => `
        <button class="tag-button ${state.manualCategory === category ? "is-active" : ""}" type="button" data-action="set-manual-category" data-category="${category}">
          ${categoryIcons[category] || "🗂️"} ${category}
        </button>
      `).join("");
    }

    function renderInvoices() {
      const container = document.getElementById("invoiceList");
      const filtered = state.invoiceFilter === "all"
        ? state.invoices
        : state.invoices.filter((invoice) => invoice.status === state.invoiceFilter);

      container.innerHTML = filtered.map((invoice) => `
        <details class="invoice-item">
          <summary class="invoice-summary">
            <div class="invoice-primary">
              <strong>${invoice.client}</strong>
              <span>${invoice.id} · ${invoice.type}</span>
            </div>
            <div class="invoice-meta mono">${formatMoney(invoice.amount)}</div>
            <div class="invoice-meta">${invoice.dateSent}</div>
            <div class="invoice-meta">${invoice.dueDate}</div>
            <div><span class="status-pill status-${invoice.status}">${invoice.status}</span></div>
          </summary>
          <div class="invoice-details">
            <div class="invoice-details-grid">
              <div>
                <div class="line-item-list">
                  ${invoice.items.map((item) => `
                    <div class="line-item">
                      <span>${item.label}</span>
                      <strong class="mono">${formatMoney(item.amount)}</strong>
                    </div>
                  `).join("")}
                </div>
              </div>
              <div class="invoice-side-note">
                <strong>Details</strong>
                <span>Status: ${invoice.status}</span>
                <span>Due: ${invoice.dueDate}</span>
                <span>${invoice.note}</span>
                <div class="inline-actions">
                  <button class="button small secondary" type="button">View PDF</button>
                  <button class="button small ${invoice.status === "overdue" ? "primary" : "secondary"}" type="button">${invoice.status === "overdue" ? "Send reminder" : "Open thread"}</button>
                </div>
              </div>
            </div>
          </div>
        </details>
      `).join("");
    }

    function renderInvoiceStats() {
      const outstanding = state.invoices.filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + invoice.amount, 0);
      const overdueCount = state.invoices.filter((invoice) => invoice.status === "overdue").length;
      const paidThisMonth = state.invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoice.amount, 0);
      const paidInvoices = state.invoices.filter((invoice) => invoice.status === "paid");
      const avgDays = Math.round(paidInvoices.reduce((sum, invoice) => sum + (invoice.paidDays || 0), 0) / paidInvoices.length);

      const items = [
        { label: "Outstanding total", value: formatMoney(outstanding), detail: "Drafts, sent invoices, viewed invoices, and overdue balances combined." },
        { label: "Overdue count", value: `${overdueCount}`, detail: "These need a follow-up today so they do not age further into the month." },
        { label: "Paid this month", value: formatMoney(paidThisMonth), detail: "Cash collected from completed client work in April so far." },
        { label: "Average days to pay", value: `${avgDays} days`, detail: "Typical payment delay across recently paid invoices." }
      ];

      const container = document.getElementById("invoiceStats");
      container.innerHTML = items.map((item, index) => `
        <div class="invoice-stat">
          <span>${item.label}</span>
          <strong class="mono" style="color:${index === 1 ? "var(--red)" : index === 2 ? "var(--green)" : "var(--text)"};">${item.value}</strong>
          <small>${item.detail}</small>
        </div>
      `).join("");
    }

    function renderInvoiceFilters() {
      const filters = [
        { id: "all", label: "All" },
        { id: "draft", label: "Draft" },
        { id: "sent", label: "Sent" },
        { id: "viewed", label: "Viewed" },
        { id: "paid", label: "Paid" },
        { id: "overdue", label: "Overdue" }
      ];

      const container = document.getElementById("invoiceFilterRow");
      container.innerHTML = filters.map((filter) => `
        <button class="tag-button ${state.invoiceFilter === filter.id ? "is-active" : ""}" type="button" data-action="set-invoice-filter" data-filter="${filter.id}">
          ${filter.label}
        </button>
      `).join("");
    }

    function renderTemplates() {
      const container = document.getElementById("templateGrid");
      container.innerHTML = Object.keys(state.templates).map((templateName) => `
        <button class="tag-button ${state.invoiceTemplate === templateName ? "is-active" : ""}" type="button" data-action="set-template" data-template="${templateName}">
          ${templateName}
        </button>
      `).join("");

      const template = state.templates[state.invoiceTemplate];
      document.getElementById("templatePreview").innerHTML = `
        <strong>${state.invoiceTemplate} Template</strong>
        <p>${template.description}</p>
        <ul>
          ${template.items.map((item) => `
            <li>
              <span>${item.label}</span>
              <strong class="mono">${formatMoney(item.amount)}</strong>
            </li>
          `).join("")}
        </ul>
        <div class="inline-actions" style="justify-content: space-between;">
          <span class="pill blue">Package rate <strong class="mono">${formatMoney(template.amount)}</strong></span>
          <span class="pill neutral">${template.terms}</span>
        </div>
      `;
    }

    function renderClientSummaryStrip() {
      const active = state.clients.filter((client) => client.status === "active").length;
      const leads = state.clients.filter((client) => client.status === "lead").length;
      const repeatRate = Math.round((state.clients.filter((client) => client.shoots > 1).length / state.clients.length) * 100);
      const avgProject = Math.round(state.clients.reduce((sum, client) => sum + client.earned, 0) / state.clients.length);

      const items = [
        { label: "Active clients", value: active, detail: "Ongoing relationships with current work or follow-up." },
        { label: "Leads", value: leads, detail: "Warm opportunities worth a reminder or proposal follow-up." },
        { label: "Repeat booking rate", value: `${repeatRate}%`, detail: "Clients who have booked more than once." },
        { label: "Average client value", value: formatMoney(avgProject), detail: "Typical revenue across the current roster." }
      ];

      const container = document.getElementById("clientSummaryStrip");
      container.innerHTML = items.map((item) => `
        <div class="client-summary-metric">
          <span>${item.label}</span>
          <strong class="mono">${item.value}</strong>
          <small>${item.detail}</small>
        </div>
      `).join("");
    }

    function renderClientFilters() {
      const filters = [
        { id: "all", label: "All" },
        { id: "active", label: "Active" },
        { id: "lead", label: "Lead" },
        { id: "archived", label: "Archived" }
      ];

      const container = document.getElementById("clientStatusFilters");
      container.innerHTML = filters.map((filter) => `
        <button class="tag-button ${state.clientStatus === filter.id ? "is-active" : ""}" type="button" data-action="set-client-filter" data-filter="${filter.id}">
          ${filter.label}
        </button>
      `).join("");
    }

    function renderClients() {
      const search = state.clientSearch.trim().toLowerCase();
      const filtered = state.clients.filter((client) => {
        const matchesSearch = !search || `${client.name} ${client.type} ${client.notes}`.toLowerCase().includes(search);
        const matchesStatus = state.clientStatus === "all" || client.status === state.clientStatus;
        return matchesSearch && matchesStatus;
      });

      const container = document.getElementById("clientGrid");
      container.innerHTML = filtered.map((client, index) => `
        <details class="client-card">
          <summary>
            <div class="client-card-top">
              <div class="client-card-meta">
                <div class="client-avatar" style="background:${palette[index % palette.length]};">${client.initials}</div>
                <div class="client-card-copy">
                  <strong>${client.name}</strong>
                  <span>${client.type} photography</span>
                </div>
              </div>
              <span class="client-status ${client.status}">${client.status}</span>
            </div>
            <dl>
              <div>
                <dt>Total earned</dt>
                <dd class="mono">${formatMoney(client.earned)}</dd>
              </div>
              <div>
                <dt>Last shoot</dt>
                <dd>${client.lastShoot}</dd>
              </div>
              <div>
                <dt># of shoots</dt>
                <dd>${client.shoots}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>${client.status}</dd>
              </div>
            </dl>
          </summary>
          <div class="client-card-details">
            <div class="client-detail-stack">
              <div class="client-detail-block">
                <strong>Shoot history</strong>
                <ul>
                  ${client.history.map((entry) => `<li><span>${entry}</span><span>${client.type}</span></li>`).join("")}
                </ul>
              </div>
              <div class="client-detail-block">
                <strong>Invoices</strong>
                <ul>
                  ${client.invoices.map((entry) => `<li><span>${entry}</span><span>Open in invoices</span></li>`).join("")}
                </ul>
              </div>
              <div class="client-detail-block">
                <strong>Notes</strong>
                <p style="color: var(--dim); font-size: 12px; line-height: 1.65;">${client.notes}</p>
              </div>
            </div>
          </div>
        </details>
      `).join("");
    }

    function daysUntil(dateString) {
      const target = new Date(`${dateString}T12:00:00-04:00`);
      return Math.ceil((target - mockToday) / 86400000);
    }

    function formatDeadlineDate(dateString) {
      const date = new Date(`${dateString}T12:00:00-04:00`);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    function renderTaxCenter() {
      const quarterContainer = document.getElementById("quarterGrid");
      quarterContainer.innerHTML = state.quarters.map((quarter) => {
        const progress = Math.min(100, Math.round((quarter.saved / quarter.estimated) * 100));
        return `
          <article class="quarter-card">
            <div class="quarter-card-top">
              <div>
                <h3>${quarter.name}</h3>
                <p>${quarter.status} · Due ${quarter.due}</p>
              </div>
              <span class="pill ${tonePillClass(quarter.tone)}">${quarter.status}</span>
            </div>
            <div class="quarter-grid-metrics">
              <div class="quarter-metric">
                <span>Estimated tax</span>
                <strong class="mono">${formatMoney(quarter.estimated)}</strong>
              </div>
              <div class="quarter-metric">
                <span>Amount set aside</span>
                <strong class="mono">${formatMoney(quarter.saved)}</strong>
              </div>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${quarter.tone}" style="width:${progress}%"></div>
            </div>
            <div class="progress-meta">
              <span>${progress}% covered</span>
              <span>${formatMoney(Math.max(quarter.estimated - quarter.saved, 0))} left</span>
            </div>
          </article>
        `;
      }).join("");

      const deductionContainer = document.getElementById("deductionList");
      deductionContainer.innerHTML = state.deductions.map((item) => `
        <div class="deduction-item">
          <div class="deduction-top">
            <strong>${item.label}</strong>
            <span class="mono">${formatMoney(item.amount)}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${item.tone}" style="width:${item.progress}%"></div>
          </div>
          <div class="progress-meta">
            <span>${item.progress}% of annual target</span>
            <span>${item.label} deduction tracking</span>
          </div>
        </div>
      `).join("");

      const mileageContainer = document.getElementById("mileageList");
      mileageContainer.innerHTML = state.mileage.map((trip) => `
        <div class="mileage-item">
          <div>
            <strong>${trip.date}</strong>
            <span>${trip.route}</span>
          </div>
          <div style="text-align:right;">
            <strong class="mono">${trip.miles} mi</strong>
            <span>${formatMoney(trip.amount, true)}</span>
          </div>
        </div>
      `).join("");

      const deadlineContainer = document.getElementById("deadlineList");
      deadlineContainer.innerHTML = state.deadlines.map((deadline) => `
        <div class="deadline-item">
          <div class="deadline-main">
            <div class="deadline-icon">${deadline.icon}</div>
            <div class="deadline-copy">
              <strong>${deadline.title}</strong>
              <span>${deadline.detail}<br>${formatDeadlineDate(deadline.date)}</span>
            </div>
          </div>
          <span class="pill ${daysUntil(deadline.date) <= 30 ? "yellow" : "blue"}">${daysUntil(deadline.date)} days</span>
        </div>
      `).join("");
    }

    function renderSettingsCategories() {
      const container = document.getElementById("settingsCategoryChips");
      container.innerHTML = expenseCategories.map((category) => `
        <span class="category-chip">${categoryIcons[category] || "🗂️"} ${category}</span>
      `).join("");
    }

    function syncAllExpenseViews() {
      renderTransactions();
      renderCategorizedTransactions();
      renderReceiptPanel();
      renderCategoryTotals();
      updateExpenseSummary();
    }

    function setTimerOpen(isOpen) {
      state.timer.open = isOpen;
      const panel = document.getElementById("timerPanel");
      const button = document.getElementById("timerOpenButton");
      panel.classList.toggle("is-open", isOpen);
      button.setAttribute("aria-expanded", String(isOpen));
    }

    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    }

    function updateTimerUI() {
      const { remaining, duration, running } = state.timer;
      const progress = duration === 0 ? 0 : remaining / duration;
      const circumference = 2 * Math.PI * 84;
      const dashOffset = circumference * (1 - progress);
      const durationMinutes = Math.floor(duration / 60);
      let statusLabel = "Ready";
      let topbarCopy = `Ready for a ${durationMinutes} min sprint`;

      if (running) {
        statusLabel = "In Focus";
        topbarCopy = "Timer running";
      } else if (remaining === 0) {
        statusLabel = "Complete";
        topbarCopy = "Sprint complete";
      } else if (remaining !== duration) {
        statusLabel = "Paused";
        topbarCopy = "Paused mid sprint";
      }

      document.getElementById("timerDisplay").textContent = formatTime(remaining);
      document.getElementById("timerTopbarValue").textContent = formatTime(remaining);
      document.getElementById("timerRingProgress").style.strokeDashoffset = String(dashOffset);
      document.getElementById("timerStatus").textContent = statusLabel;
      document.getElementById("timerStartPauseButton").textContent = running ? "Pause" : (remaining === 0 ? "Restart" : "Start");
      document.getElementById("timerTopbarState").textContent = topbarCopy;
      document.getElementById("timerNote").textContent = remaining === 0
        ? "Sprint complete. Clear one more admin task while the momentum is still there."
        : "Suggested sprint: clear receipts first, then confirm transactions, then send two invoice reminders.";
    }

    function stopTimerInterval() {
      if (state.timer.intervalId) {
        clearInterval(state.timer.intervalId);
        state.timer.intervalId = null;
      }
    }

    function startTimer() {
      if (state.timer.remaining === 0) {
        state.timer.remaining = state.timer.duration;
      }
      if (state.timer.running) {
        return;
      }
      state.timer.running = true;
      updateTimerUI();
      state.timer.intervalId = window.setInterval(() => {
        if (state.timer.remaining > 0) {
          state.timer.remaining -= 1;
          updateTimerUI();
        } else {
          state.timer.running = false;
          stopTimerInterval();
          updateTimerUI();
          speak("Sprint timer complete");
        }
      }, 1000);
    }

    function pauseTimer() {
      state.timer.running = false;
      stopTimerInterval();
      updateTimerUI();
    }

    function resetTimer() {
      pauseTimer();
      state.timer.remaining = state.timer.duration;
      updateTimerUI();
    }

    function renderTimerPresets() {
      const presets = [
        { label: "25 min", value: 1500 },
        { label: "45 min", value: 2700 },
        { label: "90 min", value: 5400 }
      ];
      const container = document.getElementById("timerPresetRow");
      container.innerHTML = presets.map((preset) => `
        <button class="tag-button ${state.timer.duration === preset.value ? "is-active" : ""}" type="button" data-action="set-timer-preset" data-value="${preset.value}">
          ${preset.label}
        </button>
      `).join("");
    }

    function bindEvents() {
      document.addEventListener("click", (event) => {
        const sectionTrigger = event.target.closest("[data-section-trigger]");
        if (sectionTrigger && !sectionTrigger.disabled) {
          showSection(sectionTrigger.dataset.sectionTrigger);
        }

        const quickLogButton = event.target.closest("[data-quick-log]");
        if (quickLogButton) {
          quickLogButton.classList.add("is-pressed");
          window.setTimeout(() => quickLogButton.classList.remove("is-pressed"), 280);
          speak(`${quickLogButton.textContent.trim()} quick log pressed`);
        }

        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) {
          return;
        }

        const { action } = actionButton.dataset;
        // DISABLED: expense actions now in expenses.js
        if (false && action === "confirm-transaction") {}
        if (false && action === "toggle-split") {}
        if (false && action === "toggle-receipt") {}
        if (false && action === "set-manual-category") {}

        // DISABLED: invoice and client actions now in their own modules
        if (false && action === "set-invoice-filter") {}
        if (false && action === "set-template") {}
        if (false && action === "set-client-filter") {}

        if (action === "set-timer-preset") {
          const nextValue = Number(actionButton.dataset.value);
          state.timer.duration = nextValue;
          state.timer.remaining = nextValue;
          pauseTimer();
          renderTimerPresets();
          updateTimerUI();
          speak(`Timer preset set to ${Math.floor(nextValue / 60)} minutes`);
        }
      });

      document.addEventListener("change", (event) => {
        const reviewCheckbox = event.target.closest("[data-review-id]");
        if (reviewCheckbox) {
          const task = state.reviewTasks.find((item) => item.id === reviewCheckbox.dataset.reviewId);
          if (task) {
            task.checked = reviewCheckbox.checked;
            renderReviewChecklist();
            speak(`${task.title} ${task.checked ? "completed" : "unchecked"}`);
          }
        }

        // DISABLED: category change now in expenses.js
      });

      // DISABLED: categorized toggle now in expenses.js
      // document.getElementById("categorizedToggle").addEventListener("click", () => {});

      // DISABLED: manual expense form now handled by expenses.js

      // DISABLED: client search now in clients.js

      document.getElementById("timerOpenButton").addEventListener("click", () => {
        setTimerOpen(!state.timer.open);
      });

      document.getElementById("timerCloseButton").addEventListener("click", () => {
        setTimerOpen(false);
      });

      document.getElementById("timerStartPauseButton").addEventListener("click", () => {
        if (state.timer.running) {
          pauseTimer();
        } else {
          startTimer();
        }
      });

      document.getElementById("timerResetButton").addEventListener("click", () => {
        resetTimer();
      });
    }

    function initialize() {
      renderReviewChecklist();
      renderQuickLog();
      // DISABLED: all data sections now powered by Supabase modules
      // renderDonutLegend();
      // renderRecentClientsMini();
      // renderActivity();
      // renderTaxSnapshot();
      // renderRecurring();
      // renderTrendBars();
      // syncAllExpenseViews();
      // renderManualCategories();
      // renderInvoiceStats();
      // renderInvoiceFilters();
      // renderInvoices();
      // renderTemplates();
      // renderClientSummaryStrip();
      // renderClientFilters();
      // renderClients();
      // renderTaxCenter();
      renderSettingsCategories();
      renderTimerPresets();
      updateTimerUI();
      bindEvents();
    }

    initialize();