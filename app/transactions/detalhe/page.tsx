"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { FaturaDetail } from "@/src/OrganizacaoFinanceira/Views/Transacao/FaturaDetail"

function DetailLoader() {
  const params = useSearchParams()
  const raw = params.get("id")
  const id = raw ? Number(raw) : null
  return <FaturaDetail id={id && Number.isFinite(id) ? id : null} />
}

export default function FaturaDetailPage() {
  return (
    <Suspense fallback={null}>
      <DetailLoader />
    </Suspense>
  )
}
