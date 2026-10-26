import { useEffect, useId, useRef } from "react";
import { AlertTriangle } from "lucide-react";

/** Accessible confirmation dialog shared by critical user actions. */
function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  busyLabel,
  cancelLabel = "Cancel",
  busy = false,
  destructive = false,
  icon: Icon = AlertTriangle,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const busyRef = useRef(busy);
  const handlersRef = useRef({ onCancel, onConfirm });
  const titleId = useId();
  const descriptionId = useId();

  busyRef.current = busy;
  handlersRef.current = { onCancel, onConfirm };

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    cancelButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busyRef.current) handlersRef.current.onCancel?.();
        return;
      }

      if (event.key !== "Tab") return;
      const buttons = dialogRef.current?.querySelectorAll("button:not(:disabled)");
      if (!buttons?.length) return;

      const firstButton = buttons[0];
      const lastButton = buttons[buttons.length - 1];

      if (event.shiftKey && document.activeElement === firstButton) {
        event.preventDefault();
        lastButton.focus();
      } else if (!event.shiftKey && document.activeElement === lastButton) {
        event.preventDefault();
        firstButton.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "rgba(15, 23, 42, 0.55)",
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        style={{
          width: "min(100%, 440px)",
          padding: 24,
          borderRadius: 18,
          background: "#fff",
          color: "#0f172a",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon size={21} aria-hidden="true" />
          <h2 id={titleId} style={{ margin: 0, fontSize: "1.2rem" }}>
            {title}
          </h2>
        </div>
        {description && (
          <p id={descriptionId} style={{ marginTop: 14, lineHeight: 1.6 }}>
            {description}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button
            ref={cancelButtonRef}
            className="text-button"
            type="button"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="button"
            type="button"
            disabled={busy}
            onClick={onConfirm}
            style={
              destructive
                ? { background: "#b91c1c", borderColor: "#b91c1c", color: "#fff" }
                : undefined
            }
          >
            {busy ? busyLabel || `${confirmLabel}…` : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
