// Service worker chỉ để nhận thông báo (không lưu bộ nhớ đệm: trang luôn mới).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { noi_dung: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.tieu_de || 'Công ty AI', {
    body: d.noi_dung || '', icon: 'anh/icon-192.png', badge: 'anh/icon-192.png', data: { url: d.url || '#trang-dau' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const dich = new URL('./index.html' + (e.notification.data?.url || ''), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ds) => {
    const c = ds.find((x) => x.url.startsWith(self.registration.scope));
    return c ? c.navigate(dich).then((w) => (w || c).focus()) : self.clients.openWindow(dich);
  }));
});
