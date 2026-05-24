"use client";

import React from "react";

/* ─── Spinner ─────────────────────────────────────────── */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <div className="w-8 h-8 rounded-full border-[3px] border-indigo-100 dark:border-slate-700 border-t-indigo-500 dark:border-t-indigo-400 animate-spin" />
    </div>
  );
}

/* ─── Badge ───────────────────────────────────────────── */
const BADGE_CLS: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  green:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  red:     "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
  orange:  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  purple:  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  default: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export function Badge({
  color = "default",
  children,
  className = "",
}: {
  color?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${BADGE_CLS[color] ?? BADGE_CLS.default} ${className}`}
    >
      {children}
    </span>
  );
}

/* ─── Segmented Tabs ──────────────────────────────────── */
export interface TabItem {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
}

export function Tabs({
  items,
  activeKey,
  onChange,
}: {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <div>
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-4">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeKey === item.key
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.find((i) => i.key === activeKey)?.children}
    </div>
  );
}

/* ─── Select ──────────────────────────────────────────── */
export function Select({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 cursor-pointer transition"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

/* ─── SearchInput ─────────────────────────────────────── */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition"
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ─── EmptyState ──────────────────────────────────────── */
export function EmptyState({ description }: { description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-slate-300 dark:text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0H4" />
        </svg>
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-500">{description}</p>
    </div>
  );
}
