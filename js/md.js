// Hiển thị markdown của tin nhắn thành HTML AN TOÀN: thoát mọi ký tự trước, chỉ sinh đúng các thẻ trong danh sách.
// Nội dung phòng trả lời có thể chép từ tệp lạ → không bao giờ để lọt thẻ / thuộc tính / liên kết javascript.
// Hỗ trợ: đoạn, xuống dòng, # tiêu đề, **đậm**, *nghiêng*, - danh sách, 1. danh sách số, bảng |..|, ``` mã ```, `mã`, ---,
// [chữ](https://…) và nhãn dấu giao thức ở dòng đầu (✅ XONG / ✅ CẦN DUYỆT / ❓ HỎI ANH / ⛔ KẸT).

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const NHAN = [['⛔ KẸT', 'ket', 'Kẹt'], ['❓ HỎI ANH', 'hoi', 'Hỏi anh'], ['✅ CẦN DUYỆT', 'duyet', 'Cần duyệt'], ['✅ XONG', 'xong', 'Xong']];
const sach = (d) => d.replace(/️/g, '').trim().replace(/^[#>\s]+/, '').trim().replace(/^[*_]+|[*_]+$/g, '').trim();

// ---- trong dòng (đầu vào CHƯA thoát)
function trong_dong(s) {
  const ma = [];
  // tách `mã` ra trước để không bị định dạng bên trong
  let t = String(s).replace(/\u0000/g, '').replace(/`([^`\n]+)`/g, (_, m) => { ma.push(m); return `\u0000${ma.length - 1}\u0000`; });
  t = esc(t);
  t = t.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_, chu, url) => (
    /^https:\/\/[^\s"'<>]+$/.test(url) ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${chu}</a>` : chu));
  t = t.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?!\*)/g, '$1<em>$2</em>');
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(ma[Number(i)])}</code>`);
}

const la_bang = (d) => /^\s*\|.*\|\s*$/.test(d);
const la_ke_bang = (d) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(d);
const o_bang = (d) => d.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((x) => trong_dong(x.trim()));
const RE_UL = /^\s*[-*•]\s+(.*)$/;
const RE_OL = /^\s*\d+[.)]\s+(.*)$/;
const RE_HR = /^\s*([-*_])(\s*\1){2,}\s*$/;

export function md_html(chu) {
  if (!chu) return '';
  const dong = String(chu).replace(/\r\n?/g, '\n').split('\n');
  const ra = [];
  // nhãn dấu giao thức ở dòng có chữ đầu tiên
  const dau = dong.findIndex((d) => d.trim());
  let nhan_html = '';
  if (dau >= 0) {
    const s = sach(dong[dau]);
    const n = NHAN.find(([k]) => s.startsWith(k));
    if (n) {
      nhan_html = `<span class="nhan nhan-${n[1]}">${n[2]}</span>`;
      dong[dau] = s.slice(n[0].length).replace(/^[\s:—\-*]+/, '');
      if (!dong[dau].trim()) { ra.push(`<p>${nhan_html}</p>`); nhan_html = ''; dong.splice(dau, 1); }
    }
  }
  let doan = [];
  const dong_doan = () => {
    if (doan.length) ra.push(`<p>${nhan_html}${nhan_html ? ' ' : ''}${doan.map(trong_dong).join('<br>')}</p>`);
    if (doan.length) nhan_html = '';
    doan = [];
  };
  for (let i = 0; i < dong.length; i++) {
    const d = dong[i];
    if (/^\s*```/.test(d)) {
      dong_doan();
      const ma = [];
      for (i++; i < dong.length && !/^\s*```/.test(dong[i]); i++) ma.push(dong[i]);
      ra.push(`<pre><code>${esc(ma.join('\n'))}</code></pre>`);
      continue;
    }
    if (!d.trim()) { dong_doan(); continue; }
    const h = d.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) { dong_doan(); ra.push(h[1].length === 1 ? `<h3>${trong_dong(h[2])}</h3>` : `<h4>${trong_dong(h[2])}</h4>`); continue; }
    if (la_bang(d) && i + 1 < dong.length && la_ke_bang(dong[i + 1])) {
      dong_doan();
      const dau_cot = o_bang(d);
      const hang = [];
      for (i += 2; i < dong.length && la_bang(dong[i]); i++) hang.push(o_bang(dong[i]));
      i--;
      ra.push(`<div class="bang-cuon"><table><thead><tr>${dau_cot.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`
        + `<tbody>${hang.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (RE_HR.test(d)) { dong_doan(); ra.push('<hr>'); continue; }
    for (const [re, the] of [[RE_UL, 'ul'], [RE_OL, 'ol']]) {
      if (re.test(d)) {
        dong_doan();
        const muc = [];
        for (; i < dong.length && re.test(dong[i]); i++) muc.push(`<li>${trong_dong(dong[i].match(re)[1])}</li>`);
        i--;
        ra.push(`<${the}>${muc.join('')}</${the}>`);
        break;
      }
    }
    if (RE_UL.test(d) || RE_OL.test(d)) continue;
    doan.push(d);
  }
  dong_doan();
  if (nhan_html) ra.unshift(`<p>${nhan_html}</p>`);
  return ra.join('');
}
