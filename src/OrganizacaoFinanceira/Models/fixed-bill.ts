export interface FixedBill {
  id: number;
  description: string;
  amount: number;
  day: number;
  category_id: number | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  payment_method_id: number;
  payment_method_name: string;
  start_month: string;
  end_month: string | null;
  installments: number | null;
  purchase_date: string | null;
  finished: boolean;
  /** Quantas das últimas parcelas foram adiantadas (0 = nenhuma). */
  advanced_installments: number;
  /** Mês destino do adiantamento (YYYY-MM), null se não houve. */
  advanced_to: string | null;
}

export interface FixedBillInput {
  description: string;
  amount: number;
  day: number;
  category_id: number | null;
  payment_method_id: number;
  start_month: string;
  end_month: string | null;
  installments: number | null;
  purchase_date: string | null;
}
