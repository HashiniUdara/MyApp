import { createContext, useContext } from 'react';
import { useCategoryStore } from './useCategoryStore';

const CategoryContext = createContext(null);

export function CategoryProvider({ userId, children }) {
  const store = useCategoryStore(userId);
  return <CategoryContext.Provider value={store}>{children}</CategoryContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error('useCategories must be used inside <CategoryProvider>');
  return ctx;
}
