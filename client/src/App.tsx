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
import AuthSocketProvider from "./context/AuthSocketProvider";

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
            <Routes>
              <Route
                path="/"
                element={
                  <AuthSocketProvider>
                    <Index />
                  </AuthSocketProvider>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/doc-register" element={<DocRegister />} />
              <Route
                path="/profile"
                element={
                  <AuthSocketProvider>
                    <Profile />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/health-tracker"
                element={
                  <AuthSocketProvider>
                    <HealthTracker />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/preventive-health"
                element={
                  <AuthSocketProvider>
                    <PreventiveHealth />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/insurance"
                element={
                  <AuthSocketProvider>
                    <Insurance />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/symptoms"
                element={
                  <AuthSocketProvider>
                    <Symptoms />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/consultation"
                element={
                  <AuthSocketProvider>
                    <Consultation />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/consultation/:doctorId"
                element={
                  <AuthSocketProvider>
                    <ConsultationBooking />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/medicine"
                element={
                  <AuthSocketProvider>
                    <Medicine />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/calorie-calculator"
                element={
                  <AuthSocketProvider>
                    <CalorieCalculator />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/chat"
                element={
                  <AuthSocketProvider>
                    <ChatCall />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/ai-doctor"
                element={
                  <AuthSocketProvider>
                    <AiDoctor />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/feed"
                element={
                  <AuthSocketProvider>
                    <HealthFeedPage />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/report"
                element={
                  <AuthSocketProvider>
                    <MainLayout>
                      <RepostsPage />
                    </MainLayout>
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/diet"
                element={
                  <AuthSocketProvider>
                    <Diet />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="/emergency"
                element={
                  <AuthSocketProvider>
                    <Emergency />
                  </AuthSocketProvider>
                }
              />
              <Route
                path="*"
                element={
                  <AuthSocketProvider>
                    <NotFound />
                  </AuthSocketProvider>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);

export default App;
