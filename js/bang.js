// Bảng trượt và các nút hành động: nói ý / giao việc, xem việc (trả lời, Đồng ý, Đóng việc), nạp / bỏ kiến thức, đổi model, xem tệp.
import { HANH_DONG, ve } from './app.js';
import { rpc } from './api.js';
import { gui_tep } from './tep.js';
import { $, MAU_TRANG_THAI, bang, dong_bang, gio, html, toast } from './ui.js';

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

// ---------- xem một việc
const NGUOI = { anh: 'Anh', phong: '', he_thong: 'Hệ thống' };
async function mo_viec(id) {
  const d = await rpc('app_ai_viec', { p_id: Number(id) });
  const v = d.viec; const [lb] = MAU_TRANG_THAI[v.trang_thai] || ['', ''];
  const kien_thuc = v.loai === 'doc_kien_thuc';
  const giao = v.trang_thai === 'cho_anh' && v.loai === 'de_xuat_giao' ? (v.ket_qua?.giao || []) : [];
  const hieu = v.trang_thai === 'cho_anh' && kien_thuc ? (v.ket_qua?.hieu_la || []) : [];
  let hanh;
  if (v.trang_thai === 'dang_lam') {
    hanh = html`<textarea id="tra-loi" disabled placeholder="Phòng đang làm"></textarea><div class="khoa-nhan">Phòng đang làm, chờ xong rồi nhắn.</div>`;
  } else if (v.trang_thai === 'cho_anh') {
    hanh = html`<textarea id="tra-loi" placeholder="${kien_thuc ? 'Sửa lại nội dung kiến thức' : 'Trả lời hoặc góp ý (bấm micro để nói)'}">${kien_thuc ? v.noi_dung : ''}</textarea>
      <div class="acts"><button class="btn pri" data-act="dong-y" data-id="${v.id}">${kien_thuc ? 'Đúng, ghi lại' : 'Đồng ý'}</button>
      <button class="btn" data-act="gop-y" data-id="${v.id}">${kien_thuc ? 'Sửa lại' : 'Gửi góp ý'}</button>
      <button class="btn" data-act="dong-viec" data-id="${v.id}">Đóng việc</button></div>`;
  } else {
    hanh = html`<textarea id="tra-loi" placeholder="${v.trang_thai === 'ket' ? 'Nhắn để phòng làm lại' : 'Nhắn thêm cho phòng (việc sẽ mở lại)'}"></textarea>
      <div class="acts"><button class="btn pri" data-act="gop-y" data-id="${v.id}">${v.trang_thai === 'ket' ? 'Gửi, làm lại' : 'Gửi'}</button>
      ${v.trang_thai !== 'xong' ? html`<button class="btn" data-act="dong-viec" data-id="${v.id}">Đóng việc</button>` : ''}</div>`;
  }
  bang(String(html`<h3>${v.tieu_de}</h3><div class="sub">${v.phong_ten} · ${lb}${v.ly_do_ket ? ' · ' + v.ly_do_ket : ''}</div>
    ${d.tin.map((t) => html`<div class="bubble ${t.nguoi === 'anh' ? 'me' : ''}"><span class="who">${NGUOI[t.nguoi] || v.phong_ten} · ${gio(t.luc)}</span>${t.noi_dung}</div>`)}
    ${giao.length ? html`<div class="bubble"><span class="who">Giám đốc định giao</span>${giao.map((g) => html`<div class="assign"><span class="dot" style="background:var(--st-new);margin-top:6px"></span><span><b>${ten_phong(g.phong)}: ${g.tieu_de}</b>${g.noi_dung}</span></div>`)}</div>` : ''}
    ${hieu.length ? html`<div class="bubble"><span class="who">${v.phong_ten} đọc lại</span>Em hiểu là:<ul class="parts">${hieu.map((y) => html`<li>${y}</li>`)}</ul></div>` : ''}
    ${d.tep.length ? html`<div class="tep-ds">${d.tep.map((t) => html`<button data-act="xem-tep" data-id="${t.id}">📎 ${t.ten}</button>`)}</div>` : ''}
    ${hanh}`));
}
HANH_DONG['mo-viec'] = (el) => mo_viec(el.dataset.id).catch((e) => toast(e.message));
HANH_DONG['dong-y'] = (el) => bam(el, async () => {
  await rpc('app_ai_dong_y', { p_viec: Number(el.dataset.id) });
  dong_bang(); toast('Đã đồng ý'); await ve();
});
HANH_DONG['gop-y'] = (el) => bam(el, async () => {
  const nd = $('#tra-loi').value.trim();
  if (!nd) throw new Error('Anh nói hoặc gõ vài chữ trước đã');
  await rpc('app_ai_tra_loi', { p_viec: Number(el.dataset.id), p_noi_dung: nd });
  dong_bang(); toast('Đã gửi, phòng sẽ làm tiếp'); await ve();
});
HANH_DONG['dong-viec'] = (el) => bam(el, async () => {
  await rpc('app_ai_dong_viec', { p_viec: Number(el.dataset.id) });
  dong_bang(); toast('Đã đóng việc'); await ve();
});
HANH_DONG['xem-tep'] = (el) => rpc('app_ai_tep', { p_id: Number(el.dataset.id) }).then((t) => {
  const bytes = Uint8Array.from(atob(t.base64), (c) => c.charCodeAt(0));
  const u = URL.createObjectURL(new Blob([bytes], { type: t.mime }));
  const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener'; a.download = t.mime.startsWith('image/') || t.mime === 'application/pdf' ? '' : t.ten;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000);
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
