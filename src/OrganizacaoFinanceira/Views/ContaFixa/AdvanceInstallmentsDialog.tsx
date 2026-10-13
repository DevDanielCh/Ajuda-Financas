"use client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote, FastForward, Repeat } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { Field, FieldLabel } from "@/components/ui/field";
import { FormSection } from "@/components/forms/FormSection";
import { MoneyInput } from "@/components/forms/MoneyInput";
import { StepperInput } from "@/components/forms/StepperInput";
import { usePlatform } from "@/lib/platform";
import { msg } from "@/src/shared/repository";
import { formatMoney } from "@/lib/format";
import { fixedBillApi } from "../../Repositories/fixed-bill";
import { fixedBillKeys } from "../../Services/fixed-bill";
import type { AdvancePreview } from "../../Models/advance";

export function AdvanceInstallmentsDialog({
  planId,
  onOpenChange,
  onDone,
}: {
  planId: number | null;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) {
  const platform = usePlatform();
  const open = planId != null;

  const content = open ? (
    <AdvanceContent
      key={planId}
      planId={planId}
      onClose={() => onOpenChange(false)}
      onDone={onDone}
    />
  ) : null;

  if (platform === "mobile") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="top" showCloseButton>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{content}</DialogContent>
    </Dialog>
  );
}

function AdvanceContent({
  planId,
  onClose,
  onDone,
}: {
  planId: number;
  onClose: () => void;
  onDone?: () => void;
}) {
  const platform = usePlatform();
  const client = useQueryClient();
  const [preview, setPreview] = useState<AdvancePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    fixedBillApi
      .advancePreview(planId)
      .then((p) => {
        if (!active) return;
        setPreview(p);
        setCount(p.remaining);
      })
      .catch((e) => {
        if (active) setError(msg(e));
      });
    return () => {
      active = false;
    };
  }, [planId]);

  const installmentAmount = preview?.installment_amount ?? 0;
  const gross = count * installmentAmount;
  const total = Math.max(0, gross - discount);

  const canSubmit =
    !!preview &&
    !preview.already_advanced &&
    preview.remaining > 0 &&
    count >= 1 &&
    count <= preview.remaining &&
    total >= 0 &&
    total <= gross &&
    !pending;

  const submit = async () => {
    if (!preview || !canSubmit) return;
    setPending(true);
    try {
      await fixedBillApi.advance(planId, count, discount);
      void client.invalidateQueries({ queryKey: fixedBillKeys(true) });
      void client.invalidateQueries({ queryKey: ["fixed-bills"] });
      void client.invalidateQueries({ queryKey: ["transactions"] });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
      void client.invalidateQueries({ queryKey: ["card-bill"] });
      toast.add({ title: "Parcelas adiantadas com sucesso", type: "success" });
      onDone?.();
      onClose();
    } catch (e) {
      toast.add({ title: msg(e), type: "error" });
    } finally {
      setPending(false);
    }
  };

  const Header =
    platform === "mobile" ? (
      <SheetHeader>
        <SheetTitle>Adiantar parcelas</SheetTitle>
        <SheetDescription>
          {preview?.description ?? "Carregando..."}
        </SheetDescription>
      </SheetHeader>
    ) : (
      <DialogHeader>
        <DialogTitle>Adiantar parcelas</DialogTitle>
        <DialogDescription>
          {preview?.description ?? "Carregando..."}
        </DialogDescription>
      </DialogHeader>
    );

  const Footer =
    platform === "mobile" ? (
      <SheetFooter>
        <Button variant="outline" size="lg" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          size="lg"
          className="rounded-md"
          disabled={!canSubmit}
          onClick={() => void submit()}
        >
          {pending ? <Spinner /> : "Adiantar"}
        </Button>
      </SheetFooter>
    ) : (
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          className="rounded-md"
          disabled={!canSubmit}
          onClick={() => void submit()}
        >
          {pending ? <Spinner /> : "Adiantar"}
        </Button>
      </DialogFooter>
    );

  if (error) {
    return (
      <>
        {Header}
        <p className="text-sm text-destructive">{error}</p>
        {Footer}
      </>
    );
  }

  if (!preview) {
    return (
      <>
        {Header}
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </>
    );
  }

  if (preview.already_advanced) {
    return (
      <>
        {Header}
        <p className="text-sm text-muted-foreground">
          Este parcelamento já possui parcelas adiantadas e não pode ser
          adiantado novamente.
        </p>
        {Footer}
      </>
    );
  }

  if (preview.remaining <= 0) {
    return (
      <>
        {Header}
        <p className="text-sm text-muted-foreground">
          Não há parcelas restantes para adiantar.
        </p>
        {Footer}
      </>
    );
  }

  return (
    <>
      {Header}

      <div className="flex flex-col gap-5">
        <FormSection title="Parcelas" icon={Repeat}>
          <Field>
            <FieldLabel required>Quantas parcelas adiantar</FieldLabel>
            <StepperInput
              value={count}
              min={1}
              max={preview.remaining}
              onChange={setCount}
            />
            <p className="text-xs text-muted-foreground">
              Restantes: {preview.remaining} • {formatMoney(installmentAmount)} cada
            </p>
          </Field>
        </FormSection>

        <FormSection title="Valores" icon={Banknote}>
          <div className="grid *:min-w-0 grid-cols-2 items-start gap-4">
            <Field>
              <FieldLabel required>Total a pagar</FieldLabel>
              <MoneyInput
                size="lg"
                value={total}
                onChange={(cents) =>
                  setDiscount(Math.max(0, Math.min(gross, gross - cents)))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Desconto</FieldLabel>
              <MoneyInput
                size="lg"
                value={discount}
                onChange={(cents) =>
                  setDiscount(Math.max(0, Math.min(gross, cents)))
                }
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Sem adiantamento: {formatMoney(gross)}
          </p>
        </FormSection>

        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <FastForward className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            {count === 1 ? "A última parcela" : `As últimas ${count} parcelas`} serão
            trazidas para o mês atual.
          </span>
        </div>
      </div>

      {Footer}
    </>
  );
}
