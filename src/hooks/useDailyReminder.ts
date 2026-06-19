import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  scheduleDailyReminder,
  cancelDailyReminder,
  isDailyReminderScheduled,
} from '@/services/notifications';

const HOUR_KEY = 'reminder_hour';
const DEFAULT_HOUR = 19;

/**
 * Manages the optional daily "time to read" reminder. The chosen hour is
 * persisted locally; the schedule itself lives in the OS notification queue.
 */
export function useDailyReminder() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(DEFAULT_HOUR);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedHour = await AsyncStorage.getItem(HOUR_KEY);
      if (storedHour != null) setHour(parseInt(storedHour, 10));
      setEnabled(await isDailyReminderScheduled());
      setLoading(false);
    })();
  }, []);

  const enable = useCallback(async (atHour: number) => {
    const ok = await scheduleDailyReminder(atHour, 0);
    if (ok) {
      setEnabled(true);
      setHour(atHour);
      await AsyncStorage.setItem(HOUR_KEY, String(atHour));
    }
    return ok;
  }, []);

  const disable = useCallback(async () => {
    await cancelDailyReminder();
    setEnabled(false);
  }, []);

  return { enabled, hour, loading, enable, disable };
}
