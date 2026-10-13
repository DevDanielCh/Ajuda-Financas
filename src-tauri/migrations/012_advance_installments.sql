-- =============================================================
-- Migration 012: Adiantamento de parcelas
-- Permite antecipar as últimas N parcelas de um parcelamento para
-- o mês atual. O adiantamento é estado do plano (sincroniza entre
-- devices): advanced_installments = quantas das últimas parcelas
-- foram adiantadas; advanced_to = mês destino (YYYY-MM).
-- Cada transação adiantada guarda advanced_from = mês original, para
-- exibir o número correto da parcela (n/total) e para a idempotência
-- da materialização (várias adiantadas compartilham o mês destino).
-- Descontos aplicados entram como transações type = 6 (valor negativo).
-- =============================================================

ALTER TABLE fixed_bills ADD COLUMN advanced_installments INTEGER NOT NULL DEFAULT 0;
ALTER TABLE fixed_bills ADD COLUMN advanced_to TEXT;
ALTER TABLE transactions ADD COLUMN advanced_from TEXT;
