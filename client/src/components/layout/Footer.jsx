import { Link } from "react-router-dom";
import { Home as HomeIcon } from "lucide-react";
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <HomeIcon size={17} />
          </span>
          ghar<span>dhundho</span>
        </Link>
        <span>A little closer to feeling at home.</span>
        <span>© 2025 GharDhundho</span>
      </div>
    </footer>
  );
}

export default Footer;
