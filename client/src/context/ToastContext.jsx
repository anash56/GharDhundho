import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState("");
  const notify = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
