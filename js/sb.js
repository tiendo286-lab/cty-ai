import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { STORAGE_KEY, SUPABASE_KEY, SUPABASE_URL } from './cau_hinh.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: STORAGE_KEY },
});
export async function rpc(ten, args = {}) {
  const { data, error } = await sb.rpc(ten, args);
  if (error) throw new Error(error.message || 'Lỗi máy chủ');
  return data;
}
export async function da_dang_nhap() {
  const { data } = await sb.auth.getSession();
  return !!data?.session;
}
