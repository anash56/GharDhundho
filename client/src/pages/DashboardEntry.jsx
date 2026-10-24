import { useAuth } from "@/context/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import OwnerDashboard from "@/pages/OwnerDashboard.jsx";
import SeekerDashboard from "@/pages/SeekerDashboard.jsx";

export default function DashboardEntry() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <main className="wrap page">
        <div className="skeleton detail-skeleton" />
      </main>
    );
  if (!user) return <Navigate to="/login" replace />;
  return user?.role === "owner" ? <OwnerDashboard /> : <SeekerDashboard />;
}
