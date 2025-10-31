import React from 'react';
import AdminSidebar from '../layout/AdminSidebar';

export default function AdminUserStatisticsPage() {
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        <div className="w-full px-10 py-4">
          <h1 className="text-lg md:text-xl font-semibold">Thống kê người dùng</h1>
          <p className="text-sm text-slate-500 mt-1">Đây là trang thống kê người dùng.</p>
        </div>
        {/* Content for User Statistics will go here */}
      </main>
    </div>
  );
}
