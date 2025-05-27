import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Login from "@/auth/Login";
import Register from "@/auth/Register";
import DocRegister from "@/auth/DocRegister";
import Profile from "@/pages/Profile";
import HealthTracker from "@/pages/HealthTracker";
import Symptoms from "@/pages/Symptoms";
import Medicine from "@/pages/Medicine";
import ChatCall from "@/pages/chat/VideoChat";
import AiDoctor from "@/pages/AiDoctor";
import Consultation from "@/pages/Consultation";
import Ayushman from "@/pages/Ayushman";
import NotFound from "@/pages/NotFound";
import Emergency from "@/pages/Emergency";
import ConsultationBooking from "@/pages/ConsultationBooking";
import MyBookings from "@/pages/MyBookings";
import HealthFeedPage from "@/pages/HealthFeedPage";
import RepostsPage from "@/pages/Reposts";
import Diet from "@/pages/Diet";
import CalorieCalculator from "@/pages/CalorieCalculator";
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/doc-register" element={<DocRegister />} />
      <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/health-tracker" element={<HealthTracker />} />
      <Route path="/consultation" element={<Consultation />} />
      <Route path="/symptoms" element={<Symptoms />} />
      <Route path="/medicine" element={<Medicine />} />
      <Route path="/chat" element={<ChatCall />} />
      <Route path="/ai-doctor" element={<AiDoctor />} />
      <Route path="/ayushman" element={<Ayushman />} />
      <Route path="/health-feed" element={<HealthFeedPage />} />
      <Route path="/reposts" element={<RepostsPage />} />
      <Route path="/consultation/:doctorId" element={<ConsultationBooking />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/diet" element={<Diet />} />
      <Route path="/calorie-calculator" element={<CalorieCalculator />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/emergency" element={<Emergency />} />
    </Routes>
  );
};

export default AppRoutes; 