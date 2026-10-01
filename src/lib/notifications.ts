import { loadSetup } from "./onboarding";

const KEY = "kih:notification-preferences:v1";

export type NotificationPreferences = {
  enabled: boolean;
  studyReminders: boolean;
  dueReviewReminders: boolean;
  countdownMilestones: boolean;
  specialJaceMessages: boolean;
  restDaySuppression: boolean;
  preferredTime: string;
  specialTime: string;
  quietStart: string;
  quietEnd: string;
  maxDailyNotifications: number;
  timezone: string;
};

export type NotificationHistoryItem = {
  id: string;
  event_key: string;
  title: string;
  body: string;
  status: string;
  sent_at: string | null;
  local_date: string;
};

export function defaultNotificationPreferences(): NotificationPreferences {
  const setup = loadSetup();
  return {
    enabled: setup.reminderEnabled ?? true,
    studyReminders: true,
    dueReviewReminders: true,
    countdownMilestones: true,
    specialJaceMessages: true,
    restDaySuppression: true,
    preferredTime: setup.reminderTime || "19:00",
    specialTime: "08:00",
    quietStart: "22:00",
    quietEnd: "07:00",
    maxDailyNotifications: 1,
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila" : "Asia/Manila",
  };
}

export function loadNotificationPreferences() {
  if (typeof window === "undefined") return defaultNotificationPreferences();
  try { return { ...defaultNotificationPreferences(), ...JSON.parse(localStorage.getItem(KEY) || "{}") } as NotificationPreferences; }
  catch { return defaultNotificationPreferences(); }
}

export function saveNotificationPreferences(value: NotificationPreferences) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(value));
}

export function notificationSupport() {
  if (typeof window === "undefined") return { supported: false, permission: "default" as NotificationPermission };
  return {
    supported: "Notification" in window && "serviceWorker" in navigator && "PushManager" in window,
    permission: "Notification" in window ? Notification.permission : "default" as NotificationPermission,
  };
}

export function specialCountdownLabel(days: number | null) {
  if (days === 30) return "30-day CELE message";
  if (days === 14) return "2-week CELE message";
  if (days === 7) return "1-week CELE message";
  if (days === 1) return "night-before CELE message";
  if (days === 0) return "CELE Day 1 message";
  if (days === -1) return "CELE Day 2 message";
  if (days === -2) return "post-CELE message";
  return null;
}
