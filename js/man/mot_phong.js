import { MODEL, MODEL_GOI_Y, html } from '../ui.js';
import { dong_viec, muc_kien_thuc } from './chung.js';

// Cần anh gồm cả việc Kẹt (cần anh xem)
export const NHOM = [['can_anh', 'Cần anh', ['cho_anh', 'ket']], ['dang_lam', 'Đang làm', ['dang_lam']], ['cho_lam', 'Chờ làm', ['cho_lam']], ['xong', 'Đã xong', ['xong']]];
const TRONG = { can_anh: 'Phòng này không cần anh lúc này.', dang_lam: 'Chưa có việc đang làm.', cho_lam: 'Chưa có việc chờ làm.', xong: 'Chưa có việc xong trong 30 ngày.' };

export function ve(d, tab) {
  const p = d.phong;
  const nhom = Object.fromEntries(NHOM.map(([k, , tt]) => [k, d.viec.filter((v) => tt.includes(v.trang_thai))]));
  const cur = nhom[tab] ? tab : 'can_anh';
  return html`
  <div class="model"><span class="nhan">Model của phòng</span>
    <div class="seg" role="radiogroup" aria-label="Model của phòng">${MODEL.map(([k, lb, nm]) =>
      html`<button role="radio" aria-checked="${p.model === k}" class="${p.model === k ? 'on' : ''}" data-act="doi-model" data-ma="${p.ma}" data-model="${k}">${lb}<small>${nm}</small></button>`)}</div>
    <span class="hint">${MODEL_GOI_Y[p.model]}</span></div>
  <details class="desc"><summary>Mô tả phòng</summary><p>${p.mo_ta}</p></details>
  <div class="tabs">${NHOM.map(([k, lb]) => html`<button class="${cur === k ? 'on' : ''} ${k === 'can_anh' && nhom.can_anh.length ? 'need' : ''}" data-act="tab" data-tab="${k}"><b class="num">${nhom[k].length}</b>${lb}</button>`)}</div>
  <section class="gan"><div class="list ${cur === 'can_anh' ? 'wait' : ''}">${nhom[cur].length ? nhom[cur].map((v) => dong_viec(v)) : html`<div class="empty">${TRONG[cur]}</div>`}</div></section>
  ${p.ghi_chu_khoa ? html`<div class="lock">🔒 ${p.ghi_chu_khoa}</div>` : ''}
  ${muc_kien_thuc(d.kien_thuc, 'Kiến thức của phòng', p.ma)}
  ${p.ma === 'gd' ? muc_kien_thuc(d.kien_thuc_chung, 'Kiến thức chung của công ty', null) : ''}
  <section><button class="btn rong" data-act="noi-y" data-dich="${p.ma}">+ Giao việc thẳng cho ${p.ten}</button></section>`;
}
