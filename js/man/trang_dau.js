import { html, raw, tr } from '../ui.js';
import { dong_viec, luoi_phong } from './chung.js';

export const o_doanh_thu = (c) => (c.ma === 'LLB' ? 'Web riêng' : c.net === null || c.net === undefined ? 'Chưa có (Fabi chưa đồng bộ)' : tr(c.net));

export function ve(tq) {
  const mic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  return html`
  <button class="mic" data-act="noi-y">${raw(mic)}Bấm để nói ý mới</button>
  <div id="bat-thong-bao"></div>
  <section><div class="sec-h"><h2>Chờ anh (${tq.cho_anh.length})</h2></div>
    <div class="list wait">${tq.cho_anh.length ? tq.cho_anh.map((v) => dong_viec(v, true)) : html`<div class="empty">Không có việc nào chờ anh.</div>`}</div></section>
  <section><div class="sec-h"><h2>Doanh thu hôm qua</h2><a class="link" href="#so-lieu">Xem hết ›</a></div>
    <div class="kpis">${tq.doanh_thu.co_so.map((c) => html`<a class="kpi" href="#so-lieu"><div class="k">${c.ma}</div><div class="v num ${c.net == null ? 'nho' : ''}">${o_doanh_thu(c)}</div></a>`)}</div></section>
  <section><div class="sec-h"><h2>Các phòng</h2><a class="link" href="#phong">Xem hết ›</a></div>${luoi_phong(tq.phong)}</section>`;
}
