// src/components/auth/PrivateRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import React from "react";
import { useAuth } from "@/auth/AuthProvider";
const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isLoading, currentDoctor, currentUser } = useAuth();
  console.log(isAuthenticated, isLoading, "testing");

  const location = useLocation();
  console.log(currentDoctor, currentUser, "pri");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-screen h-[100vh]">
        <span className="loader"></span>
      </div>
    );
  }

  if (!isAuthenticated ) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
