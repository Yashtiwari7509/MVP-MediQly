import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/api";

// 1. Get payment history function
const getPaymentHistory = async (userType: "user" | "doctor") => {
  const endpoint =
    userType === "doctor" ? "/payment/doctor-history" : "/payment/user-history";

  const { data } = await api.get(endpoint);

  if (!data.success) {
    throw new Error("Failed to fetch payment history");
  }

  return data.payments; // Return only the payments array
};

// 2. Hook for payment history
export const usePaymentHistory = (userType: "user" | "doctor" | null) => {
  return useQuery<any[], Error>({
    queryKey: ["paymentHistory", userType],
    queryFn: () => {
      if (!userType) throw new Error("User type is required");
      return getPaymentHistory(userType);
    },
    enabled: !!userType, // Only run query if userType is defined
  });
};
