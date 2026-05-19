"use client";

import { DatePicker, Segmented } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { useTranslations } from "next-intl";

const { RangePicker } = DatePicker;

export type FilterMode = "all" | "year" | "month" | "week" | "custom";

export interface DateRange {
  from: string | null;
  to: string | null;
}

interface Props {
  onChange: (range: DateRange) => void;
}

function computeRange(mode: FilterMode, date: Dayjs, custom: [Dayjs, Dayjs] | null): DateRange {
  if (mode === "all") return { from: null, to: null };
  if (mode === "year") return { from: date.startOf("year").toISOString(), to: date.endOf("year").toISOString() };
  if (mode === "month") return { from: date.startOf("month").toISOString(), to: date.endOf("month").toISOString() };
  if (mode === "week") return { from: date.startOf("week").toISOString(), to: date.endOf("week").toISOString() };
  if (mode === "custom" && custom) return { from: custom[0].startOf("day").toISOString(), to: custom[1].endOf("day").toISOString() };
  return { from: null, to: null };
}

export function DateRangeFilter({ onChange }: Props) {
  const t = useTranslations("reports");
  const [mode, setMode] = useState<FilterMode>("all");
  const [pickerDate, setPickerDate] = useState<Dayjs>(dayjs());
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);

  function update(newMode: FilterMode, newDate: Dayjs, newCustom: [Dayjs, Dayjs] | null) {
    onChange(computeRange(newMode, newDate, newCustom));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented
        size="small"
        value={mode}
        onChange={(v) => {
          const m = v as FilterMode;
          setMode(m);
          update(m, pickerDate, customRange);
        }}
        options={[
          { label: t("filter.periodAll"), value: "all" },
          { label: t("filter.periodYear"), value: "year" },
          { label: t("filter.periodMonth"), value: "month" },
          { label: t("filter.periodWeek"), value: "week" },
          { label: t("filter.periodCustom"), value: "custom" },
        ]}
      />
      {mode === "year" && (
        <DatePicker picker="year" size="small" value={pickerDate} allowClear={false}
          onChange={(d) => { if (d) { setPickerDate(d); update("year", d, customRange); } }} />
      )}
      {mode === "month" && (
        <DatePicker picker="month" size="small" value={pickerDate} allowClear={false}
          onChange={(d) => { if (d) { setPickerDate(d); update("month", d, customRange); } }} />
      )}
      {mode === "week" && (
        <DatePicker picker="week" size="small" value={pickerDate} allowClear={false}
          onChange={(d) => { if (d) { setPickerDate(d); update("week", d, customRange); } }} />
      )}
      {mode === "custom" && (
        <RangePicker size="small" value={customRange}
          onChange={(dates) => {
            const r = dates && dates[0] && dates[1] ? [dates[0], dates[1]] as [Dayjs, Dayjs] : null;
            setCustomRange(r);
            update("custom", pickerDate, r);
          }} />
      )}
    </div>
  );
}
