"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "./input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  /** When provided, the confirm button is disabled until the user types this exact string. */
  confirmText?: string;
  /** When true, the confirm button shows a spinner and is disabled. Cancel is also disabled. */
  isPending?: boolean;
  /** When true, prevents the dialog from auto-closing on confirm. Parent must close via `open` prop. */
  preventAutoClose?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  confirmText,
  isPending,
  preventAutoClose,
  onConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");

  // Reset input whenever the dialog opens or closes
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const confirmed = !confirmText || typed === confirmText;

  return (
    <AlertDialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {confirmText && (
          <div className="space-y-1.5 py-1">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-medium text-foreground">{confirmText}</span> to confirm.
            </p>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              placeholder={confirmText}
              autoFocus
              disabled={isPending}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              if (isPending) {
                event.preventDefault();
                return;
              }
              if (preventAutoClose) event.preventDefault();
              onConfirm();
            }}
            disabled={!confirmed || isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
