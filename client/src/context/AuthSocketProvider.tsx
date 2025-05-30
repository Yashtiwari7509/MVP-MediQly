// AuthSocketProvider.tsx
import React from "react";
import { SocketProvider } from "@/context/SocketContext";
import { AuthProvider } from "@/auth/AuthProvider";

const AuthSocketProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <SocketProvider>{children}</SocketProvider>
    </AuthProvider>
  );
};

export default AuthSocketProvider;
