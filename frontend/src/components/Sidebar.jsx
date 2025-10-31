import React from 'react';

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
              <a href="/users/list" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Danh Sách người dùng</a>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <a href="/users/activity-history" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Lịch sử hoạt động</a>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <a href="/users/statistics" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Thống kê người dùng</a>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <a href="/users/permissions" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Phân Quyền</a>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <a href="/users/profile" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Trang cá nhân</a>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;