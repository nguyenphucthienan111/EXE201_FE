import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

export default function PrivateRoute({ children, allowRoles }) {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "user").toLowerCase();

  if (!token) return <Navigate to="/login" replace />;

  if (Array.isArray(allowRoles) && allowRoles.length > 0) {
    if (!allowRoles.map(r => r.toLowerCase()).includes(role)) {
      // không đủ quyền thì về trang home
      return <Navigate to="/home" replace />;
    }
  }

  return children;
}

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowRoles: PropTypes.arrayOf(PropTypes.string)
};
