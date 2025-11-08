import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';

const AdminLayout = () => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', padding: '20px', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
