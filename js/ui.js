// Mẫu HTML tự thoát ký tự (giống web Milano), thông báo nhỏ, bảng trượt.
const RAW = Symbol('raw');
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const raw = (s) => ({ [RAW]: String(s), toString() { return String(s); } });
const part = (v) => {
  if (Array.isArray(v)) return v.flat(Infinity).map(part).join('');
  if (v && v[RAW] !== undefined) return v[RAW];
  if (v === false || v === null || v === undefined) return '';
  return esc(v);
};
export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => { out += s; if (i < vals.length) out += part(vals[i]); });
  return raw(out);
}
export const $ = (s, r = document) => r.querySelector(s);

export const MAU_TRANG_THAI = {
  ranh: ['Rảnh', 'var(--st-idle)'], cho_lam: ['Có việc mới', 'var(--st-new)'], dang_lam: ['Đang làm', 'var(--st-doing)'],
  cho_anh: ['Chờ anh', 'var(--st-wait)'], xong: ['Xong', 'var(--st-done)'], ket: ['Kẹt', 'var(--st-stuck)'],
};
export const MODEL = [['manh', 'Mạnh nhất', 'Opus'], ['can_bang', 'Cân bằng', 'Sonnet'], ['nhanh', 'Nhanh, tiết kiệm', 'Haiku']];
export const MODEL_GOI_Y = {
  manh: 'Cho việc khó: viết SOP, tính lãi lỗ. Tốn lượt dùng nhất.',
  can_bang: 'Cho việc thường ngày. Vừa đủ tốt, vừa đủ tiết kiệm.',
  nhanh: 'Cho việc đơn giản: ghi chép, nhắc lịch. Rẻ và nhanh.',
};

export function toast(chu) {
  document.querySelectorAll('.toast').forEach((x) => x.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = chu;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
export function bang(noi_dung) {
  $('#layer').innerHTML = `<div class="sheet-bg" data-dong-bang="1"><div class="sheet" role="dialog" aria-modal="true">${noi_dung}</div></div>`;
}
export function dong_bang() { $('#layer').innerHTML = ''; }
export const dang_mo_bang = () => !!$('#layer .sheet');

export const tr = (n) => (Number(n) / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tr';
const VN = { timeZone: 'Asia/Ho_Chi_Minh' };
export const gio = (ts) => new Date(ts).toLocaleTimeString('vi-VN', { ...VN, hour: '2-digit', minute: '2-digit' });
export const ngay_vn = (ts) => new Date(ts).toLocaleDateString('en-CA', VN);   // YYYY-MM-DD
export function ten_ngay(ts) {
  const d = ngay_vn(ts), now = Date.now();
  if (d === ngay_vn(now)) return 'Hôm nay ' + d.slice(8, 10) + '/' + d.slice(5, 7);
  if (d === ngay_vn(now - 864e5)) return 'Hôm qua ' + d.slice(8, 10) + '/' + d.slice(5, 7);
  return d.slice(8, 10) + '/' + d.slice(5, 7);
}
