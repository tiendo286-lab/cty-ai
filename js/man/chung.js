// Mảnh giao diện dùng chung giữa các màn hình.
import { MAU_TRANG_THAI, html } from '../ui.js';

export function dong_viec(v, hien_phong = false) {
  const [lb, mau] = MAU_TRANG_THAI[v.trang_thai] || MAU_TRANG_THAI.cho_lam;
  return html`<button class="row" data-act="mo-viec" data-id="${v.id}"><span class="dot" style="background:${mau}" title="${lb}"></span>
    <span class="txt"><span class="t">${v.tieu_de}</span><br><span class="s">${hien_phong ? v.phong_ten + ' · ' : ''}${v.tom_tat || lb}</span></span><span class="chev">›</span></button>`;
}
export function luoi_phong(phong) {
  return html`<div class="depts">${phong.map((p) => {
    const [lb, mau] = MAU_TRANG_THAI[p.trang_thai] || MAU_TRANG_THAI.ranh;
    return html`<a class="dept ${p.ma === 'gd' ? 'big' : ''}" href="#phong-${p.ma}"><span class="n"><span class="dot" style="background:${mau}"></span>${p.ten}</span>
      <span class="st">${lb}${p.so_viec_mo ? ' · ' + p.so_viec_mo + ' việc' : ''}</span></a>`;
  })}</div>`;
}
export function muc_kien_thuc(ds, tieu_de, ma_phong) {
  return html`<section><div class="sec-h"><h2>${tieu_de} (${ds.length})</h2></div>
    <div class="list">${ds.length ? ds.map((k) => html`<button class="row ${k.trang_thai === 'da_bo' ? 'bo' : ''}" data-act="mo-kien-thuc" data-id="${k.id}" data-trang-thai="${k.trang_thai}" data-loai="${k.loai}" data-tep="${(k.tep || []).map((t) => t.id).join(',')}">
      <span class="txt"><span class="t">${k.noi_dung}</span>${k.trang_thai === 'da_bo' ? html`<br><span class="s">Đã bỏ · AI không làm theo nữa</span>` : ''}</span>
      <span class="ktag">${k.loai === 'tai_lieu' ? 'Tài liệu' : 'Đã chốt'}</span></button>`) : html`<div class="empty">Chưa có kiến thức nào. Bấm nút dưới để nạp.</div>`}</div>
    <button class="btn rong" data-act="nap-kien-thuc" data-phong="${ma_phong ?? ''}">+ Nạp kiến thức ${ma_phong ? 'cho phòng này' : 'cho cả công ty'}</button></section>`;
}
