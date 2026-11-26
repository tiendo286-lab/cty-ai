// Dữ liệu giả cho ?gia=1: mô phỏng hàm app_ai_* (cùng quy tắc với tệp 177) và một "máy Mac" làm việc ngay lập tức.
// Chỉ để thử giao diện; không gọi mạng. window.__gia ghi lại lời gọi để bài thử kiểm tra.
const Q = new URLSearchParams(location.search);
const now = () => new Date().toISOString();
const truoc = (gio) => new Date(Date.now() - gio * 36e5).toISOString();
const log = (window.__gia = { goi: [], tep: [] });

const PHONG = [
  ['gd', 'Giám đốc', 'manh', 'Nhận việc anh giao, chia cho đúng phòng. Giai đoạn đầu: đề xuất, anh bấm Đồng ý mới giao.'],
  ['tk', 'Thư ký', 'nhanh', 'Việc riêng của anh: ghi họp và kế hoạch mới từ giọng nói, lên lịch, nhắc lịch.'],
  ['ns', 'Nhân sự & Đào tạo', 'manh', 'Hồ sơ nhân viên, viết SOP (pha chế trước, quản lý sau), kế hoạch đào tạo.'],
  ['web', 'Kỹ sư web', 'manh', 'Danh sách tính năng web, góp ý tháng chạy thử chốt ca, đưa SOP lên web, sửa lỗi.'],
  ['kho', 'Kho', 'can_bang', 'Số liệu iPOS IVT, kiểm kê, phiếu giao hàng cuối tháng, lãi lỗ kho tổng.'],
  ['kt', 'Kế toán', 'can_bang', 'Tính lương từ iPOS HRM, lãi lỗ từng cơ sở và toàn chuỗi.'],
  ['rd', 'R&D', 'manh', 'Kế hoạch phát triển và thử sản phẩm mới.'],
].map(([ma, ten, model, mo_ta], i) => ({ ma, ten, model, mo_ta, mo: true, thu_tu: i + 1,
  ghi_chu_khoa: ma === 'kt' ? 'Soát tiền ca (FABi so với chốt ca): mở sau tháng chạy thử chốt ca.' : null }));

let id = 100;
const VIEC = [];
const TIN = [];
const TEP = [];
const KT = [];
function them_viec(o) {
  const v = { id: ++id, loai: 'viec', noi_dung: '', trang_thai: 'cho_lam', ket_qua: null, ly_do_ket: null, cho_ca_cong_ty: false,
    cha_id: null, tao_luc: now(), cap_nhat: now(), xong_luc: null, ...o };
  VIEC.push(v); return v;
}
const tin = (viec_id, nguoi, noi_dung, hanh_dong = null, luc = now()) => { const t = { id: ++id, viec_id, nguoi, noi_dung, hanh_dong, luc }; TIN.push(t); return t.id; };

// --- dữ liệu ban đầu (ví dụ, không phải số thật)
let v = them_viec({ phong: 'ns', tieu_de: 'Duyệt SOP pha chế: phần Sữa & kem', trang_thai: 'cho_anh', cap_nhat: truoc(5) });
tin(v.id, 'anh', 'Viết SOP pha chế phần sữa từ ảnh công thức', 'giao', truoc(30)); tin(v.id, 'phong', '✅ CẦN DUYỆT Bản nháp 12 trang, quản lý đã góp ý.', null, truoc(5));
v = them_viec({ phong: 'kho', tieu_de: 'Ngày kiểm kê kho tổng tháng 11?', trang_thai: 'cho_anh', cap_nhat: truoc(80) });
tin(v.id, 'phong', '❓ HỎI ANH Anh cho em biết ngày kiểm kê kho tổng tháng 11 để tính lãi lỗ chuẩn.', null, truoc(80));
v = them_viec({ phong: 'ns', tieu_de: 'SOP pha chế: phần Trà', trang_thai: 'dang_lam' }); tin(v.id, 'anh', 'Viết tiếp phần Trà', 'giao');
v = them_viec({ phong: 'web', tieu_de: 'Chốt ca: thêm ô ghi chú bàn giao', trang_thai: 'dang_lam', bat_dau: truoc(0.05), tu_xong: true }); tin(v.id, 'anh', 'Thêm ô ghi chú bàn giao', 'giao', truoc(0.06));
them_viec({ phong: 'kt', tieu_de: 'Tính lương tháng 11', trang_thai: 'cho_lam' });
v = them_viec({ phong: 'tk', loai: 'ghi_chep', tieu_de: 'Biên bản họp quản lý 24/11', trang_thai: 'xong', xong_luc: now() });
tin(v.id, 'phong', '✅ XONG 5 ý chính, 3 việc cần làm.');
v = them_viec({ phong: 'kho', tieu_de: 'Thử nội dung lạ', trang_thai: 'xong', xong_luc: now() });
tin(v.id, 'anh', 'Đọc tệp nhà cung cấp gửi', 'giao', truoc(2));
tin(v.id, 'phong', '✅ XONG\nTệp có dòng lạ: <img src=x onerror="window.__doc=1"> và [bấm](javascript:window.__doc=2)', null, truoc(1.9));
v = them_viec({ phong: 'kt', tieu_de: 'Lãi lỗ tháng 10', trang_thai: 'ket', ly_do_ket: 'Quá 30 phút' });
tin(v.id, 'anh', 'Tính lãi lỗ tháng 10', 'giao', truoc(3)); tin(v.id, 'he_thong', '⛔ Kẹt: Quá 30 phút', null, truoc(2.4));
v = them_viec({ phong: 'ns', loai: 'doc_kien_thuc', tieu_de: 'Nạp kiến thức: sữa mở hộp', noi_dung: 'Sữa tươi mở hộp dùng trong 24 giờ', trang_thai: 'cho_anh',
  ket_qua: { hieu_la: ['Sữa tươi đã mở hộp chỉ dùng trong 24 giờ'] } });
tin(v.id, 'anh', 'Sữa tươi mở hộp dùng trong 24 giờ', 'nap_kien_thuc', truoc(1)); tin(v.id, 'phong', '✅ CẦN DUYỆT\nEm hiểu là:\n- Sữa tươi đã mở hộp chỉ dùng trong 24 giờ', null, truoc(0.9));
KT.push({ id: ++id, phong: null, loai: 'da_chot', noi_dung: '2026-11-25: Không sửa dữ liệu web, không đụng tiền, không nhắn tin cho nhân viên quán, khách, nhà cung cấp.', trang_thai: 'dang_dung', tao_luc: truoc(20) });
KT.push({ id: ++id, phong: null, loai: 'da_chot', noi_dung: '2026-11-25: LLB là Lela Box, bán web riêng, không qua FABi.', trang_thai: 'dang_dung', tao_luc: truoc(20) });
KT.push({ id: ++id, phong: 'ns', loai: 'da_chot', noi_dung: '2026-11-25: Làm SOP pha chế trước, SOP quản lý sau.', trang_thai: 'dang_dung', tao_luc: truoc(20) });
KT.push({ id: ++id, phong: 'kho', loai: 'da_chot', noi_dung: '2026-11-25: Hàng cân chênh dưới 2% là chênh nhỏ khi cân.', trang_thai: 'dang_dung', tao_luc: truoc(20) });
const MAC = { lan_cuoi: now(), dang_nhap_loi: false };
const DOANH_THU = [['LHP', 8200000], ['ĐK', 6100000], ['HS', null], ['LL', 7000000], ['LLB', null]];

// --- tiện ích
const loi = (m) => { throw new Error(m); };
const can_chu = () => { if (Q.has('khong_chu')) loi('Trang này chỉ dành cho Chủ'); };
const ten_phong = (ma) => PHONG.find((p) => p.ma === ma)?.ten;
const viec_ngan = (v) => ({ id: v.id, phong: v.phong, phong_ten: ten_phong(v.phong), loai: v.loai, tieu_de: v.tieu_de, trang_thai: v.trang_thai,
  cap_nhat: v.cap_nhat, tom_tat: (TIN.filter((t) => t.viec_id === v.id).at(-1)?.noi_dung || '').slice(0, 120) });
const kt_ra = (k) => ({ ...k, tep: TEP.filter((t) => t.kien_thuc_id === k.id).map(({ id, ten, mime }) => ({ id, ten, mime })) });
const sap_kt = (a, b) => (a.trang_thai > b.trang_thai ? -1 : a.trang_thai < b.trang_thai ? 1 : b.id - a.id);
function trang_thai_phong(ma) {
  const ds = VIEC.filter((v) => v.phong === ma).map((v) => v.trang_thai);
  for (const k of ['ket', 'cho_anh', 'dang_lam', 'cho_lam']) if (ds.includes(k)) return k;
  return VIEC.some((v) => v.phong === ma && v.trang_thai === 'xong' && v.xong_luc && v.xong_luc.slice(0, 10) === now().slice(0, 10)) ? 'xong' : 'ranh';
}
const lay_viec = (i) => VIEC.find((v) => v.id === Number(i)) || loi('Không có việc này');
const sua = (v, o) => Object.assign(v, o, { cap_nhat: now() });
const tieu_de = (nd, tep) => (nd ? nd.replace(/\s+/g, ' ').slice(0, 80) : (TEP.find((t) => t.id === tep[0])?.ten || 'Tệp anh gửi'));

// --- "máy Mac" giả: làm ngay
function mac_lam(v) {
  if (v.loai === 'de_xuat_giao') {
    sua(v, { trang_thai: 'cho_anh', ket_qua: { giao: [
      { phong: 'rd', tieu_de: 'Kế hoạch thử theo ý anh', noi_dung: 'Lên kế hoạch thử: ' + (v.noi_dung || v.tieu_de) },
      { phong: 'kho', tieu_de: 'Gửi giá nhập nguyên liệu', noi_dung: 'Gửi giá nhập mới nhất cho R&D tính giá vốn' }] } });
    tin(v.id, 'phong', '✅ CẦN DUYỆT Em định giao 2 việc như dưới đây.');
  } else if (v.loai === 'ghi_chep') {
    sua(v, { trang_thai: 'xong', xong_luc: now() }); tin(v.id, 'phong', '✅ XONG Thư ký đã sắp xếp lại: ' + v.noi_dung);
  } else if (v.loai === 'doc_kien_thuc') {
    const y = (v.noi_dung || '').split(/[.;\n]+/).map((s) => s.trim()).filter(Boolean);
    sua(v, { trang_thai: 'cho_anh', ket_qua: { hieu_la: y.length ? y : ['Em sẽ đọc và làm theo tệp anh gửi'] } });
    tin(v.id, 'phong', '✅ CẦN DUYỆT Em hiểu là: ' + (y.join('; ') || 'tệp anh gửi'));
  } else {
    sua(v, { trang_thai: 'dang_lam', bat_dau: now(), tu_xong: true, xong_sau: Date.now() + 6000 });
  }
}
const BANG_8 = '| Tên | Cơ sở | Giờ công | Giờ lịch | Lệch | Phụ cấp | Lương | Ghi chú |\n|---|---|---|---|---|---|---|---|\n'
  + '| Nhân viên A | LHP | 208 | 200 | +8 | 300.000 | 6.240.000 | Kiểm lại |\n| Nhân viên B | ĐK | 190 | 192 | -2 | 0 | 5.700.000 | |';
function mac_xong_neu_den(v) {
  if (v.trang_thai !== 'dang_lam' || !v.tu_xong) return;
  if (!v.xong_sau) { v.xong_sau = Date.now() + 6000; return; }
  if (Date.now() < v.xong_sau) return;
  sua(v, { trang_thai: 'cho_anh', tu_xong: false, xong_sau: null });
  const t = tin(v.id, 'phong', '✅ CẦN DUYỆT\n## Đã làm\n- Thêm ô **ghi chú bàn giao** ở trang chốt ca\n- Việc chưa xong tự hiện cho ca sau\n\n## Bảng ví dụ\n' + BANG_8
    + '\n\nĐang ở nhánh riêng, **chưa đưa lên web thật**.');
  TEP.push({ id: ++id, ten: 'bang_vi_du.csv', mime: 'text/csv', kich_thuoc: 12, base64: btoa('ten,gio\nA,8\n'), viec_id: v.id, kien_thuc_id: null, tin_id: t, nguon: 'phong' });
}
const tep_ra = (t) => ({ id: t.id, ten: t.ten, mime: t.mime, kich_thuoc: t.kich_thuoc, nguon: t.nguon || 'anh',
  tin_id: t.tin_id ?? (TIN.find((x) => x.viec_id === t.viec_id && x.nguoi === 'anh')?.id ?? null) });
const tin_ra = ({ id: i, nguoi, hanh_dong, noi_dung, luc }) => ({ id: i, nguoi, hanh_dong, noi_dung, luc });

const H = {
  app_ai_la_chu: () => !Q.has('khong_chu'),
  app_ai_tong_quan: () => { can_chu(); return {
    mac: { lan_cuoi: MAC.lan_cuoi, ket_noi: true, dang_nhap_loi: MAC.dang_nhap_loi },
    cho_anh: VIEC.filter((v) => v.trang_thai === 'cho_anh').sort((a, b) => (a.cap_nhat < b.cap_nhat ? 1 : -1)).map(viec_ngan),
    phong: PHONG.map((p) => ({ ma: p.ma, ten: p.ten, model: p.model, mo: p.mo, trang_thai: trang_thai_phong(p.ma),
      so_viec_mo: VIEC.filter((v) => v.phong === p.ma && v.trang_thai !== 'xong').length })),
    doanh_thu: { ngay: new Date(Date.now() - 864e5).toISOString().slice(0, 10), co_so: DOANH_THU.map(([ma, net]) => ({ ma, net })) } }; },
  app_ai_phong: ({ p_ma }) => { can_chu(); const p = PHONG.find((x) => x.ma === p_ma) || loi('Không có phòng này'); return {
    phong: { ...p }, viec: VIEC.filter((v) => v.phong === p_ma).sort((a, b) => (a.cap_nhat < b.cap_nhat ? 1 : -1)).map(viec_ngan),
    kien_thuc: KT.filter((k) => k.phong === p_ma).sort(sap_kt).map(kt_ra),
    kien_thuc_chung: p_ma === 'gd' ? KT.filter((k) => k.phong === null).sort(sap_kt).map(kt_ra) : [] }; },
  app_ai_kien_thuc_chung: () => { can_chu(); return KT.filter((k) => k.phong === null).sort(sap_kt).map(kt_ra); },
  app_ai_viec: ({ p_id }) => { can_chu(); const v = lay_viec(p_id); mac_xong_neu_den(v); return {
    viec: { ...viec_ngan(v), noi_dung: v.noi_dung, ket_qua: v.ket_qua, ly_do_ket: v.ly_do_ket, cho_ca_cong_ty: v.cho_ca_cong_ty, tao_luc: v.tao_luc, bat_dau: v.bat_dau || null },
    mac: { lan_cuoi: Q.has('mac_tat') ? truoc(1) : now(), dang_nhap_loi: false },
    tin: TIN.filter((t) => t.viec_id === v.id).map(tin_ra),
    tep: TEP.filter((t) => t.viec_id === v.id).map(tep_ra) }; },
  app_ai_viec_moi: ({ p_id, p_sau_tin }) => { can_chu(); const v = lay_viec(p_id); mac_xong_neu_den(v); const sau = p_sau_tin || 0; return {
    viec: { trang_thai: v.trang_thai, bat_dau: v.bat_dau || null, ly_do_ket: v.ly_do_ket, ket_qua: v.ket_qua, cap_nhat: v.cap_nhat, loai: v.loai, noi_dung: v.noi_dung },
    mac: { lan_cuoi: Q.has('mac_tat') ? truoc(1) : now(), dang_nhap_loi: false },
    tin: TIN.filter((t) => t.viec_id === v.id && t.id > sau).map(tin_ra),
    tep: TEP.filter((t) => t.viec_id === v.id).map(tep_ra).filter((t) => t.tin_id > sau) }; },
  app_ai_lich_su: ({ p_loc }) => { can_chu(); const r = [];
    if (['tat_ca', 'da_duyet'].includes(p_loc)) TIN.filter((t) => t.nguoi === 'anh' && ['dong_y', 'tra_loi', 'nap_kien_thuc'].includes(t.hanh_dong))
      .forEach((t) => { const v = lay_viec(t.viec_id); r.push({ luc: t.luc, loai: 'da_duyet', tieu_de: v.tieu_de, phong_ten: ten_phong(v.phong), viec_id: v.id }); });
    if (['tat_ca', 'chua_tra_loi'].includes(p_loc)) VIEC.filter((v) => v.trang_thai === 'cho_anh').forEach((v) => r.push({ luc: v.cap_nhat,
      loai: Date.now() - new Date(v.cap_nhat) > 2 * 864e5 ? 'qua_han' : 'chua_tra_loi', tieu_de: v.tieu_de, phong_ten: ten_phong(v.phong), viec_id: v.id }));
    if (['tat_ca', 'chua_xong'].includes(p_loc)) VIEC.filter((v) => !v.cha_id && v.loai !== 'doc_kien_thuc' && v.trang_thai !== 'xong')
      .forEach((v) => r.push({ luc: v.tao_luc, loai: 'chua_xong', tieu_de: v.tieu_de, phong_ten: ten_phong(v.phong), viec_id: v.id }));
    return r.sort((a, b) => (a.luc < b.luc ? 1 : -1)).slice(0, 100); },
  app_ai_tep: ({ p_id }) => { can_chu(); const t = TEP.find((x) => x.id === p_id) || loi('Không có tệp này'); return { ten: t.ten, mime: t.mime, base64: t.base64 }; },
  app_ai_tai_tep: ({ p_ten, p_mime, p_base64 }) => { can_chu();
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv'].includes(p_mime)) loi('Loại tệp này chưa nhận');
    const n = Math.floor((p_base64 || '').length * 3 / 4);
    if (n > 5242880) loi('Tệp quá 5 MB');
    const t = { id: ++id, ten: p_ten, mime: p_mime, kich_thuoc: n, base64: p_base64, viec_id: null, kien_thuc_id: null };
    TEP.push(t); log.tep.push({ ten: p_ten, mime: p_mime, kich_thuoc: n, base64: p_base64 }); return t.id; },
  app_ai_tao_viec: ({ p_dich, p_noi_dung, p_tep = [] }) => { can_chu();
    const nd = (p_noi_dung || '').trim(); if (!nd && !p_tep.length) loi('Anh nói, gõ hoặc kèm tệp trước đã');
    if (p_tep.length > 6) loi('Tối đa 6 tệp mỗi lần');
    const v = them_viec({ phong: p_dich, loai: p_dich === 'gd' ? 'de_xuat_giao' : p_dich === 'tk' ? 'ghi_chep' : 'viec', tieu_de: tieu_de(nd, p_tep), noi_dung: nd });
    TEP.filter((t) => p_tep.includes(t.id) && !t.viec_id).forEach((t) => (t.viec_id = v.id));
    tin(v.id, 'anh', nd || '(Anh gửi kèm tệp)', 'giao'); mac_lam(v); return v.id; },
  app_ai_tra_loi: ({ p_viec, p_noi_dung, p_tep = [] }) => { can_chu(); const nd = (p_noi_dung || '').trim();
    if (!nd && !p_tep.length) loi('Anh nói hoặc gõ vài chữ trước đã'); if (p_tep.length > 6) loi('Tối đa 6 tệp mỗi lần');
    const v = lay_viec(p_viec); const t = tin(v.id, 'anh', nd || '(Anh gửi kèm tệp)', 'tra_loi');
    TEP.filter((x) => p_tep.includes(x.id) && !x.viec_id).forEach((x) => { x.viec_id = v.id; x.tin_id = t; });
    if (v.trang_thai === 'dang_lam') { sua(v, {}); return t; }   // phòng đọc sau lượt này
    sua(v, { trang_thai: 'cho_lam', ly_do_ket: null, noi_dung: v.loai === 'doc_kien_thuc' && nd ? nd : v.noi_dung }); mac_lam(v); return t; },
  app_ai_dong_y: ({ p_viec }) => { can_chu(); const v = lay_viec(p_viec); if (v.trang_thai !== 'cho_anh') loi('Việc này đã xử lý');
    if (v.loai === 'de_xuat_giao') (v.ket_qua?.giao || []).forEach((g) => { const c = them_viec({ phong: g.phong, tieu_de: g.tieu_de, noi_dung: g.noi_dung, cha_id: v.id });
      tin(c.id, 'he_thong', 'Giám đốc giao, anh đã đồng ý: ' + g.noi_dung); mac_lam(c); });
    if (v.loai === 'doc_kien_thuc') {
      const ph = v.cho_ca_cong_ty ? null : v.phong;
      if (v.noi_dung) KT.push({ id: ++id, phong: ph, loai: 'da_chot', noi_dung: v.noi_dung, trang_thai: 'dang_dung', tao_luc: now() });
      TEP.filter((t) => t.viec_id === v.id).forEach((t) => { const k = { id: ++id, phong: ph, loai: 'tai_lieu', noi_dung: t.ten, trang_thai: 'dang_dung', tao_luc: now() }; KT.push(k); t.kien_thuc_id = k.id; });
    }
    sua(v, { trang_thai: 'xong', xong_luc: now() }); tin(v.id, 'anh', 'Đồng ý', 'dong_y'); log.goi.push(['dong_y', v.id]); },
  app_ai_dong_viec: ({ p_viec }) => { can_chu(); const v = lay_viec(p_viec); if (v.trang_thai === 'dang_lam') loi('Phòng đang làm, chờ xong rồi đóng');
    if (v.trang_thai === 'xong') loi('Việc này đã xử lý'); sua(v, { trang_thai: 'xong', xong_luc: now() }); tin(v.id, 'anh', 'Anh đóng việc này', 'dong_viec'); },
  app_ai_gui_kien_thuc: ({ p_phong, p_noi_dung, p_tep = [] }) => { can_chu(); const nd = (p_noi_dung || '').trim();
    if (!nd && !p_tep.length) loi('Anh nói, gõ hoặc kèm tệp trước đã'); if (p_tep.length > 6) loi('Tối đa 6 tệp mỗi lần');
    const v = them_viec({ phong: p_phong || 'gd', loai: 'doc_kien_thuc', tieu_de: 'Nạp kiến thức: ' + tieu_de(nd, p_tep).slice(0, 60), noi_dung: nd, cho_ca_cong_ty: !p_phong });
    TEP.filter((t) => p_tep.includes(t.id) && !t.viec_id).forEach((t) => (t.viec_id = v.id));
    tin(v.id, 'anh', nd || '(Anh gửi kèm tệp)', 'nap_kien_thuc'); mac_lam(v); return v.id; },
  app_ai_bo_kien_thuc: ({ p_id, p_bo }) => { can_chu(); const k = KT.find((x) => x.id === p_id) || loi('Không có kiến thức này'); k.trang_thai = p_bo ? 'da_bo' : 'dang_dung'; },
  app_ai_doi_model: ({ p_ma, p_model }) => { can_chu(); if (!['manh', 'can_bang', 'nhanh'].includes(p_model)) loi('Model không hợp lệ');
    (PHONG.find((p) => p.ma === p_ma) || loi('Không có phòng này')).model = p_model; },
  app_ai_dang_ky_thong_bao: () => { can_chu(); },
};

export async function rpc(ten, args = {}) {
  await new Promise((r) => setTimeout(r, 30));
  log.goi.push([ten]);
  (window.__dem_rpc ||= {})[ten] = (window.__dem_rpc[ten] || 0) + 1;
  const f = H[ten] || loi('Không có hàm ' + ten);
  return structuredClone(f(args) ?? null);
}
let da_dn = !Q.has('chua_dang_nhap');
export async function da_dang_nhap() { return da_dn; }
export async function dang_nhap(ma, mk) {
  await new Promise((r) => setTimeout(r, 30));
  if (mk !== 'dung') throw new Error('Mã nhân viên hoặc mật khẩu không đúng.');
  da_dn = true;
}
