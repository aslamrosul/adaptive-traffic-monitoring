export async function requestBrowserNotificationPermission() {
  if (typeof window === "undefined") return false;

  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function showBrowserNotification(options: {
  title: string;
  body: string;
  url?: string;
}) {
  if (typeof window === "undefined") return;

  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") return;

  const notification = new Notification(options.title, {
    body: options.body,
    icon: "/logo.png",
    badge: "/logo.png",
  });

  notification.onclick = () => {
    window.focus();

    if (options.url) {
      window.location.href = options.url;
    }

    notification.close();
  };
}