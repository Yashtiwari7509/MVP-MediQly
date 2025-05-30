import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import HealthTracker from "./pages/HealthTracker";
import Appointments from "./pages/Appointments";
import PreventiveHealth from "./pages/PreventiveHealth";
import Insurance from "./pages/Insurance";
import Symptoms from "./pages/Symptoms";
import BMI from "./pages/Consultation";
import Medicine from "./pages/Medicine";
import NotFound from "./pages/NotFound";
import Login from "./auth/Login";
import Register from "./auth/Register";
import { ThemeProvider } from "./utils/theme.provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Profile from "./pages/Profile";
import ChatCall from "./pages/chat/VideoChat";
import DocRegister from "./auth/DocRegister";
import AiDoctor from "./pages/AiDoctor";
import HealthFeedPage from "./pages/HealthFeed";
import RepostsPage from "./pages/Report";
import Diet from "./pages/Diet";
import MainLayout from "./components/layout/MainLayout";
import ConsultationBooking from "./pages/ConsBooking";
import Consultation from "./pages/Consultation";
import Emergency from "./pages/Emergency";
import CalorieCalculator from "./pages/CalorieCalculator";
import { SocketProvider } from "./context/SocketContext";
import PrivateRoute from "./Protect/ProtectedRoute";
import { AuthProvider } from "./auth/AuthProvider";

const queryClient = new QueryClient();
const App = () => (
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
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/user-register" element={<Register />} />
                  <Route path="/doc-register" element={<DocRegister />} />

                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Index />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/health-tracker"
                    element={
                      <PrivateRoute>
                        <HealthTracker />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/preventive-health"
                    element={
                      <PrivateRoute>
                        <PreventiveHealth />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/insurance"
                    element={
                      <PrivateRoute>
                        <Insurance />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/symptoms"
                    element={
                      <PrivateRoute>
                        <Symptoms />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/consultation"
                    element={
                      <PrivateRoute>
                        <Consultation />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/consultation/:doctorId"
                    element={
                      <PrivateRoute>
                        <ConsultationBooking />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/medicine"
                    element={
                      <PrivateRoute>
                        <Medicine />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/calorie-calculator"
                    element={
                      <PrivateRoute>
                        <CalorieCalculator />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <PrivateRoute>
                        <ChatCall />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/ai-doctor"
                    element={
                      <PrivateRoute>
                        <AiDoctor />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/feed"
                    element={
                      <PrivateRoute>
                        <HealthFeedPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/report"
                    element={
                      <PrivateRoute>
                        <MainLayout>
                          <RepostsPage />
                        </MainLayout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/diet"
                    element={
                      <PrivateRoute>
                        <Diet />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/emergency"
                    element={
                      <PrivateRoute>
                        <Emergency />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <PrivateRoute>
                        <NotFound />
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </SocketProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);

export default App;
