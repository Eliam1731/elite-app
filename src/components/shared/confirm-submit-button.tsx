"use client";

import type { MouseEvent } from "react";
import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = {
  label: string;
  confirmMessage: string;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function ConfirmSubmitButton({
  label,
  confirmMessage,
  pendingLabel = "Procesando...",
  className,
  disabled = false,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (disabled || pending) {
      event.preventDefault();
      return;
    }

    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  }

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      onClick={handleClick}
      className={className}
    >
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}
