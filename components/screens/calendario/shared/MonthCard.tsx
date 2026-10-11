"use client";
import { Fragment, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CalendarDay, CalendarMonth } from "@/src/shared/models";

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export interface MonthCardProps {
  year: number;
  monthIndex: number;
  month: CalendarMonth;
  dayMap: Map<string, CalendarDay>;
  today: string;
  /** Desktop: envolve o dia num Tooltip. */
  wrapDay?: (trigger: ReactElement, day: CalendarDay) => ReactNode;
  /** Desktop: envolve o nome do mês num Tooltip. */
  wrapMonthName?: (trigger: ReactElement, month: CalendarMonth, monthIndex: number) => ReactNode;
  /** Mobile: toque no dia abre o sheet. */
  onDayClick?: (day: CalendarDay) => void;
  onMonthClick?: (month: CalendarMonth, monthIndex: number) => void;
}

export function MonthCard({
  year, monthIndex, month, dayMap, today,
  wrapDay, wrapMonthName, onDayClick, onMonthClick,
}: MonthCardProps) {
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const offset = new Date(year, monthIndex, 1).getDay();
  const empty = month.income === 0 && month.expenses === 0;
  const monthSobra = month.income - month.expenses;

  const nameButton = (
    <button
      type="button"
      onClick={() => onMonthClick?.(month, monthIndex)}
      className={cn(
        "cursor-pointer rounded-md text-base font-semibold outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring",
        empty && "text-muted-foreground"
      )}
    >
      {MONTH_NAMES[monthIndex]}
    </button>
  );

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3 shadow-[var(--shadow-md),0_4px_0_-1px_rgba(0,0,0,0.14)]",
        empty && "opacity-50",
        monthSobra < 0 && "border-negative/50",
        monthSobra > 0 && "border-positive/50"
      )}
    >
      <div className="mb-1.5 grid grid-cols-3 items-center px-1">
        <span className="text-xs text-muted-foreground tabular-nums">{mm}</span>
        <div className="justify-self-center">
          {wrapMonthName ? wrapMonthName(nameButton, month, monthIndex) : nameButton}
        </div>
        <span className="justify-self-end text-xs text-muted-foreground tabular-nums">{year}</span>
      </div>

      <div aria-hidden className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w, i) => (
          <span
            key={i}
            className="flex h-5 items-center justify-center text-[10px] font-medium text-muted-foreground"
          >
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: offset }, (_, i) => (
          <span key={`off-${i}`} aria-hidden />
        ))}
        {Array.from({ length: dayCount }, (_, i) => {
          const num = i + 1;
          const date = `${year}-${mm}-${String(num).padStart(2, "0")}`;
          const day = dayMap.get(date) ?? { date, income: 0, expenses: 0 };
          const isToday = date === today;
          const hasMovement = day.income !== 0 || day.expenses !== 0;
          const sobra = day.income - day.expenses;
          const btn = (
            <button
              type="button"
              onClick={onDayClick ? () => onDayClick(day) : undefined}
              className={cn(
                "relative flex h-8 cursor-pointer items-center justify-center rounded-md text-xs tabular-nums outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring sm:text-sm",
                isToday && "bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              )}
            >
              {num}
              {hasMovement && (
                <span
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    sobra < 0
                      ? "bg-negative"
                      : sobra > 0
                        ? "bg-positive"
                        : isToday
                          ? "bg-primary-foreground/80"
                          : "bg-primary/60"
                  )}
                />
              )}
            </button>
          );
          return (
            <Fragment key={date}>
              {wrapDay ? wrapDay(btn, day) : btn}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
