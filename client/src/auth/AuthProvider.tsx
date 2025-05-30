// src/provider/AuthProvider.tsx
import { createContext, useContext, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/api";
import { doctorProfileProps, UserProps } from "@/lib/user.type";
import { getToken, getUserType } from "@/hooks/auth";

interface AuthContextType {
  currentUser: UserProps | null;
  currentDoctor: doctorProfileProps | null;
  userType: "user" | "doctor" | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  const userType = getUserType();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!token || userType !== "user") return null;
      try {
        const { data } = await api.get("/users/profile");
        console.log(data, "users");

        return data;
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        return null;
      }
    },
    enabled: !!token && userType === "user",
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: currentDoctor, isLoading: isDoctorLoading } = useQuery({
    queryKey: ["currentDoctor"],
    queryFn: async () => {
      if (!token || userType !== "doctor") return null;
      try {
        const { data } = await api.get("/doctors/profile");
        console.log(data, "doctors");

        return data;
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        return null;
      }
    },
    enabled: !!token && userType === "doctor",
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Determine authentication and loading state
  const isAuthenticated = !!(currentUser || currentDoctor);

  const isLoading = !!token && (isUserLoading || isDoctorLoading);

  // Re-fetch if token exists but no data (e.g. on refresh)
  useEffect(() => {
    console.log("coponent mounted");

    if (token && !isAuthenticated && !isLoading) {
      queryClient.invalidateQueries({
        queryKey: userType === "doctor" ? ["currentDoctor"] : ["currentUser"],
      });
    }
  }, [token, userType, isAuthenticated, isLoading, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentDoctor,
        userType,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
