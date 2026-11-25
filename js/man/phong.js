import { MAU_TRANG_THAI, html } from '../ui.js';
import { luoi_phong, muc_kien_thuc } from './chung.js';

export function ve(tq, kt_chung) {
  return html`<section>${luoi_phong(tq.phong)}</section>
  ${muc_kien_thuc(kt_chung, 'Kiến thức chung của công ty', null)}
  <section><div class="sec-h"><h2>Ý nghĩa màu</h2></div><div class="list">${Object.values(MAU_TRANG_THAI).map(([lb, mau]) =>
    html`<div class="row"><span class="dot" style="background:${mau}"></span><span class="txt">${lb}</span></div>`)}</div></section>`;
}
