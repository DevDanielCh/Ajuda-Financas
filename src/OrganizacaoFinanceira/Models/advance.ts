export interface AdvancePreview {
  fixed_bill_id: number;
  description: string;
  /** Valor de cada parcela. */
  installment_amount: number;
  /** Quantas parcelas ainda podem ser adiantadas (1..=remaining). */
  remaining: number;
  /** Índice da parcela do mês atual (1-based); 0 se o plano ainda não começou. */
  current_index: number;
  /** Verdadeiro quando o plano já tem adiantamento (não pode re-adiantar). */
  already_advanced: boolean;
}
