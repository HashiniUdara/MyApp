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

const NOTIF_MESSAGES = {
  transactions: { title: 'Log your transactions', body: "Don't forget to record today's expenses!" },
  todos:        { title: 'Review your todos',      body: 'Check off what you completed today.' },
  habits:       { title: 'Track your habits',     body: 'Keep your streak going, log your habits!' },
};

const storageKey = (userId, id) => `reminder-notification:${userId}:${id}`;

async function prepareNotifications() {
  if (!isNative || !Notifications) return 'unavailable';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status;
}

async function scheduleDaily(type, hour, minute) {
  if (!isNative || !Notifications) return null;
  const msg = NOTIF_MESSAGES[type] ?? { title: 'Reminder', body: '' };
  return Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      sound: 'default',
      data: { reminderType: type },
    },
    trigger: Platform.OS === 'android'
      ? { channelId: 'daily-reminders', hour, minute, repeats: true }
      : { hour, minute, repeats: true },
  });
}

async function cancelStoredNotif(userId, id) {
  if (!isNative || !Notifications) return;
  const key = storageKey(userId, id);
  const notifId = await AsyncStorage.getItem(key);
  if (notifId) {
    try { await Notifications.cancelScheduledNotificationAsync(notifId); } catch (_) {}
    await AsyncStorage.removeItem(key);
  }
}

export function useReminderStore(userId) {
  const [reminders,        setReminders]        = useState([]);
  const [permissionStatus, setPermissionStatus] = useState(isNative ? null : 'unavailable');
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    if (isNative && Notifications) {
      Notifications.getPermissionsAsync().then(({ status }) => setPermissionStatus(status)).catch(() => {});
    }
    if (!userId) { setLoading(false); return; }
    fetchReminders(userId)
      .then(async (data) => {
        const loaded = data ?? [];
        setReminders(loaded);

        // Re-create local schedules when the app opens. This fixes cases where
        // the DB says a reminder is enabled but the mobile device has no active
        // local notification scheduled.
        if (isNative && Notifications) {
          for (const r of loaded.filter(item => item.enabled)) {
            await cancelStoredNotif(userId, r.id);
            const status = await prepareNotifications();
            setPermissionStatus(status);
            if (status === 'granted') {
              const notifId = await scheduleDaily(r.id, r.hour, r.minute);
              if (notifId) await AsyncStorage.setItem(storageKey(userId, r.id), notifId);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const setReminder = useCallback(async (id, changes) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    const merged = { ...reminder, ...changes };

    try {
      await cancelStoredNotif(userId, id);
      let newStatus = permissionStatus;
      let newNotifId = null;

      if (merged.enabled && isNative) {
        newStatus = await prepareNotifications();
        setPermissionStatus(newStatus);
        if (newStatus === 'granted') {
          newNotifId = await scheduleDaily(id, merged.hour, merged.minute);
          if (newNotifId) await AsyncStorage.setItem(storageKey(userId, id), newNotifId);
        }
      }

      await saveReminder(userId, id, { enabled: merged.enabled, hour: merged.hour, minute: merged.minute });
      setReminders(prev => prev.map(r => r.id === id ? { ...merged, notifId: newNotifId } : r));
    } catch (e) {
      console.error('Reminder save failed:', e.message);
    }
  }, [reminders, userId, permissionStatus]);

  const getReminder = useCallback((id) => reminders.find(r => r.id === id), [reminders]);

  return { reminders, setReminder, getReminder, permissionStatus, loading };
}
