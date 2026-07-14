import { createContext, useContext } from 'react';
import { useTodoStore } from './useTodoStore';

const TodoContext = createContext(null);

export function TodoProvider({ userId, children }) {
  const store = useTodoStore(userId);
  return <TodoContext.Provider value={store}>{children}</TodoContext.Provider>;
}

export function useTodos() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodos must be used inside <TodoProvider>');
  return ctx;
}
