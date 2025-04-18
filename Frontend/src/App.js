import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import MainPage from "./mainpage/MainPage";
import Login from "./login/Login";
import ForgotPassword from "./login/ForgotPassword";
import ResetPassword from "./login/ResetPassword";
import MultiStepForm from "./user/MultiStepForm";
import AdminDashboard from "./admin/AdminDashboard";
import User from "./user/User"; // Update User import
import SuperAdminDashboard from "./superadmin/SuperAdminDashboard"; // 
import SubmissionSuccess from "./user/SubmissionSuccess"; // Add SubmissionSuccess import
import Profile from "./user/Profile"; // Add Profile import
import ProtectedRoute from "./components/ProtectedRoute";
import NotAuthorized from "./pages/NotAuthorized";
import { AdminProvider } from './contexts/AdminContext';
import './App.css';


function App() {
  return (
    <AdminProvider>
      <Router>
        <MainContent />
      </Router>
    </AdminProvider>
  );
}

const MainContent = () => {
  const location = useLocation();
  const hideNavbar = [
    "/admin-dashboard", 
    "/user", 
    "/login", 
    "/signup", 
    "/form",
    "/profile",
    "/forgot-password",
    "/submission-success"
  ].some(path => location.pathname.startsWith(path)) 
  || location.pathname.startsWith("/superadmin");

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/signup" element={<MultiStepForm />} />
        <Route path="/submission-success" element={<SubmissionSuccess />} /> {/* Add SubmissionSuccess route */}
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/admin-dashboard/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <User />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/*"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/not-authorized" element={<NotAuthorized />} />
      </Routes>
    </>
  );
};

export default App;
