import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SuperAdminSideBar from './SuperAdminSideBar';
import SDashboard from './SDashboard';
import Applications from './Applications';
import './SuperAdminDashboard.css';
import UserManagement from './UserManagement';
const SuperAdminDashboard = () => {
  return (
    <div className="super-admin-dashboard">
      <SuperAdminSideBar />
      <div className="super-admin-container">
        <div className="super-admin-content">
        <Routes caseSensitive={false}>
          <Route path="sdashboard" element={<SDashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="user-management" element={<UserManagement />} />

        </Routes>

        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
