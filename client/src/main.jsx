import { createRoot } from "react-dom/client";
import App from "@/App.jsx";
import { AuthProvider } from "@/context/AuthContext.jsx";
import { ToastProvider } from "@/context/ToastContext.jsx";
import "@/styles/index.css";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </AuthProvider>,
);
