// App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import MainPage from "./mainpage/MainPage";
import Login from "./login/Login";
import Signup from "./login/Signup";
import AdminDashboard from "./admin/AdminDashboard";
import Userui from "./user/Userui";
import MultiStepForm from "./user/MultiStepForm";
import SuperAdminDashboard from "./superadmin/SuperAdminDashboard"; 
import Applications from "./superadmin/Applications";
import SDashboard from "./superadmin/SDashboard"; // Import SDashboard here
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
  const hideNavbar = ["/admin-dashboard", "/userui", "/login", "/signup", "/form", "/superadmin-dashboard", "/superadmin/applications", "/superadmin/sdashboard"].includes(location.pathname);

  return (
    <>
      {/* Show Navbar on all routes except the ones in the hideNavbar list */}
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/userui" element={<Userui />} />
        <Route path="/form" element={<MultiStepForm />} />
        
        
        <Route path="/superadmin-dashboard/*" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/applications" element={<Applications />} />
        <Route path="/superadmin/sdashboard" element={<SDashboard />} />
      </Routes>
    </>
  );
};

export default App;
