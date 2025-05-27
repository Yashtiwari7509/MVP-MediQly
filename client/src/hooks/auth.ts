import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000";
console.log(BASE_URL);

const setAuthData = (token: string, userType: "user" | "doctor") => {
  localStorage.setItem("token", token);
  localStorage.setItem("userType", userType); // Store user type separately
};

// Function to get user type
export const getUserType = () => {
  return localStorage.getItem("userType") as "user" | "doctor" | null;
};

// Function to get stored token
export const getToken = () => {
  return localStorage.getItem("token");
};

// Register User & Store Token
const registerUser = async (userData: any) => {
  const { data } = await axios.post(
    `${BASE_URL}/api/users/register`,
    userData
  );
  setAuthData(data.token, "user");
  return data;
};

// 🔹 Dynamic Login Function (Supports User & Doctor)
const login = async ({ credentials, loginType }) => {
  const endpoint =
    loginType === "doctor"
      ? `${BASE_URL}/api/doctors/login`
      : `${BASE_URL}/api/users/login`;

  const { data } = await axios.post(endpoint, credentials);
  setAuthData(data.token, loginType);
  
  // Return data in a consistent format
  return {
    token: data.token,
    user: loginType === "user" ? data.user : null,
    doctor: loginType === "doctor" ? data.doctor : null
  };
};

// 🔹 Updated useLogin Hook (Accepts loginType)
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { token: string; user?: any; doctor?: any },
    Error,
    {
      credentials: { email: string; password: string };
      loginType: "user" | "doctor";
    }
  >({
    mutationFn: ({ credentials, loginType }) =>
      login({ credentials, loginType }),
    onSuccess: (data, variables) => {
      // Clear both user and doctor data first
      queryClient.setQueryData(["currentUser"], null);
      queryClient.setQueryData(["currentDoctor"], null);
      
      // Then set the appropriate data
      if (variables.loginType === "doctor") {
        queryClient.setQueryData(["currentDoctor"], data.doctor);
      } else {
        queryClient.setQueryData(["currentUser"], data.user);
      }
      
      // Force a refetch of the profile
      if (variables.loginType === "doctor") {
        queryClient.invalidateQueries({ queryKey: ["currentDoctor"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      }
    },
  });
};

// useRegister (Remains the Same)
export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      queryClient.setQueryData(["currentUser"], data.user);
    },
  });
};

// useLogout (Remains the Same)
export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await Promise.resolve(); // Mimic async behavior
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      queryClient.setQueryData(["currentUser"], null);
      queryClient.setQueryData(["currentDoctor"], null);
    },
  });
};

// doctor register

const registerDoctor = async (userData) => {
  const formattedData = {
    ...userData,
    qualifications: userData.qualifications.filter((q) => q.trim() !== ""),
    experience: parseInt(userData.experience, 10),
  };
  console.log(formattedData, "ahhah");
  const { data } = await axios.post(
    `${BASE_URL}/api/doctors/register`,
    formattedData
  );
  setAuthData(data.token, "doctor");

  return data;
};

export const useDocRegister = () => {
  const queryClient = useQueryClient();
  return useMutation<any>({
    mutationFn: registerDoctor,
    onSuccess: (data) => {
      console.log(data, "success");

      queryClient.setQueryData(["currentDoctor"], data.doctor);
    },
  });
};
