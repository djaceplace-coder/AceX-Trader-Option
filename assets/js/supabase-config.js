// Supabase Configuration — Swap these for your real credentials when ready
// For GitHub Actions deployment, inject these via build-time environment variables
const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

// Mock mode flag — automatically enabled until real keys are provided
const isMockMode = SUPABASE_URL.includes('__') || SUPABASE_ANON_KEY.includes('__');

if (isMockMode) {
  console.warn('[Acextrader] Running in MOCK MODE. Supabase calls will simulate against localStorage.');
}

// Export config for app.js
window.ACE_CONFIG = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isMockMode,
  BUSINESS_RULES: {
    DEPOSIT_GATE_USD: 500,
    WITHDRAWAL_THRESHOLD_USD: 5000,
    BOT_TRADING_FEE_RATE: 0,
    LOAN_REMITTANCE_RATE: 0.15,
    ADDRESSES: {
      USDT_TRC20: 'TChv3f5g8a9kL2mNpQrStUvWxYzAbCdEfG',
      USDT_ERC20: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      BTC_SEGWIT: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
    }
  }
};

