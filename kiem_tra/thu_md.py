"""Bài thử bộ hiển thị markdown an toàn (js/md.js) — chạy trong Chrome thật bằng Playwright (máy không có node).

Chạy: <venv có playwright>/bin/python kiem_tra/thu_md.py <thư mục trang>
In ĐẠT / LỖI từng mục; mã thoát 1 nếu có LỖI.
"""
import functools
import http.server
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

GOC = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
LOI = []

CA = [
    # (tên, đầu vào, phải có [..], không được có [..])
    ("xuống dòng giữ lại", "dòng 1\ndòng 2", ["dòng 1<br>dòng 2"], []),
    ("hai đoạn", "đoạn 1\n\nđoạn 2", ["<p>đoạn 1</p>", "<p>đoạn 2</p>"], []),
    ("chữ đậm", "a **đậm** b", ["<strong>đậm</strong>"], ["**"]),
    ("chữ nghiêng", "a *nghiêng* b", ["<em>nghiêng</em>"], []),
    ("tiêu đề", "# Lớn\n## Vừa", ["<h3>Lớn</h3>", "<h4>Vừa</h4>"], ["#"]),
    ("gạch đầu dòng", "- a\n- b", ["<ul><li>a</li><li>b</li></ul>"], []),
    ("danh sách số", "1. a\n2. b", ["<ol><li>a</li><li>b</li></ol>"], []),
    ("bảng", "| Trang | Thay đổi |\n|---|---|\n| Chốt ca | Thêm ô |",
     ['<div class="bang-cuon"><table>', "<th>Trang</th>", "<td>Chốt ca</td>"], ["|---"]),
    ("khối mã", "```\nselect 1\n```", ["<pre><code>select 1</code></pre>"], ["```"]),
    ("mã trong dòng", "chạy `doc-so` nhé", ["<code>doc-so</code>"], []),
    ("đường kẻ", "a\n\n---\n\nb", ["<hr>"], []),
    ("nhãn cần duyệt", "✅ CẦN DUYỆT\nPhiếu xong", ['<span class="nhan nhan-duyet">Cần duyệt</span>', "Phiếu xong"], ["CẦN DUYỆT"]),
    ("nhãn kẹt có biến thể", "⛔️ KẸT: thiếu tệp", ['<span class="nhan nhan-ket">Kẹt</span>', "thiếu tệp"], []),
    ("nhãn in đậm", "**✅ XONG**\nĐã làm", ['<span class="nhan nhan-xong">Xong</span>'], ["**"]),
    ("độc: img onerror", '<img src=x onerror="alert(1)">', ["&lt;img"], ["<img"]),
    ("độc: liên kết javascript", "[bấm](javascript:alert(1))", ["bấm"], ['href="javascript', "<a "]),
    ("độc: script trong bảng", "| a |\n|---|\n| <script>alert(1)</script> |", ["&lt;script&gt;"], ["<script"]),
    ("độc: thuộc tính trong chữ đậm", '**x" onmouseover="alert(1)**', ["<strong>"], ['onmouseover="', "onmouseover=&quot;alert(1)&quot;>"]),
    ("liên kết https an toàn", "[web](https://a.vn/x)", ['href="https://a.vn/x"', 'rel="noopener noreferrer"', 'target="_blank"'], []),
    ("liên kết http thường không thành link", "[web](http://a.vn)", ["web"], ["<a "]),
    ("rỗng", "", [], ["<"]),
]


def may_chu():
    class Im(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    s = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Im, directory=str(GOC)))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s


def main():
    s = may_chu()
    url = f"http://127.0.0.1:{s.server_address[1]}/"
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        pg = b.new_page()
        pg.goto(url + "manifest.webmanifest")
        for ten, dau_vao, co, khong in CA:
            try:
                ra = pg.evaluate("async (s) => (await import('/js/md.js')).md_html(s)", dau_vao)
            except Exception as e:
                print(f"LỖI {ten}: {e}")
                LOI.append(ten)
                continue
            thieu = [x for x in co if x not in ra]
            thua = [x for x in khong if x in ra]
            if ten == "rỗng" and ra != "":
                thua.append(repr(ra))
            ok = not thieu and not thua
            print(("ĐẠT " if ok else "LỖI ") + ten + ("" if ok else f" — thiếu {thieu} thừa {thua} | ra: {ra[:200]}"))
            if not ok:
                LOI.append(ten)
        b.close()
    s.shutdown()
    print(f"\n{len(CA) - len(LOI)}/{len(CA)} ĐẠT")
    sys.exit(1 if LOI else 0)


if __name__ == "__main__":
    main()
