/* Yianni's — notification display only; no fetch interception, no cache.
   Keeping it this small means it can't break the site if it misbehaves. */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? JSON.parse(event.data.text()) : {};
  } catch {}
  const title = data.title || "Yianni's";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag || "yiannis",
      icon: "/images/medallion-192.png",
      badge: "/images/medallion-192.png",
      data: { url: data.url || "/" },
      vibrate: data.urgent ? [220, 120, 220, 120, 350] : [120, 60, 120],
      timestamp: Date.now(),
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(new URL(url, self.location.origin).href);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
