"use client"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CrudPage } from "@/components/crud/CrudPage"
import { TransacaoAddForm } from "./TransacaoAddForm"
import { transactionApi } from "../../Repositories/transaction"
import { categoryApi } from "../../Repositories/category"
import { paymentMethodApi } from "../../Repositories/payment-method"
import { msg } from "@/src/shared/repository"
import { dashboardKeys } from "@/src/shared/services"
import { useMonth } from "@/lib/month-context"
import { transactionKeys } from "../../Services/transaction"
import { transactionSchema } from "@/lib/schemas"
import { formatDate, formatMoney, todayISO } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Sort } from "@/src/shared/models"
import type {
  CardBillDetail,
  TransactionInput,
  TransactionRow,
} from "../../Models/transaction"

export function FaturaDetail({ id }: { id: number | null }) {
  const { month } = useMonth()
  const [detail, setDetail] = useState<CardBillDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetail(null)
    setError(null)
    transactionApi
      .getCardBill(id)
      .then(setDetail)
      .catch((e) => setError(msg(e)))
  }, [id, reload])

  const load = useCallback(
    (sort: Sort | null) => {
      if (!id) return Promise.resolve<TransactionRow[]>([])
      return transactionApi.listCardBillTransactions(id, sort).then((d) => {
        setDetail((prev) => (prev ? { ...prev, ...d } : d))
        return d.transactions
      })
    },
    [id]
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <header className="flex shrink-0 items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          nativeButton={false}
          aria-label="Voltar para transações"
          render={<Link href="/transactions" />}
        >
          <ArrowLeft />
        </Button>
        <CreditCard className="size-5 shrink-0 text-sticker-purple-deep" />
        <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-semibold">
          {detail?.description ?? "Carregando..."}
        </h1>
        <Badge>Fatura</Badge>
      </header>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/transactions" />}
          >
            Voltar
          </Button>
        </div>
      )}

      {!error && (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {detail && (
            <div className="grid shrink-0 grid-cols-3 gap-3">
              <SummaryCard
                label="Período"
                value={`${formatDate(detail.period_start)} a ${formatDate(detail.period_end)}`}
              />
              <SummaryCard
                label="Vencimento"
                value={formatDate(detail.due_date)}
              />
              <SummaryCard
                label="Total"
                value={formatMoney(detail.total)}
                negative
                big
              />
            </div>
          )}
          <CrudPage
            config={{
              title: "Compras da Fatura",
              addLabel: "Nova Compra",
              newTitle: "Nova Compra",
              editTitle: "Editar Compra",
              columns: [
                {
                  label: "Data",
                  name: "date",
                  render: (r) => formatDate(r.date),
                },
                {
                  label: "Descrição",
                  name: "description",
                  render: (r) => (
                    <span>
                      {r.description}
                      {r.installment && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {r.installment}
                        </span>
                      )}
                    </span>
                  ),
                },
                {
                  label: "Valor",
                  name: "amount",
                  render: (r) => (
                    <span className="text-negative tabular-nums">
                      − {formatMoney(r.amount)}
                    </span>
                  ),
                },
              ],
              mobileCorners: {
                topLeft: (r) => r.description,
                bottomLeft: (r) =>
                  r.installment
                    ? `Parcela ${r.installment}`
                    : (r.category_name ?? "—"),
                topRight: (r) => (
                  <span className="text-negative tabular-nums">
                    − {formatMoney(r.amount)}
                  </span>
                ),
                bottomRight: (r) => formatDate(r.date),
              },
              keepOpen: false,
              onSaved: () => setReload((n) => n + 1),
              load,
              create: transactionApi.create,
              update: (bid, d) => transactionApi.update(bid, d),
              remove: transactionApi.remove,
              empty: (): TransactionInput => ({
                description: "",
                amount: 0,
                type: 2,
                date: todayISO(),
                category_id: null,
                payment_method_id: detail?.payment_method_id ?? null,
                card_mode: 0,
              }),
              toInput: (r): TransactionInput => ({
                description: r.description,
                amount: r.amount,
                type: r.type as 1 | 2 | 4 | 5,
                date: r.date,
                category_id: r.category_id,
                payment_method_id: r.payment_method_id,
                card_mode: r.card_mode,
              }),
              protected: () => false,
              tableClassName: "table-scroll-flex",
              loadResources: async () => {
                const [categories, paymentMethods] = await Promise.all([
                  categoryApi.list(),
                  paymentMethodApi.list(),
                ])
                return { categories, paymentMethods }
              },
              FormFields: TransacaoAddForm,
              queryKey: ["card-bill", id, "transactions"],
              invalidate: [
                ["card-bill"],
                transactionKeys(month),
                dashboardKeys(month),
              ],
              schema: transactionSchema,
            }}
          />
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  negative,
  big,
}: {
  label: string
  value: string
  negative?: boolean
  big?: boolean
}) {
  return (
    <Card className="flex flex-col gap-0.5 px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-bold",
          big ? "text-lg" : "text-sm",
          negative && "text-negative tabular-nums"
        )}
      >
        {value}
      </span>
    </Card>
  )
}
