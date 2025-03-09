import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import MainPage from "./mainpage/MainPage";
import Login from "./login/Login";
import Signup from "./login/Signup";
import AdminDashboard from "./admin/AdminDashboard";
import Userui from "./user/Userui";
import MultiStepForm from "./user/MultiStepForm";
import SuperAdminDashboard from "./superadmin/SuperAdminDashboard"; // ✅ Add this
import './App.css'; 

function App() {
  return (
    <Router>
      <MainContent />
    </Router>
  );
}

const MainContent = () => {
  const location = useLocation();
  const hideNavbar = [
    "/admin-dashboard", 
    "/userui", 
    "/login", 
    "/signup", 
    "/form"
  ].some(path => location.pathname.startsWith(path)) 
  || location.pathname.startsWith("/superadmin");

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/userui" element={<Userui />} />
        <Route path="/form" element={<MultiStepForm />} />

        {/* Superadmin Routes with Layout Wrapper */}
        <Route path="/superadmin/*" element={<SuperAdminDashboard />} />
      </Routes>
    </>
  );
};

export default App;
