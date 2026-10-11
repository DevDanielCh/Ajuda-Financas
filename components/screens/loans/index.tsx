"use client"
import { Suspense } from "react"
import { PlatformView } from "@/components/PlatformView"
import type { CrudConfig } from "@/components/crud/types"
import type { PaymentMethod } from "@/src/OrganizacaoFinanceira/Models/payment-method"
import type { Loan, LoanInput } from "@/src/OrganizacaoFinanceira/Models/loan"
import { LoansDesktop } from "./desktop/LoansDesktop"
import { LoansMobile } from "./mobile/LoansMobile"

type Resources = { paymentMethods: PaymentMethod[] }

export function LoansScreen({
  config,
}: {
  config: CrudConfig<Loan, LoanInput, Resources>
}) {
  return (
    <Suspense fallback={null}>
      <PlatformView
        mobile={<LoansMobile config={config} />}
        desktop={<LoansDesktop config={config} />}
      />
    </Suspense>
  )
}
