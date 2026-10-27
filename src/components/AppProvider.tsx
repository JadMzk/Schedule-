"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAppData } from "@/hooks/useAppData";

type AppContextValue = ReturnType<typeof useAppData>;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const value = useAppData();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
