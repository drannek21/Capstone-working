import React from 'react';
import SuperAdminSideBar from './SuperAdminSideBar';
import './SuperAdminDashboard.css';
import SDashboard from './SDashboard';

const SuperAdminDashboard = () => {
  return (
    <div className="super-admin-dashboard">
      <SuperAdminSideBar />
      <div className="super-admin-content">
        <SDashboard />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;