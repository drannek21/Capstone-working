import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserNavbar from './UserNavbar';
import Profile from './Profile';

export default function Userui() {
  return (
    <div>
      <UserNavbar />
      <Routes>
        <Route path="/" element={<Profile />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}
