// Trang Công ty AI: định tuyến #..., đầu trang (trạng thái máy Mac), thanh dưới, tải lại mỗi 20 giây.
import { GIA, da_dang_nhap, rpc } from './api.js';
import { WEB_MILANO } from './cau_hinh.js';
import { $, dang_mo_bang, dong_bang, gio, html, raw, toast } from './ui.js';
import * as trang_dau from './man/trang_dau.js';
import * as phong from './man/phong.js';
import * as mot_phong from './man/mot_phong.js';
import * as so_lieu from './man/so_lieu.js';
import * as lich_su from './man/lich_su.js';

export const HANH_DONG = {};          // các nút bấm: bang.js đăng ký thêm (data-act="...")
export const trang = { tab: 'can_anh', loc: 'tat_ca' };
let dang_ve = null;      // lời hứa của lần vẽ đang chạy
let ve_lai = false;      // có yêu cầu vẽ lại trong lúc đang vẽ

const ICON = {
  'trang-dau': '<path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z" stroke-linejoin="round"/>',
  phong: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  'so-lieu': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke-linecap="round"/>',
  'lich-su': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/>',
};
const MUC = [['trang-dau', 'Trang đầu'], ['phong', 'Phòng'], ['so-lieu', 'Số liệu'], ['lich-su', 'Lịch sử']];

function duong() {
  const h = location.hash.replace(/^#/, '') || 'trang-dau';
  if (h.startsWith('phong-')) return { man: 'mot-phong', ma: h.slice(6) };
  return { man: MUC.some(([k]) => k === h) ? h : 'trang-dau' };
}

function pill(mac) {
  if (mac?.dang_nhap_loi) return html`<span class="pill canh"><span class="dot"></span>Claude trên Mac hết đăng nhập</span>`;
  if (mac?.ket_noi) return html`<span class="pill"><span class="dot"></span>Mac đang bật</span>`;
  return html`<span class="pill loi"><span class="dot"></span>${mac?.lan_cuoi ? 'Mac mất kết nối từ ' + gio(mac.lan_cuoi) : 'Mac chưa kết nối'}</span>`;
}
function dau_trang(tieu_de, mac, quay_lai) {
  return html`<header class="top">${quay_lai ? html`<a class="back" href="#${quay_lai}" aria-label="Quay lại">‹</a>` : ''}<h1>${tieu_de}</h1>${pill(mac)}</header>`;
}
function thanh_duoi(on, so_cho) {
  $('#nav').innerHTML = String(html`<div class="in">${MUC.map(([k, lb]) => html`<a class="${on === k ? 'on' : ''}" href="#${k}" aria-current="${on === k ? 'page' : 'false'}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${raw(ICON[k])}</svg>${lb}${k === 'trang-dau' && so_cho ? html`<span class="badge">${so_cho}</span>` : ''}</a>`)}</div>`);
}

function man_khoa(chu, nut) {
  $('#nav').innerHTML = '';
  $('#app').innerHTML = String(html`<div class="man-khoa"><h1>Công ty AI</h1><p>${chu}</p>${nut || ''}</div>`);
}

export function ve() {
  if (dang_ve) { ve_lai = true; return dang_ve; }
  dang_ve = ve_mot().finally(() => {
    dang_ve = null;
    if (ve_lai) { ve_lai = false; return ve(); }
  });
  return dang_ve;
}

async function ve_mot() {
  try {
    if (!GIA && !(await da_dang_nhap())) {
      man_khoa('Anh chưa đăng nhập. Mở web Milano, đăng nhập bằng tài khoản Chủ, rồi quay lại trang này.',
        html`<a class="btn pri" href="${WEB_MILANO}">Đăng nhập ở web Milano</a>`);
      return;
    }
    if (!(await rpc('app_ai_la_chu'))) { man_khoa('Trang này chỉ dành cho Chủ.'); return; }
    const d = duong();
    const tq = await rpc('app_ai_tong_quan');
    let than, tieu_de = 'Công ty AI', quay_lai = null;
    if (d.man === 'trang-dau') than = trang_dau.ve(tq);
    else if (d.man === 'phong') { tieu_de = 'Các phòng'; than = phong.ve(tq, await rpc('app_ai_kien_thuc_chung')); }
    else if (d.man === 'mot-phong') {
      const p = await rpc('app_ai_phong', { p_ma: d.ma });
      tieu_de = p.phong.ten; quay_lai = 'phong'; than = mot_phong.ve(p, trang.tab);
    } else if (d.man === 'so-lieu') { tieu_de = 'Số liệu'; than = so_lieu.ve(tq); }
    else { tieu_de = 'Lịch sử'; than = lich_su.ve(await rpc('app_ai_lich_su', { p_loc: trang.loc }), trang.loc); }
    $('#app').innerHTML = String(dau_trang(tieu_de, tq.mac, quay_lai)) + String(than);
    thanh_duoi(d.man === 'mot-phong' ? 'phong' : d.man, tq.cho_anh.length);
    document.dispatchEvent(new CustomEvent('da-ve', { detail: { man: d.man, tq } }));
  } catch (e) {
    toast(e.message || 'Không tải được dữ liệu');
    if (/chỉ dành cho Chủ/.test(e.message)) man_khoa('Trang này chỉ dành cho Chủ.');
  }
}

HANH_DONG.tab = (el) => { trang.tab = el.dataset.tab; ve(); };
HANH_DONG.loc = (el) => { trang.loc = el.dataset.loc; ve(); };

document.addEventListener('click', (e) => {
  const nen = e.target.closest('[data-dong-bang]');
  if (nen && e.target === nen) { dong_bang(); return; }
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const f = HANH_DONG[el.dataset.act];
  if (f) { e.preventDefault(); f(el); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dong_bang(); });
window.addEventListener('hashchange', () => { trang.tab = 'can_anh'; dong_bang(); ve().then(() => window.scrollTo(0, 0)); });
setInterval(() => { if (document.visibilityState === 'visible' && !dang_mo_bang()) ve(); }, 20000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !dang_mo_bang()) ve(); });

import('./bang.js').catch((e) => console.error(e)).finally(() => ve());
