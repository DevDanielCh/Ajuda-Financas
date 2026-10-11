"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { FinanciamentoDetail } from "@/src/OrganizacaoFinanceira/Views/Financiamento/FinanciamentoDetail"

function DetailLoader() {
  const params = useSearchParams()
  const raw = params.get("id")
  const id = raw ? Number(raw) : null
  return <FinanciamentoDetail id={id && Number.isFinite(id) ? id : null} />
}

export default function LoanDetailPage() {
  return (
    <Suspense fallback={null}>
      <DetailLoader />
    </Suspense>
  )
}
