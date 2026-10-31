import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RouteChrome from "@/components/layout/RouteChrome.jsx";
import Empty from "@/components/common/EmptyState.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

const Home = lazy(() => import("@/pages/Home.jsx"));
const Listings = lazy(() => import("@/pages/Listings.jsx"));
const ListingDetail = lazy(() => import("@/pages/ListingDetail.jsx"));
const Login = lazy(() => import("@/pages/Login.jsx"));
const Register = lazy(() => import("@/pages/Register.jsx"));
const Dashboard = lazy(() => import("@/pages/DashboardEntry.jsx"));

function AuthBootstrapScreen() {
  return (
    <main className="auth-bootstrap" role="status" aria-live="polite" aria-label="Restoring your session">
      <div className="auth-bootstrap-content">
        <div className="auth-bootstrap-brand">
          ghar<span>dhundho</span>
        </div>
        <span className="auth-bootstrap-spinner" aria-hidden="true" />
        <p>Getting things ready…</p>
      </div>
    </main>
  );
}

export default function AppRoutes() {
  const { loading } = useAuth();

  return (
    <BrowserRouter>
      {loading ? (
        <AuthBootstrapScreen />
      ) : (
        <RouteChrome>
          <Suspense
            fallback={
              <main className="wrap page">
                <div className="skeleton detail-skeleton" />
              </main>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="*"
                element={
                  <Empty
                    title="That page has wandered off"
                    text="Let's find you a place to call home."
                  />
                }
              />
            </Routes>
          </Suspense>
        </RouteChrome>
      )}
    </BrowserRouter>
  );
}
