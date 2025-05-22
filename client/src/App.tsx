import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import Login from "./auth/Login";
import UserRegister from "./auth/UserRegister";
import DocRegister from "./auth/DocRegister";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/user-register" element={<UserRegister />} />
        <Route path="/doc-register" element={<DocRegister />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
