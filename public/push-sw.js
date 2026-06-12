self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "TRYANGLE FREELANCE";
  const options = {
    body: data.body || "新着通知があります。",
    tag: data.tag || "tryangle-freelance",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    (async () => {
      const clientsList = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = clientsList.find((client) => "focus" in client);
      if (existing) {
        await existing.focus();
        return;
      }
      await clients.openWindow(url);
    })(),
  );
});
