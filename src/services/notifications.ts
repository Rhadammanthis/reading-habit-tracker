import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Local-notification helpers. Two use cases:
 *  - goal reached: a one-shot notification fired when a session timer ends
 *    (scheduled at the goal time so it lands even if the app is backgrounded).
 *  - daily reminder: a repeating notification nudging the user to read.
 *
 * No remote/push infrastructure is involved — everything is scheduled on-device.
 */

// Show notifications while the app is foregrounded too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DAILY_REMINDER_ID = 'daily-reading-reminder';

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reading', {
      name: 'Reading reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Ask for notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function hasNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  return settings.granted;
}

/**
 * Schedule the "you hit your goal" notification at `fireDate`. Returns the
 * scheduled id so it can be cancelled if the user stops early.
 */
export async function scheduleGoalNotification(args: {
  fireDate: Date;
  bookTitle: string;
}): Promise<string | null> {
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const seconds = Math.max(1, Math.round((args.fireDate.getTime() - Date.now()) / 1000));
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily goal reached 🎉',
      body: `Nice work — you hit today's reading goal for “${args.bookTitle}”.`,
      ...(Platform.OS === 'android' ? { channelId: 'reading' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

export async function cancelNotification(id: string | null | undefined): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // already fired or cancelled — ignore.
  }
}

/** Fire an immediate confirmation (used when the timer ends in-app). */
export async function notifyGoalReachedNow(bookTitle: string): Promise<void> {
  const granted = await hasNotificationPermission();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily goal reached 🎉',
      body: `Nice work — you hit today's reading goal for “${bookTitle}”.`,
      ...(Platform.OS === 'android' ? { channelId: 'reading' } : {}),
    },
    trigger: null,
  });
}

/** Schedule (or reschedule) a daily reminder at the given local time. */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;
  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'Time to read',
      body: 'A few minutes today keeps your book moving. Open the app to start a session.',
      ...(Platform.OS === 'android' ? { channelId: 'reading' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  await cancelNotification(DAILY_REMINDER_ID);
}

export async function isDailyReminderScheduled(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((n) => n.identifier === DAILY_REMINDER_ID);
}
