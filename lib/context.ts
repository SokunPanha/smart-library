import { createContext, useContext, createElement, type FC, type ReactNode } from "react";

export function makeContext<T>(
  hookFunc: () => T
): [FC<{ children: ReactNode }>, () => T] {
  const ctx = createContext<T | undefined>(undefined);

  const Provider: FC<{ children: ReactNode }> = ({ children }) => {
    const value = hookFunc();
    return createElement(ctx.Provider, { value }, children);
  };

  const useCtx = (): T => {
    const value = useContext(ctx);
    if (value === undefined) {
      throw new Error("useCtx must be used within its Provider.");
    }
    return value;
  };

  return [Provider, useCtx];
}
