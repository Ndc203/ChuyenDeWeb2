import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div style={{
      width: '200px',
      backgroundColor: '#f0f0f0',
      padding: '20px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
    }}>
      <h2>Menu</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li style={{ marginBottom: '10px' }}>
          <h3 style={{ margin: '0 0 5px 0' }}>Người dùng</h3>
          <ul style={{ listStyleType: 'none', paddingLeft: '15px' }}>
            <li style={{ marginBottom: '5px' }}>
              <Link to="/admin/users" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Danh Sách người dùng</Link>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <Link to="/admin/activity-history" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Lịch sử hoạt động</Link>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <Link to="/admin/user-statistics" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Thống kê người dùng</Link>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <Link to="/admin/permissions" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Phân Quyền</Link>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <Link to="/admin/profile" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Trang cá nhân</Link>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;