import { createContext, useContext } from 'react';
import { useHabitStore } from './useHabitStore';

const HabitContext = createContext(null);

export function HabitProvider({ userId, children }) {
  const store = useHabitStore(userId);
  return <HabitContext.Provider value={store}>{children}</HabitContext.Provider>;
}

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used inside <HabitProvider>');
  return ctx;
}
