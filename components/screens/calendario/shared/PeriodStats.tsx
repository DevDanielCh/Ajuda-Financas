"use client";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RowProps {
  label: string;
  value: string;
  labelClass: string;
  valueClass: string;
  strong?: boolean;
}

function Row({ label, value, labelClass, valueClass, strong }: RowProps) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className={cn("text-xs", strong && "font-semibold", labelClass)}>{label}</span>
      <span className={cn("text-xs tabular-nums", strong ? "font-semibold" : "font-medium", valueClass)}>
        {value}
      </span>
    </div>
  );
}

interface PeriodStatsProps {
  income: number;
  expenses: number;
  /** "dark" = fundo invertido (tooltip). */
  tone?: "light" | "dark";
  className?: string;
}

export function PeriodStats({ income, expenses, tone = "light", className }: PeriodStatsProps) {
  const sobra = income - expenses;
  const dark = tone === "dark";
  const pos = dark ? "text-emerald-400" : "text-positive";
  const neg = dark ? "text-red-400" : "text-negative";
  const labelClass = dark ? "text-background/70" : "text-muted-foreground";
  return (
    <div className={cn("flex min-w-40 flex-col gap-1", className)}>
      <Row label="Receitas" value={formatMoney(income)} labelClass={labelClass} valueClass={pos} />
      <Row label="Despesas" value={formatMoney(expenses)} labelClass={labelClass} valueClass={neg} />
      <Row
        label="Sobra"
        value={formatMoney(sobra)}
        labelClass={labelClass}
        valueClass={sobra > 0 ? pos : sobra < 0 ? neg : dark ? "text-background/70" : "text-muted-foreground"}
        strong
      />
    </div>
  );
}
