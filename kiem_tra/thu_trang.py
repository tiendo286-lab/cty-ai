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
