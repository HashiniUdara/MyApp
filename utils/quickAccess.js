import AsyncStorage from '@react-native-async-storage/async-storage';
import { WORDINGS } from '../config/wordings';

export const QUICK_ACCESS_STORAGE_KEY = 'quick_access_items';
export const QUICK_ACCESS_DEFAULTS = ['splitbills', 'notes', 'reminders'];

export const QUICK_ACCESS_OPTIONS = [
  { id: 'calendar', labelKey: 'financeCalendar', icon: 'calendar-outline' },
  { id: 'graph', labelKey: 'financeGraph', icon: 'stats-chart-outline' },
  { id: 'budget', labelKey: 'budget', icon: 'wallet-outline' },
  { id: 'savings', labelKey: 'savings', icon: 'trophy-outline' },
  { id: 'calculator', labelKey: 'calculator', icon: 'calculator-outline' },
  { id: 'notes', labelKey: 'notes', icon: 'document-text-outline' },
  { id: 'reminders', labelKey: 'reminders', icon: 'notifications-outline' },
  { id: 'profile', labelKey: 'profile', icon: 'person-circle-outline' },
  { id: 'settings', labelKey: 'settings', icon: 'settings-outline' },
  { id: 'splitbills', label: 'Split Bills', icon: 'receipt-outline' },
];


export async function getQuickAccessItems() {
  try {
    const raw = await AsyncStorage.getItem(QUICK_ACCESS_STORAGE_KEY);
    if (!raw) return [...QUICK_ACCESS_DEFAULTS];

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3);
    }
  } catch (_) {}

  return [...QUICK_ACCESS_DEFAULTS];
}

export async function saveQuickAccessItems(items) {
  const normalized = Array.isArray(items) ? items.slice(0, 3) : [...QUICK_ACCESS_DEFAULTS];
  await AsyncStorage.setItem(QUICK_ACCESS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getQuickAccessLabel(itemId, wording = WORDINGS) {
  const option = QUICK_ACCESS_OPTIONS.find((entry) => entry.id === itemId);
  if (!option) return itemId;
  if (option.label) return option.label;
  return wording.nav[option.labelKey] ?? option.id;
}

export function getQuickAccessIcon(itemId) {
  const option = QUICK_ACCESS_OPTIONS.find((entry) => entry.id === itemId);
  return option ? option.icon : 'help-circle-outline';
}
