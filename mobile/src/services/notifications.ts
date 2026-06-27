/**
 * expo-notifications-Service: täglicher Streak-Reminder.
 *
 * Hinweis: In Expo Go (SDK 53+) sind Push-Notifications eingeschränkt.
 * Lokale Notifications wie hier funktionieren weiterhin.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import i18n from '@/i18n';
import { STORAGE_KEYS } from '@/store/storage';

// Alle Notifications zeigen, auch wenn die App im Vordergrund ist
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_HOUR = 19;
const REMINDER_MINUTE = 0;

/** Fragt einmalig die Berechtigung an und legt einen Channel (Android) an. */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('streak', {
      name: 'Streak Reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#6366F1',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Plant (oder ersetzt) einen täglichen lokalen Reminder, der den User
 * an seinen Streak erinnert.
 */
export async function scheduleDailyStreakReminder(): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  // Vorherige Einplanung entfernen
  const existingId = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ID);
  if (existingId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    } catch {
      /* still leise weitermachen */
    }
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('notifications.streakTitle'),
      body: i18n.t('notifications.streakBody'),
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
      repeats: true,
      channelId: Platform.OS === 'android' ? 'streak' : undefined,
    },
  });

  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_ID, id);
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'true');
  return id;
}

export async function cancelStreakReminder(): Promise<void> {
  const existingId = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ID);
  if (existingId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    } catch {
      /* ok */
    }
    await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATION_ID);
  }
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'false');
}

export async function isStreakReminderEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
  return value === 'true';
}
