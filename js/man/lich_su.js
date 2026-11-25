import { html, ten_ngay } from '../ui.js';

export const LOC = [['tat_ca', 'Tất cả'], ['da_duyet', 'Anh đã duyệt'], ['chua_tra_loi', 'Chưa trả lời'], ['chua_xong', 'Ý chưa xong']];
const NHAN = { da_duyet: ['ok', 'Đã duyệt'], chua_tra_loi: ['no', 'Chưa trả lời'], qua_han: ['late', 'Quá hạn'], chua_xong: ['open', 'Chưa xong'] };

export function ve(ds, loc) {
  const nhom = [];
  for (const x of ds) {
    const d = ten_ngay(x.luc);
    if (!nhom.length || nhom.at(-1).d !== d) nhom.push({ d, ds: [] });
    nhom.at(-1).ds.push(x);
  }
  return html`<div class="chips">${LOC.map(([k, lb]) => html`<button class="${loc === k ? 'on' : ''}" data-act="loc" data-loc="${k}">${lb}</button>`)}</div>
  ${nhom.length ? nhom.map((g) => html`<div class="day">${g.d}</div><div class="list">${g.ds.map((x) => {
    const [cls, lb] = NHAN[x.loai];
    return html`<button class="row" data-act="mo-viec" data-id="${x.viec_id}"><span class="txt"><span class="t">${x.tieu_de}</span><br><span class="s">${x.phong_ten}</span></span><span class="tag ${cls}">${lb}</span></button>`;
  })}</div>`) : html`<div class="empty">Không có gì trong mục này.</div>`}`;
}
