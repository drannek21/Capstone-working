import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SuperAdminSideBar from './SuperAdminSideBar';
import SDashboard from './SDashboard';
import Applications from './Applications';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  return (
    <div className="super-admin-dashboard">
      <SuperAdminSideBar />
      <div className="super-admin-content">
        <Routes>
          <Route path="sdashboard" element={<SDashboard />} />
          <Route path="applications" element={<Applications />} />
        </Routes>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
