import { createContext, useContext, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom"; // 🔹 Added `useLocation`
import api from "@/utils/api";
import { getToken, getUserType } from "@/hooks/auth";
import { profileProps, doctorProfileProps } from "@/lib/user.type";
import { LoaderIcon } from "lucide-react";
import "@/App.css";

interface AuthContextType {
  currentUser: profileProps | null;
  currentDoctor: doctorProfileProps | null;
  userType: "user" | "doctor" | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const token = getToken();
  const userType = getUserType();

  // 🔹 Fetch User Profile (For Users)
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!token || userType !== "user") return null;
      try {
        const { data } = await api.get("/users/profile");
        return data;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        return null;
      }
    },
    enabled: !!token && userType === "user",
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // 🔹 Fetch Doctor Profile (For Doctors)
  const { data: currentDoctor, isLoading: isDoctorLoading } = useQuery({
    queryKey: ["currentDoctor"],
    queryFn: async () => {
      if (!token || userType !== "doctor") return null;
      try {
        const { data } = await api.get("/doctors/profile");
        return data;
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        return null;
      }
    },
    enabled: !!token && userType === "doctor",
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // 🔹 Compute Authentication State
  const isLoading = (!!token && (isUserLoading || isDoctorLoading));
  const isAuthenticated = useMemo(
    () => !!(currentUser || currentDoctor),
    [currentUser, currentDoctor]
  );

  // 🔹 Handle Authentication and Redirection
  useEffect(() => {
    console.log("Auth state:", {
      isLoading,
      isAuthenticated,
      token,
      userType,
      currentUser,
      currentDoctor,
    });

    if (!isLoading) {
      const isPublicRoute = ["/login", "/register", "/doc-register"].includes(
        location.pathname
      );

      if (!token && !isPublicRoute) {
        navigate("/login");
      } else if (token && !isAuthenticated && !isLoading) {
        // If we have a token but no user data, try to fetch it again
        if (userType === "doctor") {
          queryClient.invalidateQueries({ queryKey: ["currentDoctor"] });
        } else {
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        }
      }
    }
  }, [isLoading, isAuthenticated, navigate, token, location.pathname, userType, queryClient]);

  // 🔹 Show Loading While Fetching Initial Data
  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-screen h-[100vh]">
        <span className="loader"></span>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, currentDoctor, userType, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to access auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
