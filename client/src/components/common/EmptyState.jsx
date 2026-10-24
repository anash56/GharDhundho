import { Link } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
function Empty({ title, text }) {
  return (
    <div className="empty">
      <span>
        <Building2 size={23} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link to="/listings" className="link-arrow">
        Explore homes <ArrowRight size={16} />
      </Link>
    </div>
  );
}

export default Empty;
