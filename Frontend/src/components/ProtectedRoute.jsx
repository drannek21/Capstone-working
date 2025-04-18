import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!user) {
    // Not logged in
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Not authorized
    return <Navigate to="/not-authorized" />;
  }

  return children;
};

export default ProtectedRoute;
