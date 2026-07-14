export const STORAGE_KEYS = {
  session: 'myapp_session',
};

export const COLORS = {
  dark: {
    background: '#091D3C',
    surface: '#215B80',
    surfaceAlt: '#17496A',
    primary: '#2DA49E',
    secondary: '#E7A6CA',
    accent: '#ECC657',
    success: '#446949',
    textPrimary: '#FEFEFE',
  },
  light: {
    background: '#FEFEFE',
    surface: '#FDF0CD',
    surfaceAlt: '#D8EDF2',
    primary: '#9BC0AA',
    secondary: '#F6CDBC',
    accent: '#CFCFF9',
    success: '#446949',
    textPrimary: '#091D3C',
  },
};

export const TODO_CATEGORY_COLORS = [
  '#2DA49E',
  '#2d7dae',
  '#E7A6CA',
  '#ECC657',
  '#446949',
  '#9BC0AA',
];

export const TODO_CATEGORY_ICONS = [
  'pricetag-outline',
  'briefcase-outline',
  'person-outline',
  'heart-outline',
  'cart-outline',
  'ellipsis-horizontal-circle-outline',
];

export const BOTTOM_TABS = [
  { id: 'today', labelKey: 'today', icon: 'sunny-outline' },
  { id: 'todos', labelKey: 'todos', icon: 'checkmark-circle-outline' },
  { id: 'day', labelKey: 'finance', icon: 'cash-outline' },
  { id: 'habits', labelKey: 'habits', icon: 'flame-outline' },
  { id: 'more', labelKey: 'more', icon: 'grid-outline' },
];

export const MORE_MENU_ITEMS = [
  { id: 'calendar', labelKey: 'financeCalendar', icon: 'calendar-outline' },
  { id: 'graph', labelKey: 'financeGraph', icon: 'stats-chart-outline' },
  { id: 'budget', labelKey: 'budget', icon: 'wallet-outline' },
  { id: 'savings', labelKey: 'savings', icon: 'trophy-outline' },
  { id: 'calculator', labelKey: 'calculator', icon: 'calculator-outline' },
  { id: 'notes', labelKey: 'notes', icon: 'document-text-outline' },
  { id: 'reminders', labelKey: 'reminders', icon: 'notifications-outline' },
  { id: 'profile', labelKey: 'profile', icon: 'person-circle-outline' },
  { id: 'settings', labelKey: 'settings', icon: 'settings-outline' },
];

export const SELF_SCROLLING_TABS = [
  'day',
  'calendar',
  'habits',
  'budget',
  'savings',
  'settings',
  'reminders',
  'graph',
];
