// 푸시 알림 서비스 워커

self.addEventListener("push", (event) => {
  console.log("[sw] push 수신:", event.data?.text());
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || "다애교회";
  const options = {
    body: data.body || "새 알림이 있습니다",
    icon: "/icon.png",
    badge: "/icon.png",
    tag: data.tag || "default",
    data: { url: data.url || "/notifications" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/notifications";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        return clients.openWindow(url);
      })
  );
});
