import { BrowserRouter, Route, Routes } from "react-router-dom";
import "@/index.css";
import Login from "@/pages/auth/Login";
import UserRegister from "@/pages/auth/UserRegister";
import DocRegister from "@/pages/auth/DocRegister";
import Index from "@/pages/dashboard";
import { AuthProvider } from "@/provider/AuthProvider";
import AiDoctor from "./pages/chat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/user-register" element={<UserRegister />} />
        <Route path="/doc-register" element={<DocRegister />} />

        {/* Auth Protected Routes do not change this section */}
        <Route
          path="/"
          element={
            <AuthProvider>
              <Index />
            </AuthProvider>
          }
        />
        <Route
          path="/chat"
          element={
            <AuthProvider>
              <AiDoctor />
            </AuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
