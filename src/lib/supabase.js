import { createClient } from '@supabase/supabase-js';

// Supabase client her zaman çıplak proje origin'i ile oluşturulur.
// Vercel değişkenine yanlışlıkla /rest/v1 gibi bir yol eklenirse Auth URL'leri bozulmaz.
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
let url = rawUrl.trim();
try { url = new URL(url).origin; } catch { url = ''; }
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const supabaseConfigured = Boolean(url && key);

const productionRedirect = 'https://winkee-phi.vercel.app/';
const getEmailRedirectTo = () => {
  if (typeof window === 'undefined') return productionRedirect;
  const origin = window.location.origin;
  // Yerel geliştirme sunucusu kapalıyken doğrulama linkinin localhost'a düşmesini önle.
  return origin.includes('localhost') || origin.includes('127.0.0.1')
    ? productionRedirect
    : `${origin}/`;
};

export const supabase = supabaseConfigured ? createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
}) : null;

// Uygulamanın mevcut Auth ekranı doğrudan supabase.auth.signUp() kullandığı için
// emailRedirectTo'yu merkezi olarak ekliyoruz. Böylece doğrulama linki production
// Winkee'ye döner ve PKCE kodu Supabase client tarafından otomatik işlenebilir.
if (supabase) {
  const originalSignUp = supabase.auth.signUp.bind(supabase.auth);
  supabase.auth.signUp = (credentials) => {
    const options = credentials?.options || {};
    return originalSignUp({
      ...credentials,
      options: {
        ...options,
        emailRedirectTo: getEmailRedirectTo()
      }
    });
  };
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
    options: { data: metadata, emailRedirectTo: getEmailRedirectTo() }
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
