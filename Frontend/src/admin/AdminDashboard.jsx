import React from "react";
import AdminSideBar from "./AdminSideBar"; // Import Sidebar
import Dashboard from "./Dashboard"; // Import Dashboard
import "./AdminDashboard.css";

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard"> 
      <AdminSideBar />
      <div className="main-content">
        <section className="dashboard-content">
          <Dashboard />
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;