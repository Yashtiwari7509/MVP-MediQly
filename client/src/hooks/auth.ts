import api from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const BASE_PRL = import.meta.env.VITE_BASE_URL;
const BASE_LRL = import.meta.env.VITE_BASE_LRL;

const BASE_URL = BASE_LRL || BASE_PRL;

const setAuthData = (token: string, userType: "user" | "doctor") => {
  localStorage.setItem("token", token);
  localStorage.setItem("userType", userType); // Store user type separately
};

// Function to get user type
export const getUserType = (): "user" | "doctor" | null => {
  return localStorage.getItem("userType") as "user" | "doctor" | null;
};

// Function to get stored token
export const getToken = () => {
  return localStorage.getItem("token");
};

// Register User & Store Token
const registerUser = async (userData: any) => {
  const { data } = await axios.post(BASE_URL + "/users/register", userData);
  setAuthData(data.token, "user");
  return data;
};

// 🔹 Dynamic Login Function (Supports User & Doctor)
const login = async ({ credentials, loginType }) => {
  const endpoint =
    loginType === "doctor"
      ? BASE_URL + "/doctors/login"
      : BASE_URL + "/users/login";

  const { data } = await axios.post(endpoint, credentials);
  setAuthData(data.token, loginType);
  return data;
};

// 🔹 Updated useLogin Hook (Accepts loginType)
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { user?: any; doctor?: any }, // ✅ Support both
    Error,
    {
      credentials: { email: string; password: string };
      loginType: "user" | "doctor";
    }
  >({
    mutationFn: ({ credentials, loginType }) =>
      login({ credentials, loginType }),
    onSuccess: (data, variables) => {
      if (variables.loginType === "doctor") {
        queryClient.setQueryData(["currentDoctor"], data.doctor);
      } else {
        queryClient.setQueryData(["currentUser"], data.user);
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
    BASE_URL + "/doctors/register",
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
