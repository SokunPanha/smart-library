import { createContext, useContext, createElement, type FC, type ReactNode } from "react";

/**
 * Factory that creates a typed Context + Provider + consumer hook from any hook function.
 * Keeps provider logic out of components — UI stays pure.
 *
 * Usage:
 *   export const [MyProvider, useMyContext] = makeContext(() => {
 *     return { table: useTable(), createForm: useModalForm() };
 *   });
 */
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
