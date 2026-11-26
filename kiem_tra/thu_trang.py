"""Bài thử trang Công ty AI (chế độ dữ liệu giả ?gia=1), khung máy tính 1280×800 và điện thoại 390×844.

Chạy: <venv có playwright>/bin/python kiem_tra/thu_trang.py <thư mục trang>
In ĐẠT / LỖI từng mục; mã thoát 1 nếu có LỖI. Dùng Chrome có sẵn (channel='chrome').
"""
import functools
import http.server
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

GOC = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
LOI = []


def kiem(dk, ten):
    print(("ĐẠT " if dk else "LỖI ") + ten, flush=True)
    if not dk:
        LOI.append(ten)


def may_chu():
    class Im(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    h = functools.partial(Im, directory=str(GOC))
    s = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s


def khong_tran(pg):
    return pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")


def thu_xem(pg, url, khung):
    pg.goto(url + "?gia=1#trang-dau")
    pg.wait_for_selector(".dept")
    kiem(pg.locator(".dept").count() == 7, f"{khung}: trang đầu có 7 ô phòng")
    kiem(pg.locator("text=Chờ anh").count() >= 1, f"{khung}: có mục Chờ anh")
    kiem(pg.locator(".mic").count() == 1, f"{khung}: có nút nói ý mới")
    kiem(pg.locator("header .pill").inner_text().strip() != "", f"{khung}: đầu trang có trạng thái máy Mac")
    kiem(khong_tran(pg), f"{khung}: trang đầu không tràn ngang")
    pg.goto(url + "?gia=1#phong-kt")
    pg.wait_for_selector(".lock")
    kiem("Soát tiền ca" in pg.locator(".lock").inner_text(), f"{khung}: phòng Kế toán có dòng khoá soát tiền ca")
    kiem(pg.locator(".seg button").count() == 3, f"{khung}: phòng có 3 nút chọn model")
    kiem(pg.locator(".tabs button").count() == 4, f"{khung}: phòng có 4 ô việc")
    kiem(khong_tran(pg), f"{khung}: trang phòng không tràn ngang")
    pg.goto(url + "?gia=1#so-lieu")
    pg.wait_for_selector(".store")
    txt = pg.locator("#app").inner_text()
    kiem("Web riêng" in txt, f"{khung}: số liệu có LLB Web riêng")
    kiem("Chưa có (Fabi chưa đồng bộ)" in txt, f"{khung}: số liệu có cơ sở Chưa có (Fabi chưa đồng bộ)")
    kiem(khong_tran(pg), f"{khung}: số liệu không tràn ngang")
    pg.goto(url + "?gia=1#lich-su")
    pg.wait_for_selector(".chips")
    pg.click("[data-loc='chua_tra_loi']")
    pg.wait_for_timeout(200)
    nhan = [t.strip() for t in pg.locator("#app .tag").all_inner_texts()]
    kiem(nhan and all(n in ("Chưa trả lời", "Quá hạn") for n in nhan), f"{khung}: lọc Chưa trả lời chỉ còn Chưa trả lời / Quá hạn ({nhan})")
    pg.goto(url + "?gia=1&khong_chu=1#trang-dau")
    pg.wait_for_timeout(500)
    kiem("Trang này chỉ dành cho Chủ" in pg.locator("body").inner_text() and pg.locator(".dept").count() == 0,
         f"{khung}: tài khoản không phải Chủ chỉ thấy thông báo")


def _png(w, h):
    import struct, zlib
    hang = b"\x00" + b"\x0b\x6b\x5c" * w
    du_lieu = zlib.compress(hang * h, 9)
    def khoi(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return b"\x89PNG\r\n\x1a\n" + khoi(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + khoi(b"IDAT", du_lieu) + khoi(b"IEND", b"")


def _so_cho_anh(pg):
    return int(pg.locator("section .sec-h h2").first.inner_text().split("(")[1].split(")")[0])


TIEU_DE = {"trang-dau": "Công ty AI", "phong-rd": "R&D", "phong-kho": "Kho", "phong-ns": "Nhân sự & Đào tạo", "phong-web": "Kỹ sư web", "phong-kt": "Kế toán"}


def di(pg, url, h):
    pg.goto(url + "?gia=1#" + h)
    pg.wait_for_function("(t) => document.querySelector('header.top h1') && document.querySelector('header.top h1').innerText === t", arg=TIEU_DE[h], timeout=5000)


def thu_them_hanh_dong(pg, url, khung):
    di(pg, url, "trang-dau")
    pg.wait_for_selector(".dept")
    truoc = _so_cho_anh(pg)
    pg.click(".mic")
    pg.fill("#noi-dung", "Thử trà vải ở LL, nhớ tính giá vốn")
    kiem(khong_tran(pg), f"{khung}: mở bảng nói ý không tràn ngang")
    pg.click("[data-act='gui'][data-dich='gd']")
    pg.wait_for_function(f"document.querySelector('section .sec-h h2').innerText.includes('({truoc + 1})')", timeout=3000)
    kiem(_so_cho_anh(pg) == truoc + 1, f"{khung}: Gửi Giám đốc → Chờ anh tăng 1")
    # mở đề xuất, bấm Đồng ý hai lần nhanh
    di(pg, url, "phong-rd")
    pg.wait_for_selector(".tabs")
    so_rd = pg.evaluate("document.querySelectorAll('.tabs b')[1].innerText*1 + document.querySelectorAll('.tabs b')[2].innerText*1")
    di(pg, url, "trang-dau")
    pg.wait_for_selector(".wait .row")
    pg.locator(".wait .row", has_text="Thử trà vải").first.click()
    pg.wait_for_selector(".assign")
    kiem(pg.locator(".assign").count() == 2, f"{khung}: đề xuất hiện 2 việc giao")
    pg.evaluate("() => { const b = document.querySelector('[data-act=dong-y]'); b.click(); b.click(); }")
    pg.wait_for_timeout(400)
    di(pg, url, "phong-rd")
    pg.wait_for_selector(".tabs")
    sau_rd = pg.evaluate("document.querySelectorAll('.tabs b')[1].innerText*1 + document.querySelectorAll('.tabs b')[2].innerText*1")
    kiem(sau_rd == so_rd + 1, f"{khung}: Đồng ý (bấm 2 lần) tạo đúng 1 việc cho R&D ({so_rd}→{sau_rd})")
    # việc đang làm: màn chat mở, ô nhắn VẪN mở (từ khung chat mới: phòng đọc sau lượt này)
    pg.click("[data-tab='dang_lam']")
    pg.wait_for_timeout(150)
    pg.locator(".list .row").first.click()
    pg.wait_for_selector("#chat .dang-lam")
    kiem(not pg.locator("#go-chu").is_disabled() and "đang làm" in pg.locator("#chat").inner_text(), f"{khung}: việc đang làm: chat hiện đang làm, ô nhắn vẫn mở")
    # đổi model Kho
    di(pg, url, "phong-kho")
    pg.wait_for_selector(".seg")
    pg.click("[data-model='nhanh']")
    pg.wait_for_function("document.querySelector(\"[data-model='nhanh']\").getAttribute('aria-checked') === 'true'", timeout=3000)
    kiem(pg.locator("[data-model='nhanh']").get_attribute("aria-checked") == "true", f"{khung}: đổi model Kho sang Nhanh, tiết kiệm")
    # nạp kiến thức cho Nhân sự kèm ảnh lớn
    di(pg, url, "phong-ns")
    pg.wait_for_selector("[data-act='nap-kien-thuc']")
    pg.locator("[data-act='nap-kien-thuc']").first.click()
    pg.fill("#noi-dung", "Sữa tươi mở hộp dùng trong 24 giờ")
    pg.set_input_files("#tep", files=[{"name": "anh.png", "mimeType": "image/png", "buffer": _png(3000, 3000)}])
    pg.wait_for_timeout(200)
    pg.click("[data-act='gui-kien-thuc']")
    pg.wait_for_function("window.__gia.tep.length > 0", timeout=8000)
    tep = pg.evaluate("window.__gia.tep.at(-1)")
    kich = pg.evaluate("""(b64) => new Promise(r => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.src = 'data:image/jpeg;base64,' + b64; })""", tep["base64"])
    kiem(tep["mime"] == "image/jpeg" and max(kich) <= 1600, f"{khung}: ảnh 3000×3000 được thu nhỏ thành JPEG ({tep['mime']}, {kich})")
    pg.wait_for_timeout(300)
    # bỏ rồi dùng lại một kiến thức
    di(pg, url, "phong-ns")
    pg.wait_for_selector("[data-act='mo-kien-thuc']")
    dong = pg.locator("[data-act='mo-kien-thuc']").first
    id_kt = dong.get_attribute("data-id")
    dong.click()
    pg.click("[data-act='bo-kt']")
    pg.wait_for_timeout(300)
    kiem("bo" in (pg.locator(f"[data-act='mo-kien-thuc'][data-id='{id_kt}']").get_attribute("class") or ""), f"{khung}: bỏ kiến thức → gạch ngang")
    pg.locator(f"[data-act='mo-kien-thuc'][data-id='{id_kt}']").click()
    pg.click("[data-act='bo-kt']")
    pg.wait_for_timeout(300)
    kiem("bo" not in (pg.locator(f"[data-act='mo-kien-thuc'][data-id='{id_kt}']").get_attribute("class") or ""), f"{khung}: dùng lại kiến thức → hết gạch")
    # tệp PDF 6 MB bị từ chối
    di(pg, url, "trang-dau")
    pg.wait_for_selector(".mic")
    pg.click(".mic")
    pg.set_input_files("#tep", files=[{"name": "to.pdf", "mimeType": "application/pdf", "buffer": b"%PDF" + b"0" * 6_000_000}])
    pg.fill("#noi-dung", "kèm tệp to")
    pg.click("[data-act='gui'][data-dich='gd']")
    pg.wait_for_selector(".toast")
    kiem("Tệp quá 5 MB" in pg.locator(".toast").inner_text(), f"{khung}: tệp PDF 6 MB bị từ chối")
    pg.keyboard.press("Escape")
    # đóng việc chờ anh
    di(pg, url, "trang-dau")
    pg.wait_for_selector(".wait .row")
    truoc = _so_cho_anh(pg)
    pg.locator(".wait .row").first.click()
    pg.wait_for_selector("#chat [data-act='dong-viec']")
    pg.click("[data-act='dong-viec']")
    pg.wait_for_timeout(400)
    di(pg, url, "trang-dau")
    pg.wait_for_selector(".dept")
    kiem(_so_cho_anh(pg) == truoc - 1, f"{khung}: Đóng việc → Chờ anh giảm 1")


def _mo_viec(pg, url, phong, tab, tieu_de):
    di(pg, url, phong)
    pg.wait_for_selector(".tabs")
    pg.click(f"[data-tab='{tab}']")
    pg.wait_for_timeout(150)
    pg.locator(".list .row", has_text=tieu_de).first.click()
    pg.wait_for_selector("#chat .tin, #chat .tin-he")


def thu_them_chat(pg, url, khung):
    dt = khung == "điện thoại"
    # mở từ Trang đầu bằng cách bấm một việc
    di(pg, url, "trang-dau")
    pg.locator(".wait .row").first.click()
    pg.wait_for_selector("#chat")
    kiem(pg.evaluate("location.hash").startswith("#viec-"), f"{khung}: bấm việc ở Trang đầu → màn chat #viec-<id>")
    kiem(pg.locator("#nav a").count() == 0, f"{khung}: màn chat ẩn thanh dưới")
    # việc đang làm của Kỹ sư web: nhắn lúc đang làm, rồi phòng giả tự trả lời
    _mo_viec(pg, url, "phong-web", "dang_lam", "Chốt ca")
    kiem("đang làm…" in pg.locator("#chat").inner_text(), f"{khung}: hiện dòng đang làm")
    pg.fill("#go-chu", "À thêm ô ký tên nữa")
    pg.click("#chat-go .gui")
    pg.wait_for_selector("#chat .xep-hang", timeout=5000)
    kiem("Phòng sẽ đọc sau lượt này" in pg.locator("#chat .xep-hang").last.inner_text(), f"{khung}: nhắn lúc đang làm có nhãn Phòng sẽ đọc sau lượt này")
    pg.wait_for_selector("#chat .nhan-duyet", timeout=14000)
    kiem(True, f"{khung}: phòng trả lời tự hiện (không tải lại trang)")
    md = pg.locator("#chat .tin-phong .md").last
    kiem(md.locator("strong").count() > 0 and md.locator("li").count() >= 2 and "**" not in md.inner_text(), f"{khung}: tin phòng hiện chữ đậm + gạch đầu dòng, không còn **")
    kiem(pg.locator("#chat .tin-tep", has_text="bang_vi_du.csv").count() == 1, f"{khung}: tệp phòng gửi hiện trong tin")
    kiem(khong_tran(pg), f"{khung}: chat có bảng 8 cột không tràn ngang")
    if dt:
        kiem(pg.evaluate("(() => { const b = document.querySelector('#chat .bang-cuon'); return b.scrollWidth > b.clientWidth; })()"), f"{khung}: bảng rộng cuộn ngang trong tin")
        o = pg.locator("#chat-go").bounding_box()
        kiem(o["y"] + o["height"] <= pg.evaluate("visualViewport.height") + 1, f"{khung}: ô gõ nằm trong màn hình")
    kiem(pg.locator("#chat-nut [data-act='dong-y']").count() == 1 and pg.locator("#chat-nut [data-act='dong-viec']").count() == 1, f"{khung}: Chờ anh có Đồng ý + Đóng việc")
    # gửi tin kèm tệp
    pg.set_input_files("#go-tep", files=[{"name": "bang.csv", "mimeType": "text/csv", "buffer": b"a,b\n1,2\n"}])
    kiem(pg.locator("#chon-ds .chon-tep", has_text="bang.csv").count() == 1, f"{khung}: tệp đã chọn hiện thẻ trước khi gửi")
    pg.fill("#go-chu", "Gửi em bảng này")
    pg.click("#chat-go .gui")
    pg.wait_for_function("[...document.querySelectorAll('#chat .tin-anh')].some(e => e.innerText.includes('bang.csv'))", timeout=5000)
    kiem(True, f"{khung}: tin anh gửi kèm tệp hiện bên phải kèm tên tệp")
    # nội dung lạ không chạy
    _mo_viec(pg, url, "phong-kho", "xong", "Thử nội dung lạ")
    kiem(pg.locator("#chat .tin img").count() == 0 and pg.locator("#chat a[href^='javascript']").count() == 0
         and pg.evaluate("window.__doc === undefined"), f"{khung}: nội dung độc hiện thành chữ, không chạy")
    # các nút theo trạng thái
    _mo_viec(pg, url, "phong-kt", "can_anh", "Lãi lỗ tháng 10")
    kiem(pg.locator("#chat-nut [data-act='dong-viec']").count() == 1 and pg.locator("#chat-nut [data-act='dong-y']").count() == 0, f"{khung}: Kẹt có Đóng việc, không có Đồng ý")
    _mo_viec(pg, url, "phong-ns", "can_anh", "sữa mở hộp")
    nut = pg.locator("#chat-nut").inner_text()
    kiem("Đúng, ghi lại" in nut and "Sửa lại" in nut and "Em hiểu là" in pg.locator("#chat").inner_text(), f"{khung}: nạp kiến thức có Em hiểu là + Đúng, ghi lại + Sửa lại")
    # rời chat thì thôi hỏi lại
    pg.click("#chat [data-act='chat-lui']")
    pg.wait_for_function("!location.hash.startsWith('#viec-')", timeout=3000)
    truoc = pg.evaluate("(window.__dem_rpc || {}).app_ai_viec_moi || 0")
    pg.wait_for_timeout(12000)
    sau = pg.evaluate("(window.__dem_rpc || {}).app_ai_viec_moi || 0")
    kiem(sau == truoc, f"{khung}: rời chat (‹) thì thôi hỏi phần mới ({truoc}→{sau})")


def thu_them_thong_bao(pg, url, khung):
    di(pg, url, "trang-dau")
    pg.wait_for_timeout(200)
    co_khoa = "VAPID_PUBLIC = ''" not in (GOC / "js" / "cau_hinh.js").read_text()
    # bài thử gửi-lại-đăng-ký đã giả một thiết bị có đăng ký → có khoá hay không thì cũng không hiện nút
    kiem(pg.locator("#bat-thong-bao button").count() == 0, f"{khung}: thiết bị đã đăng ký / chưa có khoá thì không hiện nút Bật thông báo (có khoá: {co_khoa})")
    goc = url.rsplit("/", 1)[0]
    kq = pg.evaluate("""async (g) => { const m = await fetch(g + '/manifest.webmanifest'); const j = await m.json();
        const s = await fetch(g + '/sw.js'); const i = await fetch(g + '/anh/icon-192.png');
        return [m.ok, j.display, s.ok, i.ok, i.headers.get('content-type')]; }""", goc)
    kiem(kq[0] and kq[1] == "standalone" and kq[2] and kq[3], f"{khung}: có manifest (standalone), sw.js, biểu tượng ({kq})")
    kiem(pg.locator("link[rel='manifest']").count() == 1, f"{khung}: trang khai báo manifest")


def thu_them_dang_nhap(pg, url, khung):
    pg.goto(url + "?gia=1&chua_dang_nhap=1#trang-dau")
    pg.wait_for_selector("#dn-ma")
    pg.fill("#dn-ma", "chu")
    pg.fill("#dn-mk", "sai")
    pg.click("#dn-nut")
    pg.wait_for_selector("#dn-loi:not([hidden])")
    kiem("không đúng" in pg.locator("#dn-loi").inner_text(), f"{khung}: đăng nhập sai báo lỗi")
    pg.fill("#dn-mk", "dung")
    pg.click("#dn-nut")
    pg.wait_for_selector(".dept", timeout=5000)
    kiem(pg.locator(".dept").count() == 7, f"{khung}: đăng nhập ngay trên trang rồi vào được (cho ứng dụng ở màn hình chính iPhone)")


def thu_them_sua_truoc_khi_dung(pg, url, khung):
    di(pg, url, "phong-kho")
    pg.locator("[data-act='nap-kien-thuc']").first.click()
    pg.fill("#noi-dung", "Kiểm kê ngày 30")
    pg.click("[data-act='gui-kien-thuc']")
    pg.wait_for_timeout(300)
    di(pg, url, "trang-dau")
    pg.locator(".wait .row", has_text="Kiểm kê ngày 30").first.click()
    pg.wait_for_selector("#go-chu")
    pg.fill("#go-chu", "Kiểm kê ngày 29")
    pg.click("[data-act='dong-y']")
    pg.wait_for_timeout(400)
    di(pg, url, "phong-kho")
    kt = pg.evaluate("[...document.querySelectorAll('[data-act=mo-kien-thuc] .t')].map(e => e.textContent)")
    kiem("Kiểm kê ngày 30" not in kt, f"{khung}: sửa chữ rồi bấm Đúng không ghi bản cũ ({kt[:3]})")


def thu_them_xem_tep(pg, url, khung):
    di(pg, url, "phong-ns")
    pg.locator("[data-act='nap-kien-thuc']").first.click()
    pg.fill("#noi-dung", "Ảnh công thức")
    pg.set_input_files("#tep", files=[{"name": "ct.png", "mimeType": "image/png", "buffer": _png(40, 30)}])
    pg.click("[data-act='gui-kien-thuc']")
    pg.wait_for_timeout(400)
    di(pg, url, "trang-dau")
    pg.locator(".wait .row", has_text="Ảnh công thức").first.click()
    pg.wait_for_selector("[data-act='xem-tep']")
    pg.click("[data-act='xem-tep']")
    pg.wait_for_selector("#chat img.xem-anh", timeout=3000)
    rong = pg.evaluate("document.querySelector('#chat img.xem-anh').naturalWidth")
    kiem(rong > 0, f"{khung}: xem ảnh kèm hiện ngay trong chat (không tải về)")
    pg.keyboard.press("Escape")


def thu_them_gui_lai_dang_ky(pg, url, khung):
    pg.add_init_script("""
      const sub = { toJSON: () => ({ endpoint: 'https://push.example/x', keys: { p256dh: 'k', auth: 'a' } }) };
      const reg = { pushManager: { getSubscription: async () => sub } };
      Object.defineProperty(navigator, 'serviceWorker', { value: { register: async () => reg, getRegistration: async () => reg, ready: Promise.resolve(reg) } });
      window.PushManager = window.PushManager || function () {};
    """)
    di(pg, url, "trang-dau")
    pg.wait_for_timeout(500)
    goi = pg.evaluate("window.__gia.goi.map(g => g[0])")
    kiem("app_ai_dang_ky_thong_bao" in goi, f"{khung}: thiết bị đã đăng ký thì gửi lại đăng ký (phòng lần trước gửi lỗi)")


def main():
    s = may_chu()
    url = f"http://127.0.0.1:{s.server_address[1]}/index.html"
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        for khung, vp in (("máy tính", {"width": 1280, "height": 800}), ("điện thoại", {"width": 390, "height": 844})):
            pg = b.new_page(viewport=vp)
            loi_trang = []
            pg.on("pageerror", lambda e: loi_trang.append(str(e)))
            pg.on("console", lambda m: loi_trang.append(m.text) if m.type == "error" else None)
            thu_xem(pg, url, khung)
            for ten in [n for n in dir(sys.modules[__name__]) if n.startswith("thu_them_")]:
                getattr(sys.modules[__name__], ten)(pg, url, khung)
            kiem(not loi_trang, f"{khung}: không lỗi Console ({loi_trang[:3]})")
            pg.close()
        b.close()
    s.shutdown()
    print("KẾT QUẢ:", "ĐẠT" if not LOI else f"LỖI {len(LOI)} mục")
    sys.exit(1 if LOI else 0)


if __name__ == "__main__":
    main()
