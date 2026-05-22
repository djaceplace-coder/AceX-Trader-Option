(function() {
  'use strict';

  const CFG = window.ACE_CONFIG || {};
  const RULES = CFG.BUSINESS_RULES || {};

  // ─── Mock Supabase Client ───
  const mockDB = {
    profiles: JSON.parse(localStorage.getItem('mock_profiles') || '[]'),
    wallets: JSON.parse(localStorage.getItem('mock_wallets') || '[]'),
    transactions: JSON.parse(localStorage.getItem('mock_transactions') || '[]'),
    bots: JSON.parse(localStorage.getItem('mock_bots') || '[]'),
    loans: JSON.parse(localStorage.getItem('mock_loans') || '[]'),
  };

  function saveMock() {
    localStorage.setItem('mock_profiles', JSON.stringify(mockDB.profiles));
    localStorage.setItem('mock_wallets', JSON.stringify(mockDB.wallets));
    localStorage.setItem('mock_transactions', JSON.stringify(mockDB.transactions));
    localStorage.setItem('mock_bots', JSON.stringify(mockDB.bots));
    localStorage.setItem('mock_loans', JSON.stringify(mockDB.loans));
  }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // Seed demo data if empty
  if (mockDB.profiles.length === 0) {
    const demoUser = {
      id: uuid(), email: 'demo@acextrader.com', full_name: 'Demo User',
      kyc_status: 'verified', deposit_gate_met: true, total_deposited_usd: 500,
      role: 'user', created_at: new Date().toISOString()
    };
    const adminUser = {
      id: uuid(), email: 'admin@acextrader.com', full_name: 'Admin',
      kyc_status: 'verified', deposit_gate_met: true, total_deposited_usd: 5000,
      role: 'admin', created_at: new Date().toISOString()
    };
    mockDB.profiles.push(demoUser, adminUser);
    mockDB.wallets.push(
      { id: uuid(), user_id: demoUser.id, asset: 'USDT', balance: 1250.00, locked_balance: 0, total_portfolio_usd: 3250.00, withdrawal_unlocked: false, updated_at: new Date().toISOString() },
      { id: uuid(), user_id: demoUser.id, asset: 'BTC', balance: 0.045, locked_balance: 0, total_portfolio_usd: 0, withdrawal_unlocked: false, updated_at: new Date().toISOString() },
      { id: uuid(), user_id: adminUser.id, asset: 'USDT', balance: 15000.00, locked_balance: 0, total_portfolio_usd: 15000.00, withdrawal_unlocked: true, updated_at: new Date().toISOString() }
    );
    mockDB.bots.push(
      { id: uuid(), user_id: demoUser.id, strategy: 'dca', capital_allocated: 500, status: 'active', trading_fee_rate: 0, total_pnl: 127.50 }
    );
    saveMock();
  }

  window.supabase = {
    auth: {
      signUp: async ({ email, password, options }) => {
        const exists = mockDB.profiles.find(p => p.email === email);
        if (exists) return { data: null, error: { message: 'User already registered' } };
        const id = uuid();
        const profile = {
          id, email, full_name: options?.data?.full_name || '',
          kyc_status: 'pending', deposit_gate_met: false, total_deposited_usd: 0,
          role: 'user', created_at: new Date().toISOString()
        };
        mockDB.profiles.push(profile);
        mockDB.wallets.push({
          id: uuid(), user_id: id, asset: 'USDT', balance: 0, locked_balance: 0,
          total_portfolio_usd: 0, withdrawal_unlocked: false, updated_at: new Date().toISOString()
        });
        saveMock();
        localStorage.setItem('ace_session', JSON.stringify({ user: { id, email } }));
        return { data: { user: { id, email } }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        const profile = mockDB.profiles.find(p => p.email === email);
        if (!profile) return { data: null, error: { message: 'Invalid credentials' } };
        localStorage.setItem('ace_session', JSON.stringify({ user: { id: profile.id, email } }));
        return { data: { user: { id: profile.id, email } }, error: null };
      },
      signOut: async () => {
        localStorage.removeItem('ace_session');
        return { error: null };
      },
      getSession: async () => {
        const raw = localStorage.getItem('ace_session');
        if (!raw) return { data: { session: null }, error: null };
        const sess = JSON.parse(raw);
        return { data: { session: { user: sess.user } }, error: null };
      },
      onAuthStateChange: (callback) => {
        window.addEventListener('ace_auth_change', () => callback('SIGNED_IN', null));
      }
    },
    from: (table) => ({
      select: (cols = '*') => ({
        eq: (col, val) => ({
          single: async () => {
            const rows = mockDB[table].filter(r => r[col] === val);
            return { data: rows[0] || null, error: null };
          },
          order: () => ({
            async then() { return this; }
          }),
          async then() {
            const rows = mockDB[table].filter(r => r[col] === val);
            return { data: rows, error: null };
          }
        }),
        order: (col, { ascending } = {}) => ({
          async then() {
            let rows = [...mockDB[table]];
            rows.sort((a, b) => ascending ? (a[col] > b[col] ? 1 : -1) : (a[col] < b[col] ? 1 : -1));
            return { data: rows, error: null };
          }
        }),
        async then() { return { data: mockDB[table], error: null }; }
      }),
      insert: (rows) => ({
        async then() {
          const arr = Array.isArray(rows) ? rows : [rows];
          arr.forEach(r => { r.id = r.id || uuid(); mockDB[table].push(r); });
          saveMock();
          return { data: arr, error: null };
        }
      }),
      update: (changes) => ({
        eq: (col, val) => ({
          async then() {
            const idx = mockDB[table].findIndex(r => r[col] === val);
            if (idx > -1) { Object.assign(mockDB[table][idx], changes); saveMock(); }
            return { data: mockDB[table][idx] || null, error: null };
          }
        })
      }),
      delete: () => ({
        eq: (col, val) => ({
          async then() {
            mockDB[table] = mockDB[table].filter(r => r[col] !== val);
            saveMock();
            return { data: null, error: null };
          }
        })
      })
    })
  };

  // ─── App Utilities ───
  window.ACE = {
    formatCurrency(num, currency = 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num || 0);
    },

    formatCrypto(num, asset = 'BTC') {
      return num?.toFixed(asset === 'BTC' ? 8 : 2) + ' ' + asset;
    },

    showToast(message, type = 'info') {
      const container = document.querySelector('.toast-container') || (() => {
        const c = document.createElement('div');
        c.className = 'toast-container';
        document.body.appendChild(c);
        return c;
      })();
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `<div class="fw-600">${message}</div>`;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    },

    async getSession() {
      const { data } = await window.supabase.auth.getSession();
      return data?.session || null;
    },

    async getProfile() {
      const session = await this.getSession();
      if (!session) return null;
      const { data } = await window.supabase.from('profiles').select('*').eq('id', session.user.id).single();
      return data;
    },

    async isAdmin() {
      const profile = await this.getProfile();
      return profile?.role === 'admin';
    },

    async requireAuth() {
      const session = await this.getSession();
      if (!session) { window.location.href = '/auth/login.html'; return false; }
      return true;
    },

    async requireAdmin() {
      const ok = await this.requireAuth();
      if (!ok) return false;
      const admin = await this.isAdmin();
      if (!admin) { window.location.href = '/dashboard/'; return false; }
      return true;
    },

    async checkDepositGate() {
      const profile = await this.getProfile();
      if (!profile) return false;
      return profile.deposit_gate_met === true && profile.total_deposited_usd >= RULES.DEPOSIT_GATE_USD;
    },

    async checkWithdrawalUnlock() {
      const profile = await this.getProfile();
      if (!profile) return false;
      const { data: wallets } = await window.supabase.from('wallets').select('*').eq('user_id', profile.id);
      const total = (wallets || []).reduce((sum, w) => sum + (w.total_portfolio_usd || 0), 0);
      return total >= RULES.WITHDRAWAL_THRESHOLD_USD;
    },

    calculateLoanRemittance(principal) {
      return principal * RULES.LOAN_REMITTANCE_RATE;
    },

    async activateBot(botId) {
      const gate = await this.checkDepositGate();
      if (!gate) {
        this.showToast(`Deposit $${RULES.DEPOSIT_GATE_USD} gate required to activate bot.`, 'error');
        return false;
      }
      await window.supabase.from('bots').update({ status: 'active' }).eq('id', botId);
      this.showToast('Bot activated. Zero trading fees applied.', 'success');
      return true;
    },

    async submitWithdrawal(amount) {
      const unlocked = await this.checkWithdrawalUnlock();
      if (!unlocked) {
        this.showToast(`Withdrawal locked until $${RULES.WITHDRAWAL_THRESHOLD_USD.toLocaleString()} portfolio value.`, 'error');
        return false;
      }
      this.showToast('Withdrawal submitted for admin approval.', 'success');
      return true;
    },

    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => this.showToast('Copied to clipboard', 'success'));
    },

    logout() {
      window.supabase.auth.signOut().then(() => {
        localStorage.removeItem('ace_session');
        window.location.href = '/auth/login.html';
      });
    }
  };

  // ─── Render Shared UI ───
  function renderHeader() {
    const header = document.querySelector('.app-header');
    if (!header) return;
    const isAuthPage = location.pathname.includes('/auth/');
    if (isAuthPage) {
      header.innerHTML = `
        <div class="logo-wrap">
          <img src="${document.querySelector('.logo-img')?.src || ''}" alt="Logo" class="logo-img" style="height:32px">
          <span class="logo-text">ACEXTRADER</span>
        </div>
        <a href="/" class="btn btn-sm btn-secondary" style="width:auto">Back to Home</a>
      `;
      return;
    }
    window.ACE.getSession().then(sess => {
      if (sess) {
        header.innerHTML = `
          <div class="logo-wrap">
            <img src="${document.querySelector('.logo-img')?.src || ''}" alt="Logo" class="logo-img">
            <span class="logo-text">ACEXTRADER</span>
          </div>
          <div class="header-actions">
            <span class="fs-12 text-muted hidden" id="header-role"></span>
            <button class="btn btn-sm btn-secondary" onclick="window.ACE.logout()" style="width:auto">Logout</button>
          </div>
        `;
        window.ACE.isAdmin().then(isA => {
          const badge = document.getElementById('header-role');
          if (badge && isA) { badge.classList.remove('hidden'); badge.textContent = 'ADMIN'; badge.className = 'fs-12 badge badge-gold'; }
        });
      } else {
        header.innerHTML = `
          <div class="logo-wrap">
            <img src="${document.querySelector('.logo-img')?.src || ''}" alt="Logo" class="logo-img">
            <span class="logo-text">ACEXTRADER</span>
          </div>
          <div class="header-actions">
            <a href="/auth/login.html" class="btn btn-sm btn-secondary" style="width:auto">Sign In</a>
            <a href="/auth/register.html" class="btn btn-sm btn-primary" style="width:auto">Get Started</a>
          </div>
        `;
      }
    });
  }

  function renderNav() {
    const sidebar = document.querySelector('.sidebar');
    const bottomNav = document.querySelector('.bottom-nav');
    if (!sidebar && !bottomNav) return;

    const path = location.pathname;
    const isActive = (p) => path.includes(p) ? 'active' : '';

    const links = [
      { href: '/dashboard/', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>', label: 'Dashboard' },
      { href: '/wallet/', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>', label: 'Wallet' },
      { href: '/bots/', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>', label: 'Bots' },
      { href: '/loans/', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>', label: 'Loans' },
      { href: '/admin/', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>', label: 'Admin', admin: true },
    ];

    const buildLink = (l) => `
      <a href="${l.href}" class="sidebar-link ${isActive(l.href)}">
        ${l.icon} ${l.label}
      </a>
    `;
    const buildBottom = (l) => `
      <a href="${l.href}" class="bottom-nav-item ${isActive(l.href)}">
        ${l.icon}
        <span>${l.label}</span>
      </a>
    `;

    if (sidebar) {
      sidebar.innerHTML = `<div class="sidebar-section">Menu</div>` +
        links.filter(l => !l.admin).map(buildLink).join('') +
        `<div class="sidebar-section mt-4">System</div>` +
        links.filter(l => l.admin).map(buildLink).join('');
    }

    if (bottomNav) {
      bottomNav.innerHTML = links.filter(l => !l.admin).map(buildBottom).join('');
    }
  }

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderNav();

    if (location.pathname.includes('/auth/')) {
      window.ACE.getSession().then(s => { if (s) location.href = '/dashboard/'; });
    }
  });

})();
