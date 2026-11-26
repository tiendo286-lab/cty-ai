// Màn chat của một việc (#viec-<id>): toàn màn hình, tin anh bên phải / phòng bên trái, markdown an toàn,
// tự hỏi phần mới (5 giây khi phòng đang làm / chờ làm, 20 giây khi khác; chỉ khi trang đang hiện), ô gõ kèm tệp.
// Không import app.js (tránh vòng nạp): app.js gọi mo() / dung() và gộp HANH vào HANH_DONG.
import { rpc } from '../api.js';
import { md_html } from '../md.js';
import { gui_tep } from '../tep.js';
import { $, MAU_TRANG_THAI, gio, html, raw, ten_ngay, toast } from '../ui.js';

const NHANH = 5000, CHAM = 20000, MAC_TAT_MS = 2 * 60 * 1000, GAN_DAY = 80;
const ACCEPT = 'image/*,.pdf,.xlsx,.xls,.docx,.csv';
const TEN_PHONG = { gd: 'Giám đốc', tk: 'Thư ký', ns: 'Nhân sự & Đào tạo', web: 'Kỹ sư web', kho: 'Kho', kt: 'Kế toán', rd: 'R&D' };
const S = { id: null, viec: null, tin: [], tep: [], mac: null, sau: 0, hen: null, chon: [], dang_gui: false, the: 0 };

const ICON = {
  lui: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  kep: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9"/></svg>',
  gui: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  tep: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  chep: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  bo: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

const ten_phong = () => S.viec?.phong_ten || 'Phòng';
const dang_cho = () => ['cho_lam', 'dang_lam'].includes(S.viec?.trang_thai);
const mac_tat = () => !S.mac?.lan_cuoi || Date.now() - new Date(S.mac.lan_cuoi).getTime() > MAC_TAT_MS;

// ---------- vẽ
function the_tep(t) {
  return html`<button class="tin-tep" data-act="xem-tep" data-id="${t.id}">${raw(ICON.tep)}<span>${t.ten}</span></button>`;
}
function mot_tin(t, tep_cua) {
  if (t.nguoi === 'he_thong') return html`<div class="tin-he" data-tin="${t.id}">${t.noi_dung} · ${gio(t.luc)}</div>`;
  const anh = t.nguoi === 'anh';
  const xep_hang = anh && S.viec.trang_thai === 'dang_lam' && S.viec.bat_dau && new Date(t.luc) > new Date(S.viec.bat_dau);
  return html`<div class="tin ${anh ? 'tin-anh' : 'tin-phong'}" data-tin="${t.id}">
    <div class="ai">${anh ? 'Anh' : ten_phong()} · ${gio(t.luc)}</div>
    <div class="md">${raw(md_html(t.noi_dung))}</div>
    ${tep_cua.length ? html`<div class="tin-tep-ds">${tep_cua.map(the_tep)}</div>` : ''}
    ${xep_hang ? html`<div class="xep-hang">Phòng sẽ đọc sau lượt này</div>` : ''}
    ${anh ? '' : html`<div class="tin-chan"><button class="chep" data-act="sao-chep" data-id="${t.id}">${raw(ICON.chep)}Sao chép</button></div>`}
  </div>`;
}
function khoi_cuoi() {
  const v = S.viec;
  const ra = [];
  if (v.trang_thai === 'cho_anh' && v.loai === 'de_xuat_giao' && (v.ket_qua?.giao || []).length) {
    ra.push(html`<div class="tin tin-phong"><div class="ai">Giám đốc định giao</div>${v.ket_qua.giao.map((g) => html`<div class="assign"><span class="dot" style="background:var(--st-new);margin-top:6px"></span><span><b>${TEN_PHONG[g.phong] || g.phong}: ${g.tieu_de}</b>${g.noi_dung}</span></div>`)}</div>`);
  }
  if (v.trang_thai === 'cho_anh' && v.loai === 'doc_kien_thuc' && (v.ket_qua?.hieu_la || []).length) {
    ra.push(html`<div class="tin tin-phong"><div class="ai">${ten_phong()} đọc lại</div>Em hiểu là:<ul class="parts">${v.ket_qua.hieu_la.map((y) => html`<li>${y}</li>`)}</ul></div>`);
  }
  if (dang_cho()) {
    if (mac_tat()) ra.push(html`<div class="dang-lam tat">Máy Mac đang tắt — việc sẽ làm khi Mac bật lại</div>`);
    else if (v.trang_thai === 'dang_lam') {
      const phut = v.bat_dau ? Math.max(0, Math.floor((Date.now() - new Date(v.bat_dau).getTime()) / 60000)) : 0;
      ra.push(html`<div class="dang-lam"><span class="cham"><i></i><i></i><i></i></span>${ten_phong()} đang làm… ${phut} phút</div>`);
    } else ra.push(html`<div class="dang-lam"><span class="cham"><i></i><i></i><i></i></span>Đang chờ ${ten_phong()} nhận việc…</div>`);
  }
  return ra;
}
function ve_ds() {
  const tin_ids = new Set(S.tin.map((t) => t.id));
  const mo_coi = S.tep.filter((t) => !t.tin_id || !tin_ids.has(t.tin_id));
  let ngay = '';
  const dong = [];
  if (mo_coi.length) dong.push(html`<div class="tin tin-phong"><div class="ai">Tệp kèm việc</div><div class="tin-tep-ds">${mo_coi.map(the_tep)}</div></div>`);
  for (const t of S.tin) {
    const d = ten_ngay(t.luc);
    if (d !== ngay) { ngay = d; dong.push(html`<div class="ngay">${d}</div>`); }
    dong.push(mot_tin(t, S.tep.filter((x) => x.tin_id === t.id)));
  }
  return html`${dong}${khoi_cuoi()}`;
}
function ve_dau() {
  const v = S.viec; const [lb, mau] = MAU_TRANG_THAI[v.trang_thai] || ['', ''];
  return html`<button class="lui" data-act="chat-lui" aria-label="Quay lại">${raw(ICON.lui)}</button>
    <div class="dau-chu"><h1>${v.tieu_de}</h1><div class="phu"><span class="dot" style="background:${mau}"></span>${ten_phong()} · ${lb}${v.trang_thai === 'ket' && v.ly_do_ket ? ' · ' + v.ly_do_ket : ''}</div></div>`;
}
function ve_nut() {
  const v = S.viec; const kt = v.loai === 'doc_kien_thuc';
  if (v.trang_thai === 'cho_anh') {
    return html`<button class="btn pri" data-act="dong-y">${kt ? 'Đúng, ghi lại' : 'Đồng ý'}</button>
      ${kt ? html`<button class="btn" data-act="sua-lai">Sửa lại</button>` : ''}
      <button class="btn" data-act="dong-viec">Đóng việc</button>`;
  }
  if (v.trang_thai === 'ket') return html`<button class="btn" data-act="dong-viec">Đóng việc</button>`;
  return '';
}
function goi_y() {
  const v = S.viec; const p = ten_phong();
  if (v.trang_thai === 'cho_anh') return v.loai === 'doc_kien_thuc' ? 'Sửa lại nội dung kiến thức…' : `Góp ý cho ${p}…`;
  if (v.trang_thai === 'ket') return 'Nhắn để phòng làm lại…';
  if (v.trang_thai === 'xong') return 'Nhắn thêm (việc sẽ mở lại)…';
  return `Nhắn thêm cho ${p}…`;
}
function ve_chon() {
  return html`${S.chon.map((f, i) => html`<span class="chon-tep">${f.name}<button type="button" data-act="bo-tep" data-i="${i}" aria-label="${'Bỏ tệp ' + f.name}">${raw(ICON.bo)}</button></span>`)}`;
}

function gan_day(ds) { return ds.scrollHeight - ds.scrollTop - ds.clientHeight <= GAN_DAY; }
function cuon_day() { const ds = $('#chat-ds'); if (ds) ds.scrollTop = ds.scrollHeight; $('#tin-moi')?.setAttribute('hidden', ''); }

function ve_lai(co_tin_moi = false) {
  if (!$('#chat')) return;
  const ds = $('#chat-ds');
  const o_day = gan_day(ds);
  $('#chat-dau').innerHTML = String(ve_dau());
  ds.innerHTML = String(ve_ds());
  $('#chat-nut').innerHTML = String(ve_nut());
  $('#chat-nut').hidden = !String(ve_nut()).trim();
  $('#go-chu').placeholder = goi_y();
  if (o_day) cuon_day();
  else if (co_tin_moi) $('#tin-moi').removeAttribute('hidden');
}

function ve_khung() {
  $('#nav').innerHTML = '';
  $('#app').innerHTML = String(html`<div class="chat" id="chat">
    <header class="chat-dau" id="chat-dau"></header>
    <main class="chat-ds" id="chat-ds" aria-live="polite"></main>
    <button class="tin-moi" id="tin-moi" data-act="tin-moi" hidden>Tin mới ↓</button>
    <footer class="chat-chan">
      <div class="chat-nut" id="chat-nut"></div>
      <div class="chon-ds" id="chon-ds"></div>
      <form class="go" id="chat-go">
        <label class="kep" title="Kèm ảnh hoặc tệp (tối đa 6)">${raw(ICON.kep)}<span class="an">Kèm ảnh hoặc tệp</span>
          <input type="file" id="go-tep" multiple accept="${ACCEPT}"></label>
        <label class="go-o"><span class="an">Tin nhắn</span><textarea id="go-chu" rows="1"></textarea></label>
        <button class="gui" type="submit" aria-label="Gửi">${raw(ICON.gui)}</button>
      </form>
    </footer>
  </div>`);
  const chu = $('#go-chu');
  chu.addEventListener('input', () => { chu.style.height = 'auto'; chu.style.height = Math.min(chu.scrollHeight, 150) + 'px'; });
  $('#go-tep').addEventListener('change', (e) => {
    const moi = [...e.target.files];
    if (S.chon.length + moi.length > 6) toast('Chỉ lấy 6 tệp');
    S.chon = [...S.chon, ...moi].slice(0, 6);
    e.target.value = '';
    $('#chon-ds').innerHTML = String(ve_chon());
  });
  $('#chat-go').addEventListener('submit', (e) => { e.preventDefault(); gui(); });
  $('#chat-ds').addEventListener('scroll', () => { if (gan_day($('#chat-ds'))) $('#tin-moi')?.setAttribute('hidden', ''); });
  vua_man();
}

// iPhone: giữ khung đúng phần màn hình còn lại khi bàn phím bật
function vua_man() {
  const c = $('#chat'); const vv = window.visualViewport;
  if (!c || !vv) return;
  c.style.height = vv.height + 'px';
  c.style.top = vv.offsetTop + 'px';
}
window.visualViewport?.addEventListener('resize', vua_man);
window.visualViewport?.addEventListener('scroll', vua_man);

// ---------- dữ liệu
function nhan(d, ca_lan = false) {
  // hai lượt hỏi có thể chạy cùng lúc (gửi tin đúng lúc tới lượt tự hỏi) → chỉ thêm tin / tệp chưa có
  if (ca_lan) { S.tin = d.tin; S.tep = d.tep; } else {
    S.tin = [...S.tin, ...d.tin.filter((t) => !S.tin.some((x) => x.id === t.id))];
    S.tep = [...S.tep, ...d.tep.filter((t) => !S.tep.some((x) => x.id === t.id))];
  }
  S.viec = { ...S.viec, ...d.viec };
  S.mac = d.mac || S.mac;
  S.sau = Math.max(S.sau, ...S.tin.map((t) => t.id || 0));
}

function hen_gio() {
  clearTimeout(S.hen);
  if (S.id === null || document.visibilityState !== 'visible') return;
  const the = S.the;
  S.hen = setTimeout(() => hoi(the), dang_cho() ? NHANH : CHAM);
}
async function hoi(the) {
  if (the !== S.the || S.id === null) return;
  try {
    const d = await rpc('app_ai_viec_moi', { p_id: S.id, p_sau_tin: S.sau });
    if (the !== S.the) return;
    const co_moi = d.tin.length > 0;
    nhan(d);
    ve_lai(co_moi);
  } catch (e) { /* mất mạng: thử lại lượt sau */ }
  if (the === S.the) hen_gio();
}

// co_truoc: đã có màn khác của trang trước màn chat (bấm ‹ thì quay về); mở thẳng từ thông báo → về Trang đầu
export async function mo(id, co_truoc = false) {
  dung();
  const the = ++S.the;
  S.id = Number(id); S.chon = []; S.sau = 0; S.co_truoc = co_truoc;
  const d = await rpc('app_ai_viec', { p_id: S.id });
  if (the !== S.the) return;
  S.viec = d.viec;
  nhan(d, true);
  ve_khung();
  ve_lai();
  cuon_day();
  hen_gio();
}
export function dung() {
  clearTimeout(S.hen);
  S.hen = null; S.id = null; S.the++;
}
document.addEventListener('visibilitychange', () => {
  if (S.id === null) return;
  if (document.visibilityState === 'visible') hoi(S.the); else clearTimeout(S.hen);
});

async function tai_lai() { if (S.id !== null) await mo(S.id, S.co_truoc); }

async function bam(viec) {
  const nut = [...document.querySelectorAll('#chat-nut button, #chat-go button, #go-chu')];
  nut.forEach((b) => { b.disabled = true; });
  try { await viec(); } catch (e) { toast(e.message || 'Có lỗi, anh thử lại'); } finally { nut.forEach((b) => { if (b.isConnected) b.disabled = false; }); }
}

async function gui() {
  if (S.dang_gui) return;
  const chu = $('#go-chu'); const nd = chu.value.trim();
  if (!nd && !S.chon.length) { toast('Anh nói, gõ hoặc kèm tệp trước đã'); return; }
  S.dang_gui = true;
  await bam(async () => {
    const ids = await gui_tep(S.chon);
    await rpc('app_ai_tra_loi', { p_viec: S.id, p_noi_dung: nd, p_tep: ids });
    chu.value = ''; chu.style.height = 'auto'; S.chon = []; $('#chon-ds').innerHTML = '';
    if (S.viec.trang_thai !== 'dang_lam') S.viec.trang_thai = 'cho_lam';
    await hoi(S.the);
    cuon_day();
  });
  S.dang_gui = false;
}

// ---------- nút bấm (app.js gộp vào HANH_DONG)
export const HANH = {
  'mo-viec': (el) => { location.hash = '#viec-' + el.dataset.id; },
  'chat-lui': () => { if (S.co_truoc) history.back(); else location.hash = '#trang-dau'; },
  'tin-moi': () => cuon_day(),
  'bo-tep': (el) => { S.chon.splice(Number(el.dataset.i), 1); $('#chon-ds').innerHTML = String(ve_chon()); },
  'sao-chep': (el) => {
    const t = S.tin.find((x) => String(x.id) === el.dataset.id);
    if (!t) return;
    (navigator.clipboard?.writeText(t.noi_dung) || Promise.reject()).then(() => toast('Đã chép')).catch(() => toast('Không chép được'));
  },
  'sua-lai': () => { const o = $('#go-chu'); o.value = S.viec.noi_dung || ''; o.dispatchEvent(new Event('input')); o.focus(); },
  'dong-y': () => bam(async () => {
    const o = $('#go-chu');
    // nạp kiến thức: anh đã sửa chữ mà bấm Đúng → gửi bản sửa cho phòng đọc lại, không ghi bản cũ
    if (S.viec.loai === 'doc_kien_thuc' && o.value.trim() && o.value.trim() !== (S.viec.noi_dung || '').trim()) {
      await rpc('app_ai_tra_loi', { p_viec: S.id, p_noi_dung: o.value.trim(), p_tep: [] });
      o.value = ''; toast('Anh đã sửa nội dung — phòng sẽ đọc lại bản mới'); await tai_lai(); return;
    }
    await rpc('app_ai_dong_y', { p_viec: S.id });
    toast('Đã đồng ý'); await tai_lai();
  }),
  'dong-viec': () => bam(async () => { await rpc('app_ai_dong_viec', { p_viec: S.id }); toast('Đã đóng việc'); await tai_lai(); }),
};
