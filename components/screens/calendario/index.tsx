"use client";
import { PlatformView } from "@/components/PlatformView";
import { useCalendarYearFilter } from "@/lib/calendar-context";
import { useCalendarYear } from "@/src/shared/services";
import { CalendarDesktop } from "./desktop/CalendarDesktop";
import { CalendarMobile } from "./mobile/CalendarMobile";

export function CalendarScreen() {
  const { year, minYear, maxYear, setYear } = useCalendarYearFilter();
  const query = useCalendarYear(year);

  const props = {
    year,
    minYear,
    maxYear,
    onYearChange: setYear,
    data: query.data,
    isLoading: query.isLoading,
    hasError: !!query.error,
    onRetry: () => void query.refetch(),
  };

  return (
    <PlatformView
      mobile={<CalendarMobile {...props} />}
      desktop={<CalendarDesktop {...props} />}
    />
  );
}
