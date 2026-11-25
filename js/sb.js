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

const LOI_DN = 'Mã nhân viên hoặc mật khẩu không đúng.';
// giống trang đăng nhập web Milano: mã nhân viên → địa chỉ đăng nhập (app_login_email) → mật khẩu
export async function dang_nhap(ma, mk) {
  const r = await rpc('app_login_email', { p_login: ma });
  if (!r || r.error) throw new Error(LOI_DN);
  const { error } = await sb.auth.signInWithPassword({ email: r.email, password: mk });
  if (error) throw new Error(/Invalid login credentials/i.test(error.message || '') ? LOI_DN : error.message);
  await rpc('app_touch_login').catch(() => {});
}
