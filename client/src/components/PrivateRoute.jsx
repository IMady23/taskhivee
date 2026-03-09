import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, token } = useContext(AuthContext);

  if (!isAuthenticated || !token || !user) {
    // Redirect to appropriate login page based on route
    const path = window.location.pathname;
    if (path.includes('leader')) {
      return <Navigate to="/leader-auth?mode=login" replace />;
    } else if (path.includes('member')) {
      return <Navigate to="/member-auth?mode=login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Check role
  if (allowedRoles && !allowedRoles.includes(user.role?.toLowerCase())) {
    // Redirect based on user's role
    if (user.role?.toLowerCase() === "leader") {
      return <Navigate to="/leader-dashboard" replace />;
    } else if (user.role?.toLowerCase() === "member") {
      return <Navigate to="/member-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
