import { useState, useEffect, useRef, useCallback } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Returns a ref and a maxHeight for a custom scrollable list container.
 * The container fills to the bottom of the viewport minus pagination + spacing,
 * so the pagination is always in view without page-level scroll.
 *
 * @param extraBottom  Additional px to subtract below the container.
 */
export function useListScroll(extraBottom = 60) {
  const ref = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(400);

  const measure = useCallback(() => {
    if (!ref.current) return;
    const top = ref.current.getBoundingClientRect().top;
    setMaxHeight(Math.max(200, window.innerHeight - top - extraBottom));
  }, [extraBottom]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  return { ref, maxHeight };
}

/**
 * Returns a ref to attach above a Table and a scrollY value to pass to
 * Table scroll={{ y: scrollY }}. The table body fills exactly to the bottom
 * of the viewport, keeping pagination always in view.
 *
 * @param extraBottom  Additional px to subtract (e.g. for bottom padding inside a card).
 */
export function useTableScroll(extraBottom = 24) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(400);

  const measure = useCallback(() => {
    if (!ref.current) return;
    const top = ref.current.getBoundingClientRect().top;
    // thead ~39px + antd pagination row ~56px + extraBottom
    const overhead = 39 + 56 + extraBottom;
    setScrollY(Math.max(160, window.innerHeight - top - overhead));
  }, [extraBottom]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  return { ref, scrollY };
}
