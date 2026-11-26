// Bảng trượt và các nút hành động: nói ý / giao việc, nạp / bỏ kiến thức, đổi model, xem tệp. Xem một việc: js/man/chat.js.
import { HANH_DONG, ve } from './app.js';
import { rpc } from './api.js';
import { gui_tep } from './tep.js';
import { bat } from './thong_bao.js';
import { $, bang, dong_bang, html, toast } from './ui.js';

let TQ = null;
document.addEventListener('da-ve', (e) => { TQ = e.detail.tq; });
const ten_phong = (ma) => TQ?.phong.find((p) => p.ma === ma)?.ten || ma;
const GIAO_TEP = html`<label class="file"><input type="file" id="tep" multiple accept="image/*,.pdf,.xlsx,.xls,.docx,.csv">📎 Kèm ảnh hoặc tệp (tối đa 6)</label><div id="tep-ten" class="hint"></div>`;

// tắt mọi nút trong bảng khi đang gửi (chặn bấm 2 lần), bật lại khi xong / lỗi
async function bam(el, viec) {
  const nut = [...document.querySelectorAll('#layer .acts button, #layer .acts textarea')];
  nut.forEach((b) => { b.disabled = true; });
  try { await viec(); } catch (e) { toast(e.message || 'Có lỗi, anh thử lại'); nut.forEach((b) => { if (b.isConnected) b.disabled = false; }); }
}
function gan_ten_tep() {
  const i = $('#tep');
  if (i) i.addEventListener('change', () => { $('#tep-ten').textContent = i.files.length ? `Đã chọn ${i.files.length} tệp: ${[...i.files].map((f) => f.name).join(', ')}` : ''; });
}

// ---------- nói ý / giao việc
function mo_noi_y(dich) {
  bang(String(html`<h3>${dich ? 'Giao việc cho ' + ten_phong(dich) : 'Nói ý mới'}</h3>
    <div class="sub">Bấm vào ô dưới, rồi bấm nút micro 🎤 trên bàn phím điện thoại để nói. Điện thoại tự gõ ra chữ.</div>
    <textarea id="noi-dung" placeholder="Ví dụ: tuần này thử món trà vải ở LL, nhớ tính giá vốn"></textarea>${GIAO_TEP}
    <div class="acts">${dich ? html`<button class="btn pri" data-act="gui" data-dich="${dich}">Giao cho ${ten_phong(dich)}</button>`
      : html`<button class="btn pri" data-act="gui" data-dich="gd">Gửi Giám đốc<br><small>giao việc cho các phòng</small></button>
             <button class="btn" data-act="gui" data-dich="tk">Gửi Thư ký<br><small>chỉ ghi lại</small></button>`}</div>`));
  gan_ten_tep();
  $('#noi-dung').focus();
}
HANH_DONG['noi-y'] = (el) => mo_noi_y(el.dataset.dich || '');
HANH_DONG.gui = (el) => bam(el, async () => {
  const nd = $('#noi-dung').value.trim(); const files = $('#tep').files;
  if (!nd && !files.length) throw new Error('Anh nói, gõ hoặc kèm tệp trước đã');
  const ids = await gui_tep(files);
  await rpc('app_ai_tao_viec', { p_dich: el.dataset.dich, p_noi_dung: nd, p_tep: ids });
  dong_bang();
  toast(el.dataset.dich === 'gd' ? 'Đã gửi. Giám đốc sẽ đề xuất cách giao ở mục Chờ anh' : el.dataset.dich === 'tk' ? 'Đã gửi Thư ký ghi lại' : 'Đã giao cho ' + ten_phong(el.dataset.dich));
  await ve();
});

// ---------- xem tệp (màn chat và thẻ kiến thức dùng chung); xem một việc: js/man/chat.js
HANH_DONG['xem-tep'] = (el) => rpc('app_ai_tep', { p_id: Number(el.dataset.id) }).then((t) => {
  // ảnh: hiện ngay trong bảng; tệp khác: hiện nút để anh tự bấm mở / tải (iPhone chặn mở tự động)
  el.parentElement.querySelectorAll('.xem-anh, .tep-mo').forEach((x) => x.remove());
  if (t.mime.startsWith('image/')) {
    const i = document.createElement('img');
    i.className = 'xem-anh'; i.alt = t.ten; i.src = `data:${t.mime};base64,${t.base64}`;
    el.insertAdjacentElement('afterend', i);
    return;
  }
  const bytes = Uint8Array.from(atob(t.base64), (c) => c.charCodeAt(0));
  const a = document.createElement('a');
  a.className = 'btn tep-mo'; a.href = URL.createObjectURL(new Blob([bytes], { type: t.mime }));
  a.textContent = (t.mime === 'application/pdf' ? 'Mở ' : 'Tải ') + t.ten;
  if (t.mime === 'application/pdf') { a.target = '_blank'; a.rel = 'noopener'; } else a.download = t.ten;
  el.insertAdjacentElement('afterend', a);
}).catch((e) => toast(e.message));

// ---------- kiến thức
function mo_nap_kien_thuc(phong) {
  bang(String(html`<h3>Nạp kiến thức: ${phong ? ten_phong(phong) : 'Cả công ty'}</h3>
    <div class="sub">Nói hoặc gõ điều ${phong ? 'phòng này' : 'mọi phòng'} cần biết. Có thể kèm ảnh hoặc tệp như công thức, bảng giá, mẫu Excel. Phòng sẽ đọc lại "Em hiểu là…", anh bấm Đúng mới ghi.</div>
    <textarea id="noi-dung" placeholder="Ví dụ: sữa tươi đã mở hộp chỉ dùng trong 24 giờ, quá giờ phải đổ bỏ"></textarea>${GIAO_TEP}
    <div class="acts"><button class="btn pri" data-act="gui-kien-thuc" data-phong="${phong || ''}">Gửi cho ${phong ? 'phòng' : 'Giám đốc'} đọc</button></div>`));
  gan_ten_tep();
}
HANH_DONG['nap-kien-thuc'] = (el) => mo_nap_kien_thuc(el.dataset.phong || null);
HANH_DONG['gui-kien-thuc'] = (el) => bam(el, async () => {
  const nd = $('#noi-dung').value.trim(); const files = $('#tep').files;
  if (!nd && !files.length) throw new Error('Anh nói, gõ hoặc kèm tệp trước đã');
  const ids = await gui_tep(files);
  await rpc('app_ai_gui_kien_thuc', { p_phong: el.dataset.phong || null, p_noi_dung: nd, p_tep: ids });
  dong_bang(); toast('Đã gửi, phòng sẽ đọc lại "Em hiểu là…" ở mục Chờ anh'); await ve();
});
HANH_DONG['mo-kien-thuc'] = (el) => {
  const bo = el.dataset.trangThai === 'da_bo';
  const tep = (el.dataset.tep || '').split(',').filter(Boolean);
  bang(String(html`<h3>${el.querySelector('.t').textContent}</h3><div class="sub">${el.dataset.loai === 'tai_lieu' ? 'Tài liệu' : 'Điều đã chốt'}${bo ? ' · đã bỏ' : ''}</div>
    <p class="hint">${bo ? 'Kiến thức này đang bị bỏ. Nhân viên AI không làm theo nữa.' : 'Nhân viên AI đang làm theo kiến thức này. Bỏ thì không xoá, chỉ đánh dấu, sau này dùng lại được.'}</p>
    ${tep.length ? html`<div class="tep-ds">${tep.map((t) => html`<button data-act="xem-tep" data-id="${t}">📎 Xem tệp</button>`)}</div>` : ''}
    <div class="acts"><button class="btn" data-act="bo-kt" data-id="${el.dataset.id}" data-bo="${bo ? '0' : '1'}">${bo ? 'Dùng lại kiến thức này' : 'Bỏ kiến thức này'}</button></div>`));
};
HANH_DONG['bo-kt'] = (el) => bam(el, async () => {
  const bo = el.dataset.bo === '1';
  await rpc('app_ai_bo_kien_thuc', { p_id: Number(el.dataset.id), p_bo: bo });
  dong_bang(); toast(bo ? 'Đã bỏ, AI không làm theo nữa' : 'Đã dùng lại'); await ve();
});

// ---------- model
HANH_DONG['doi-model'] = (el) => {
  if (el.getAttribute('aria-checked') === 'true') return;
  rpc('app_ai_doi_model', { p_ma: el.dataset.ma, p_model: el.dataset.model })
    .then(() => { toast('Đã đổi model của phòng'); return ve(); }).catch((e) => toast(e.message));
};

// ---------- thông báo
HANH_DONG['bat-thong-bao'] = () => bat().catch((e) => toast(e.message || 'Không bật được thông báo'));
