import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);
export const supabase = supabaseConfigured ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

export async function signInWithEmail(email, password) {
  if (!supabase) throw new Error('Supabase bağlantısı yapılandırılmamış.');
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password, username) {
  if (!supabase) throw new Error('Supabase bağlantısı yapılandırılmamış.');
  return supabase.auth.signUp({ email, password, options: { data: { username } } });
}

export async function sendRealtimeMessage(roomId, payload) {
  if (!supabase) return { ok: false, offline: true };
  const channel = supabase.channel(`chat:${roomId}`);
  await channel.subscribe();
  const result = await channel.send({ type: 'broadcast', event: 'message', payload });
  await supabase.removeChannel(channel);
  return { ok: result === 'ok' };
}
