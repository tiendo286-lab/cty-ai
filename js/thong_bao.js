// Nút "Bật thông báo" ở trang đầu (chỉ hiện khi đã có khoá VAPID và thiết bị chưa đăng ký).
import { rpc } from './api.js';
import { VAPID_PUBLIC } from './cau_hinh.js';
import { $, html, toast } from './ui.js';

const co_ho_tro = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const la_iphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const mo_tu_man_hinh_chinh = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

function khoa(b64) {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}
async function da_dang_ky() {
  if (!co_ho_tro()) return false;
  const r = await navigator.serviceWorker.getRegistration();
  return !!(r && (await r.pushManager.getSubscription()));
}
async function ve_nut() {
  const o = $('#bat-thong-bao');
  if (!o || !VAPID_PUBLIC) return;
  if (la_iphone() && !mo_tu_man_hinh_chinh()) {
    o.innerHTML = String(html`<div class="lock">🔔 Muốn nhận thông báo trên iPhone: bấm nút Chia sẻ (ô vuông có mũi tên) → "Thêm vào MH chính" → mở Công ty AI từ biểu tượng mới, rồi bấm "Bật thông báo".</div>`);
    return;
  }
  if (!co_ho_tro() || Notification.permission === 'denied' || (await da_dang_ky())) { o.innerHTML = ''; return; }
  o.innerHTML = String(html`<button class="btn rong" data-act="bat-thong-bao">🔔 Bật thông báo về điện thoại</button>`);
}
export async function bat() {
  if ((await Notification.requestPermission()) !== 'granted') { toast('Anh chưa cho phép thông báo'); return; }
  const r = await navigator.serviceWorker.ready;
  const s = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: khoa(VAPID_PUBLIC) });
  const j = s.toJSON();
  await rpc('app_ai_dang_ky_thong_bao', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
  toast('Đã bật thông báo');
  ve_nut();
}
// đã có đăng ký trên thiết bị → gửi lại lên máy chủ mỗi lần mở trang (phòng lần trước gửi lỗi; máy chủ tự gộp trùng)
let da_gui_lai = false;
async function gui_lai() {
  if (da_gui_lai || !co_ho_tro()) return;
  da_gui_lai = true;
  const r = await navigator.serviceWorker.getRegistration();
  const s = r && (await r.pushManager.getSubscription());
  if (!s) return;
  const j = s.toJSON();
  await rpc('app_ai_dang_ky_thong_bao', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
}
document.addEventListener('da-ve', (e) => {
  if (e.detail.man !== 'trang-dau') return;
  gui_lai().catch(() => { da_gui_lai = false; });
  ve_nut().catch(() => {});
});
