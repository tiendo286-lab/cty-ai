import { html } from '../ui.js';
import { o_doanh_thu } from './trang_dau.js';

export function ve(tq) {
  const n = tq.doanh_thu.ngay;
  return html`
  <p class="hint giua">Doanh thu ngày ${n.slice(8, 10)}/${n.slice(5, 7)} theo FABi</p>
  ${tq.doanh_thu.co_so.map((c) => html`<div class="store"><div class="h"><b>${c.ma}</b>
    ${c.ma === 'LLB' ? html`<span class="tag open">Web riêng</span>` : c.net == null ? html`<span class="tag no">Chưa có</span>` : html`<span class="tag ok">Có số</span>`}</div>
    <table><tr><td>Doanh thu hôm qua</td><td>${o_doanh_thu(c)}</td></tr></table></div>`)}
  <div class="store total"><div class="h"><b>Lãi lỗ tháng</b><span class="tag open">Có ở Đợt 3</span></div>
    <p class="hint">Kế toán và Kho sẽ tính lãi lỗ từng cơ sở, kho tổng và cả chuỗi (ghi "tạm tính" cho tới khi anh duyệt).</p></div>`;
}
