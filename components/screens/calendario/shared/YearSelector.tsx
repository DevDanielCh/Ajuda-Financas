"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface YearSelectorProps {
  year: number;
  minYear: number;
  maxYear: number;
  onYearChange: (year: number) => void;
  className?: string;
}

/** Mesmo layout do filtro de mês: seta na borda esquerda, valor centralizado
 *  na pílula outline (idêntica ao MonthPicker compact), seta na borda direita. */
export function YearSelector({
  year, minYear, maxYear, onYearChange, className,
}: YearSelectorProps) {
  return (
    <div className={cn("flex w-full items-center justify-between", className)}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Ano anterior"
        disabled={year <= minYear}
        onClick={() => onYearChange(year - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span
        className={cn(
          buttonVariants({ variant: "outline" }),
          "cursor-default tabular-nums font-normal"
        )}
      >
        {year}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Próximo ano"
        disabled={year >= maxYear}
        onClick={() => onYearChange(year + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
