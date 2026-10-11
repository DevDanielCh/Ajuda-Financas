"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarYear } from "@/src/shared/models";
import { MonthCard, type MonthCardProps } from "./MonthCard";
import { YearSelector } from "./YearSelector";

export interface CalendarViewProps {
  year: number;
  minYear: number;
  maxYear: number;
  onYearChange: (year: number) => void;
  data: CalendarYear | undefined;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}

export interface CalendarViewHandlers {
  wrapDay?: MonthCardProps["wrapDay"];
  wrapMonthName?: MonthCardProps["wrapMonthName"];
  onDayClick?: MonthCardProps["onDayClick"];
  onMonthClick?: MonthCardProps["onMonthClick"];
}

export function CalendarYearView({
  year, minYear, maxYear, onYearChange, data, isLoading, hasError, onRetry,
  gridClassName, ...handlers
}: CalendarViewProps &
  CalendarViewHandlers & { gridClassName?: string }) {
  const today = todayISO();
  const dayMap = new Map((data?.days ?? []).map((d) => [d.date, d]));

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Fallback só na faixa 640–767px: abaixo a bottom nav tem o seletor,
          acima a sidebar mostra o dele. Largura igual à sidebar (w-60). */}
      <div className="hidden justify-center sm:flex md:hidden">
        <div className="w-60">
          <YearSelector year={year} minYear={minYear} maxYear={maxYear} onYearChange={onYearChange} />
        </div>
      </div>

      {hasError ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">Erro ao carregar o calendário.</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar de novo
          </Button>
        </div>
      ) : !data && isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : data ? (
        <div className={cn("grid gap-3", gridClassName)}>
          {Array.from({ length: 12 }, (_, i) => (
            <MonthCard
              key={i}
              year={year}
              monthIndex={i}
              month={data.months[i] ?? { month: `${year}-${String(i + 1).padStart(2, "0")}`, income: 0, expenses: 0 }}
              dayMap={dayMap}
              today={today}
              {...handlers}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
