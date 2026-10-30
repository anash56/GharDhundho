import { useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar.jsx";
import Footer from "@/components/layout/Footer.jsx";

/** Keep authentication pages focused while retaining site navigation elsewhere. */
export default function RouteChrome({ children }) {
  const { pathname } = useLocation();

  const normalizedPath =
    pathname.replace(/\/+$/, "").toLowerCase() || "/";

  const isAuthPage =
    normalizedPath === "/login" ||
    normalizedPath === "/register";

  return (
    <>
      {!isAuthPage && <Navbar />}
      {children}
      {!isAuthPage && <Footer />}
    </>
  );
}