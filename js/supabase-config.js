// ═══════════════════════════════════════════════════════════════
// LensLedger — Supabase Configuration
// Replace these with your Supabase project values from:
// Supabase Dashboard → Settings → API
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://njetsdxgycobmftcfcoq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_D2gzu6hfVUktdlEfr2NMGw_irMPG7eq';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Auth Helpers ───────────────────────────────────────────

async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

async function signInWithGoogle() {
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/dashboard.html'
    }
  });
  if (error) {
    console.error('Sign-in error:', error.message);
    return { error };
  }
  return { data };
}

async function signOut() {
  const { error } = await sb.auth.signOut();
  if (error) {
    console.error('Sign-out error:', error.message);
  }
  window.location.href = '/index.html';
}

// ─── Route Guard ────────────────────────────────────────────

async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = '/index.html';
    return null;
  }
  return session;
}

async function redirectIfLoggedIn() {
  const session = await getSession();
  if (session) {
    window.location.href = '/dashboard.html';
  }
}
