import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminSideBar from "./AdminSideBar"; // Import Sidebar
import Dashboard from "./Dashboard"; // Import Dashboard
import Renewal from "./Renewal";
import SoloParent from "./SoloParent";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard"> 
      <AdminSideBar />
      <div className="main-content">
        <section className="dashboard-content">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="renewal" element={<Renewal />} />
            <Route path="solo-parent" element={<SoloParent />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;