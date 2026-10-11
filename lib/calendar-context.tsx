"use client";
import { createContext, useContext, useState } from "react";
import { todayISO } from "@/lib/format";
import { useCalendarBounds } from "@/src/shared/services";

interface CalendarYearCtx {
  year: number;
  minYear: number;
  maxYear: number;
  setYear: (y: number) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

const Ctx = createContext<CalendarYearCtx>({
  year: new Date().getFullYear(),
  minYear: new Date().getFullYear(),
  maxYear: new Date().getFullYear(),
  setYear: () => {},
});

/** Ano do calendário compartilhado entre a tela, a sidebar e a bottom nav.
 *  Clamp nas bounds acontece no render/handler — nunca em useEffect. */
export function CalendarYearProvider({ children }: { children: React.ReactNode }) {
  const nowYear = Number(todayISO().slice(0, 4));
  const bounds = useCalendarBounds();
  const minYear = bounds.data?.min_year ?? nowYear;
  const maxYear = bounds.data?.max_year ?? nowYear;
  const [raw, setRaw] = useState(nowYear);

  const year = clamp(raw, minYear, maxYear);
  const setYear = (y: number) => setRaw(clamp(y, minYear, maxYear));

  return (
    <Ctx.Provider value={{ year, minYear, maxYear, setYear }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCalendarYearFilter = () => useContext(Ctx);
