"use client";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { CrudRowAction } from "./types";

export function CardOptionsSheet<T extends { id: number }>({
  open, onOpenChange, row, title, canEdit, onView, onEdit, onDelete, actions,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  row: T | null;
  title: (row: T) => string;
  canEdit: (row: T) => boolean;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  actions?: CrudRowAction<T>[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="gap-1 pb-6">
        {row && (
          <>
            <SheetTitle className="px-4 pt-2">{title(row)}</SheetTitle>
            <div className="flex flex-col px-2">
              {onView && (
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); onView(row); }}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent"
                >
                  <Eye className="size-4" /> Visualizar
                </button>
              )}
              {onEdit && canEdit(row) && (
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); onEdit(row); }}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent"
                >
                  <Pencil className="size-4" /> Editar
                </button>
              )}
              {onDelete && canEdit(row) && (
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); onDelete(row); }}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-accent"
                >
                  <Trash2 className="size-4" /> Excluir
                </button>
              )}
              {actions
                ?.filter((a) => !a.visible || a.visible(row))
                .map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => { onOpenChange(false); a.onSelect(row); }}
                    className={
                      a.variant === "destructive"
                        ? "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-accent"
                        : "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent"
                    }
                  >
                    {a.icon} {a.label}
                  </button>
                ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
