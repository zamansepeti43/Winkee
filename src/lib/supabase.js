import { createClient } from '@supabase/supabase-js';

// Supabase client her zaman çıplak proje origin'i ile oluşturulur.
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
let url = rawUrl.trim();
try { url = new URL(url).origin; } catch { url = ''; }
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const supabaseConfigured = Boolean(url && key);

// Winkee client-only bir Vite uygulaması. Email confirmation sonrası oturumun
// doğrudan tarayıcıda kurulması için implicit flow kullanıyoruz; PKCE verifier
// gerektirmediği için Gmail -> Winkee dönüşünde localhost/verifier sorunlarını önler.
export const supabase = supabaseConfigured ? createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
}) : null;

export const productionRedirect = 'https://winkee-phi.vercel.app/';

export function getEmailRedirectTo() {
  if (typeof window === 'undefined') return productionRedirect;
  const origin = window.location.origin;
  return origin.includes('localhost') || origin.includes('127.0.0.1')
    ? productionRedirect
    : `${origin}/`;
}

export async function signInWithEmail(email, password) {
  if (!supabase) throw new Error('Supabase bağlantısı yapılandırılmamış.');
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password, metadata = {}) {
  if (!supabase) throw new Error('Supabase bağlantısı yapılandırılmamış.');
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: getEmailRedirectTo()
    }
  });
}

export async function resetPasswordForEmail(email) {
  if (!supabase) throw new Error('Supabase bağlantısı yapılandırılmamış.');
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getEmailRedirectTo()
  });
}

export async function sendRealtimeMessage(roomId, payload) {
  if (!supabase) return { ok: false, offline: true };
  const channel = supabase.channel(`chat:${roomId}`);
  await channel.subscribe();
  const result = await channel.send({ type: 'broadcast', event: 'message', payload });
  await supabase.removeChannel(channel);
  return { ok: result === 'ok' };
}
