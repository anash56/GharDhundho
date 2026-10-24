import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/services/authService.js";
import { useToast } from "@/context/ToastContext.jsx";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    authService
      .current()
      .then((response) => setUser(response.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => ({ ...useContext(AuthContext), ...useToast() });
