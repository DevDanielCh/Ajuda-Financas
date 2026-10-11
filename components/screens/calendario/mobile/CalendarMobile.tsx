"use client";
import { useState } from "react";
import { formatDate } from "@/lib/format";
import type { CalendarMonth } from "@/src/shared/models";
import { MONTH_NAMES } from "../shared/MonthCard";
import { StatsSheet, type StatsSheetState } from "../shared/StatsSheet";
import { CalendarYearView, type CalendarViewProps } from "../shared/CalendarYearView";

export function CalendarMobile(props: CalendarViewProps) {
  const [sel, setSel] = useState<StatsSheetState | null>(null);

  const openMonth = (month: CalendarMonth, monthIndex: number) => {
    setSel({
      title: `${MONTH_NAMES[monthIndex]} de ${month.month.slice(0, 4)}`,
      income: month.income,
      expenses: month.expenses,
    });
  };

  return (
    <>
      <CalendarYearView
        {...props}
        gridClassName="grid-cols-1"
        onDayClick={(day) =>
          setSel({ title: formatDate(day.date), income: day.income, expenses: day.expenses })
        }
        onMonthClick={openMonth}
      />
      <StatsSheet state={sel} onOpenChange={(open) => { if (!open) setSel(null); }} />
    </>
  );
}
