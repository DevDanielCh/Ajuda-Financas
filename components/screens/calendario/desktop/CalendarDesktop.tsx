"use client";
import type { ReactElement } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format";
import type { CalendarDay, CalendarMonth } from "@/src/shared/models";
import { MONTH_NAMES } from "../shared/MonthCard";
import { PeriodStats } from "../shared/PeriodStats";
import { CalendarYearView, type CalendarViewProps } from "../shared/CalendarYearView";

function DayTooltip({ day, children }: { day: CalendarDay; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="top" className="flex flex-col items-stretch gap-1">
        <span className="font-semibold">{formatDate(day.date)}</span>
        <PeriodStats tone="dark" income={day.income} expenses={day.expenses} />
      </TooltipContent>
    </Tooltip>
  );
}

function MonthTooltip({
  month, monthIndex, children,
}: {
  month: CalendarMonth;
  monthIndex: number;
  children: ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="bottom" className="flex flex-col items-stretch gap-1">
        <span className="font-semibold">{`${MONTH_NAMES[monthIndex]} de ${month.month.slice(0, 4)}`}</span>
        <PeriodStats tone="dark" income={month.income} expenses={month.expenses} />
      </TooltipContent>
    </Tooltip>
  );
}

export function CalendarDesktop(props: CalendarViewProps) {
  return (
    <TooltipProvider delay={150}>
      <CalendarYearView
        {...props}
        gridClassName="sm:grid-cols-2 md:grid-cols-4"
        wrapDay={(trigger, day) => (
          <DayTooltip day={day}>{trigger}</DayTooltip>
        )}
        wrapMonthName={(trigger, month, monthIndex) => (
          <MonthTooltip month={month} monthIndex={monthIndex}>
            {trigger}
          </MonthTooltip>
        )}
      />
    </TooltipProvider>
  );
}
