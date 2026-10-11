"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, HandCoins, Landmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { loanApi } from "../../Repositories/loan"
import { msg } from "@/src/shared/repository"
import { formatDate, formatMoney } from "@/lib/format"
import { useMonth } from "@/lib/month-context"
import { cn } from "@/lib/utils"
import type { LoanDetail } from "../../Models/loan"

export function FinanciamentoDetail({ id }: { id: number | null }) {
  const { month } = useMonth()
  const [detail, setDetail] = useState<LoanDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetail(null)
    setError(null)
    loanApi
      .getDetail(id)
      .then((d) => {
        setDetail(d)
      })
      .catch((e) => setError(msg(e)))
  }, [id])

  const dueDate = (ym: string) => {
    const [y, m] = ym.split("-").map(Number)
    const day = Math.min(detail!.loan.day, new Date(y, m, 0).getDate())
    return formatDate(
      `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    )
  }

  const totalPaid = detail?.schedule.reduce((s, r) => s + r.installment, 0) ?? 0

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <header className="flex shrink-0 items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          nativeButton={false}
          aria-label="Voltar para financiamentos"
          render={<Link href="/loans" />}
        >
          <ArrowLeft />
        </Button>
        {detail?.loan.type === 1 ? (
          <HandCoins className="size-5 shrink-0 text-sticker-teal" />
        ) : (
          <Landmark className="size-5 shrink-0 text-sticker-purple-deep" />
        )}
        <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-semibold">
          {detail?.loan.description ?? "Carregando..."}
        </h1>
        {detail && (
          <Badge variant={detail.loan.type === 1 ? "info" : "purple"}>
            {detail.loan.type === 1 ? "Empréstimo" : "Financiamento"}
          </Badge>
        )}
      </header>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/loans" />}
          >
            Voltar
          </Button>
        </div>
      )}

      {detail && (
        <>
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-5">
            <SummaryCard
              label="Valor"
              value={formatMoney(detail.loan.principal)}
            />
            <SummaryCard
              label="Parcela"
              value={formatMoney(detail.loan.installment)}
            />
            <SummaryCard label="Total" value={formatMoney(totalPaid)} />
            <SummaryCard
              label="Juros"
              value={formatMoney(totalPaid - detail.loan.principal)}
            />
            <SummaryCard
              label="Parcelas"
              value={`${detail.loan.paid_count}/${detail.loan.total_installments}`}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-card">
            <Table>
              <TableHeader scrollable>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Parcela</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Juros
                  </TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Amortização
                  </TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Liq. antecipada
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.schedule.map((r) => {
                  const paid = r.month < month
                  return (
                    <TableRow
                      key={r.number}
                      className={cn(paid && "opacity-50")}
                    >
                      <TableCell
                        className={cn(
                          paid && "text-muted-foreground line-through"
                        )}
                      >
                        {dueDate(r.month)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          paid && "text-muted-foreground line-through"
                        )}
                      >
                        {formatMoney(r.installment)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "hidden text-right tabular-nums sm:table-cell",
                          paid && "text-muted-foreground line-through"
                        )}
                      >
                        {formatMoney(r.interest)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "hidden text-right tabular-nums sm:table-cell",
                          paid && "text-muted-foreground line-through"
                        )}
                      >
                        {formatMoney(r.principal)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          paid && "text-muted-foreground line-through"
                        )}
                      >
                        {formatMoney(r.balance)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "hidden text-right tabular-nums sm:table-cell",
                          paid && "text-muted-foreground line-through"
                        )}
                      >
                        {r.settlement > 0 ? formatMoney(r.settlement) : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="gap-0 px-4 py-3" size="sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </Card>
  )
}
