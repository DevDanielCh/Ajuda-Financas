export interface BreakdownRow {
  name: string;
  total: number;
  /** Cor da categoria, quando aplicável (breakdown por categoria). */
  color?: string;
}

export interface DashboardData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  prev_balance: number;
  meta_investimento: number;
  aportes: number;
  income_by_cat: BreakdownRow[];
  expenses_by_pm: BreakdownRow[];
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  reserva: number;
}

export interface ChartData {
  monthly: MonthlyPoint[];
  expenses_by_cat: BreakdownRow[];
  expenses_by_pm: BreakdownRow[];
}

/** Agregado de um dia do calendário (data civil da transação). */
export interface CalendarDay {
  date: string;
  income: number;
  expenses: number;
}

/** Agregado de um mês do calendário (soma dos dias). */
export interface CalendarMonth {
  month: string;
  income: number;
  expenses: number;
}

export interface CalendarYear {
  year: number;
  days: CalendarDay[];
  months: CalendarMonth[];
}

export interface CalendarBounds {
  min_year: number;
  max_year: number;
}

export interface Settings {
  primeiro_mes: string | null;
  saldo_inicial_conta: number;
  saldo_inicial_reserva: number;
  meta_investimento: number;
}

export interface SettingsInput {
  primeiro_mes: string | null;
  saldo_inicial_conta: number;
  saldo_inicial_reserva: number;
  meta_investimento: number;
}

export interface Sort {
  id: string;
  desc: boolean;
}
