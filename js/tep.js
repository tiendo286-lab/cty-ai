// Chuẩn bị tệp trước khi gửi: ảnh thu nhỏ (cạnh dài ≤ 1600 px, JPEG 0.8); tệp khác ≤ 5 MB, đúng loại cho phép.
import { rpc } from './api.js';
import { toast } from './ui.js';

const TOI_DA = 5 * 1024 * 1024;
const CHO = {
  pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xls: 'application/vnd.ms-excel',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', csv: 'text/csv',
};
const doc_base64 = (blob) => new Promise((ok, loi) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1] || '');
  r.onerror = () => loi(new Error('Không đọc được tệp'));
  r.readAsDataURL(blob);
});
async function mo_anh(file) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(file); } catch { /* thử cách khác */ }
  }
  return new Promise((ok, loi) => {
    const i = new Image(); const u = URL.createObjectURL(file);
    i.onload = () => { URL.revokeObjectURL(u); ok(i); };
    i.onerror = () => { URL.revokeObjectURL(u); loi(new Error('Không mở được ảnh này — anh chụp lại hoặc gửi ảnh JPG')); };
    i.src = u;
  });
}

export async function chuan_bi_tep(file) {
  const duoi = (file.name.split('.').pop() || '').toLowerCase();
  const la_anh = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(duoi);
  if (la_anh) {
    const a = await mo_anh(file);
    const w = a.naturalWidth || a.width, h = a.naturalHeight || a.height;
    const k = Math.min(1, 1600 / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    c.getContext('2d').drawImage(a, 0, 0, c.width, c.height);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.8));
    if (!blob) throw new Error('Không thu nhỏ được ảnh');
    if (blob.size > TOI_DA) throw new Error('Tệp quá 5 MB');
    return { ten: file.name.replace(/\.[^.]+$/, '') + '.jpg', mime: 'image/jpeg', base64: await doc_base64(blob) };
  }
  const mime = Object.values(CHO).includes(file.type) ? file.type : CHO[duoi];
  if (!mime) throw new Error('Loại tệp này chưa nhận');
  if (file.size > TOI_DA) throw new Error('Tệp quá 5 MB');
  return { ten: file.name, mime, base64: await doc_base64(file) };
}

export async function gui_tep(files) {
  const ds = Array.from(files || []);
  if (ds.length > 6) toast('Chỉ lấy 6 tệp đầu');
  const ids = [];
  for (const f of ds.slice(0, 6)) {
    const t = await chuan_bi_tep(f);
    ids.push(await rpc('app_ai_tai_tep', { p_ten: t.ten, p_mime: t.mime, p_base64: t.base64 }));
  }
  return ids;
}
