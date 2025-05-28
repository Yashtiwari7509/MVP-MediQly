import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./utils/theme.provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./auth/AuthProvider";
import { SocketProvider } from "@/context/SocketContext";
import AppRoutes from "@/routes";
import { useState } from "react";

const App = () => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider
        clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
        onScriptLoadError={() => console.error("Google Script failed to load")}
      >
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <SocketProvider>
                  <AppRoutes />
                </SocketProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
