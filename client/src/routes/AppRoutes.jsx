import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "@/components/layout/Navbar.jsx";
import Footer from "@/components/layout/Footer.jsx";
import Empty from "@/components/common/EmptyState.jsx";

const Home = lazy(() => import("@/pages/Home.jsx"));
const Listings = lazy(() => import("@/pages/Listings.jsx"));
const ListingDetail = lazy(() => import("@/pages/ListingDetail.jsx"));
const Login = lazy(() => import("@/pages/Login.jsx"));
const Register = lazy(() => import("@/pages/Register.jsx"));
const Dashboard = lazy(() => import("@/pages/DashboardEntry.jsx"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
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
      <Footer />
    </BrowserRouter>
  );
}
