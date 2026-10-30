import { useAuth } from "@/context/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import OwnerDashboard from "@/pages/OwnerDashboard.jsx";
import SeekerDashboard from "@/pages/SeekerDashboard.jsx";
import AdminDashboard from "@/pages/AdminDashboard.jsx";

export default function DashboardEntry() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <main className="wrap page">
        <div className="skeleton detail-skeleton" />
      </main>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "owner") return <OwnerDashboard />;
  if (user.role === "seeker") return <SeekerDashboard />;
  return <Navigate to="/" replace />;
}
