"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PeriodStats } from "./PeriodStats";

export interface StatsSheetState {
  title: string;
  income: number;
  expenses: number;
}

export function StatsSheet({
  state,
  onOpenChange,
}: {
  state: StatsSheetState | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!state} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="gap-0">
        <SheetHeader className="pr-10">
          <SheetTitle>{state?.title}</SheetTitle>
        </SheetHeader>
        {state && (
          <div className="px-4 pb-4">
            <PeriodStats income={state.income} expenses={state.expenses} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
