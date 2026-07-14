import { createContext, useContext } from 'react';
import { useReminderStore } from './useReminderStore';

const ReminderContext = createContext(null);

export function ReminderProvider({ userId, children }) {
  const store = useReminderStore(userId);
  return <ReminderContext.Provider value={store}>{children}</ReminderContext.Provider>;
}

export function useReminders() {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error('useReminders must be used inside <ReminderProvider>');
  return ctx;
}
