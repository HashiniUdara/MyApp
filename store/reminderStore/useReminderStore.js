import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchReminders, saveReminder } from '../reminderApi';

const isNative = Platform.OS !== 'web';
let Notifications = null;
if (isNative) {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ── Notification content per reminder type ────────────────────────

const NOTIF_MESSAGES = {
  transactions: { title: 'Log your transactions', body: "Don't forget to record today's expenses!" },
  todos:        { title: 'Review your todos',      body: 'Check off what you completed today.' },
  habits:       { title: 'Track your habits',      body: 'Keep your streak going, log your habits!' },
};

// ── AsyncStorage key for storing a scheduled notification ID ─────

const storageKey = (userId, id) => `reminder-notification:${userId}:${id}`;

// ── Android notification channel (create once) ────────────────────

async function ensureChannel() {
  if (Platform.OS !== 'android' || !Notifications) return;
  await Notifications.setNotificationChannelAsync('daily-reminders', {
    name: 'Daily Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

// ── Permission request (called once per session, not per reminder) ─

async function requestPermission() {
  if (!isNative || !Notifications) return 'unavailable';
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status;
}

async function cancelStoredNotif(userId, id) {
  if (!isNative || !Notifications) return;
  const key = storageKey(userId, id);
  const notifId = await AsyncStorage.getItem(key);
  if (notifId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notifId);
    } catch (_) {
      // Already cancelled or ID was stale — safe to ignore
    }
    await AsyncStorage.removeItem(key);
  }
}

// ── Schedule a single daily notification ─────────────────────────
//
// IMPORTANT: Expo SDK 48 (expo-notifications ~0.18.x) uses an object
// with { hour, minute, repeats: true } for a daily calendar trigger.
// Do NOT pass a "type" field — it is not supported in this SDK version
// and will cause the trigger to be ignored or fire incorrectly.
//
// Also do NOT nest { channelId } inside the trigger on Android for
// calendar triggers — channelId must go in the content block instead.

async function scheduleDaily(reminderId, hour, minute) {
  if (!isNative || !Notifications) return null;

  const msg = NOTIF_MESSAGES[reminderId] ?? { title: 'Reminder', body: '' };

  const content = {
    title: msg.title,
    body:  msg.body,
    sound: 'default',
    data:  { reminderType: reminderId },
    // Android requires channelId in the content, not in the trigger
    ...(Platform.OS === 'android' ? { channelId: 'daily-reminders' } : {}),
  };

  // Calendar trigger: fire once per day at the given hour:minute
  const trigger = {
    hour,
    minute,
    repeats: true,
  };

  return Notifications.scheduleNotificationAsync({ content, trigger });
}

// ── Cancel ALL scheduled notifications (safety net on startup) ───
//
// We cancel everything first, then re-schedule only what is enabled.
// This prevents the "ghost notification" problem where stale IDs in
// AsyncStorage differ from what the OS actually has scheduled.

async function cancelAllAndReschedule(userId, reminders, permStatus) {
  if (!isNative || !Notifications) return;

  // 1. Cancel every notification the OS has scheduled for this app.
  //    This is the safest approach — it guarantees a clean slate.
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 2. Clear all stored IDs so they don't linger
  const keys = reminders.map(r => storageKey(userId, r.id));
  await AsyncStorage.multiRemove(keys);

  // 3. Re-schedule only the enabled ones
  if (permStatus !== 'granted') return;

  for (const r of reminders.filter(item => item.enabled)) {
    const notifId = await scheduleDaily(r.id, r.hour, r.minute);
    if (notifId) {
      await AsyncStorage.setItem(storageKey(userId, r.id), notifId);
    }
  }
}

// ── Hook ──────────────────────────────────────────────────────────

export function useReminderStore(userId) {
  const [reminders,        setReminders]        = useState([]);
  const [permissionStatus, setPermissionStatus] = useState(isNative ? null : 'unavailable');
  const [loading,          setLoading]          = useState(true);

  // On mount: load reminders, get permission status, rebuild schedule
  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    let cancelled = false;

    (async () => {
      try {
        // 1. Get current permission state (no pop-up yet)
        let perm = 'unavailable';
        if (isNative && Notifications) {
          const { status } = await Notifications.getPermissionsAsync();
          perm = status;
        }
        if (!cancelled) setPermissionStatus(perm);

        // 2. Ensure the Android channel exists
        await ensureChannel();

        // 3. Load reminders from API / cache
        const data = await fetchReminders(userId);
        const loaded = data ?? [];
        if (!cancelled) setReminders(loaded);

        // 4. Rebuild the schedule from scratch — fixes any accumulated
        //    duplicates from previous sessions
        if (isNative && Notifications) {
          await cancelAllAndReschedule(userId, loaded, perm);
        }
      } catch (e) {
        console.error('ReminderStore init error:', e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // Called when the user toggles a reminder or changes its time
  const setReminder = useCallback(async (id, changes) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const merged = { ...reminder, ...changes };

    try {
      // 1. Always cancel the existing notification for this reminder first
      await cancelStoredNotif(userId, id);

      let newStatus = permissionStatus;
      let newNotifId = null;

      if (merged.enabled && isNative && Notifications) {
        // 2. Request permission only when the user enables a reminder
        //    (avoids pestering on app startup)
        newStatus = await requestPermission();
        setPermissionStatus(newStatus);
        await ensureChannel();

        if (newStatus === 'granted') {
          // 3. Schedule exactly ONE new notification for this reminder
          newNotifId = await scheduleDaily(id, merged.hour, merged.minute);
          if (newNotifId) {
            await AsyncStorage.setItem(storageKey(userId, id), newNotifId);
          }
        }
      }

      // 4. Persist the new settings to the API / offline cache
      await saveReminder(userId, id, {
        enabled: merged.enabled,
        hour:    merged.hour,
        minute:  merged.minute,
      });

      setReminders(prev =>
        prev.map(r => r.id === id ? { ...merged, notifId: newNotifId } : r),
      );
    } catch (e) {
      console.error('Reminder save failed:', e.message);
    }
  }, [reminders, userId, permissionStatus]);

  const getReminder = useCallback(
    (id) => reminders.find(r => r.id === id),
    [reminders],
  );

  return { reminders, setReminder, getReminder, permissionStatus, loading };
}
