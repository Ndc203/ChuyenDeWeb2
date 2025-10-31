import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../layout/AdminSidebar';
import { ArrowLeft, Search, Download } from 'lucide-react';

// --- DUMMY DATA ---
const loginHistoryData = [
  {
    id: 1,
    user: { name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', avatar: 'https://i.pravatar.cc/40?u=1' },
    loginTime: '2025-10-31 09:15:30',
    device: 'Windows Desktop',
    location: 'Hồ Chí Minh, Vietnam',
    ipAddress: '118.70.123.45',
    status: 'Thành công',
    responseTime: '350ms',
  },
  {
    id: 2,
    user: { name: 'Trần Thị B', email: 'tranthib@example.com', avatar: 'https://i.pravatar.cc/40?u=2' },
    loginTime: '2025-10-31 08:45:10',
    device: 'iPhone 15 Pro',
    location: 'Hà Nội, Vietnam',
    ipAddress: '27.72.98.110',
    status: 'Thất bại',
    responseTime: '1200ms',
  },
  {
    id: 3,
    user: { name: 'Lê Văn C', email: 'levanc@example.com', avatar: 'https://i.pravatar.cc/40?u=3' },
    loginTime: '2025-10-30 22:10:05',
    device: 'Macbook Pro',
    location: 'Đà Nẵng, Vietnam',
    ipAddress: '14.225.19.87',
    status: 'Thành công',
    responseTime: '420ms',
  },
    {
    id: 4,
    user: { name: 'Phạm Thị D', email: 'phamthid@example.com', avatar: 'https://i.pravatar.cc/40?u=4' },
    loginTime: '2025-10-30 19:30:15',
    device: 'Android Phone',
    location: 'Hồ Chí Minh, Vietnam',
    ipAddress: '113.161.78.54',
    status: 'Bị chặn',
    responseTime: 'N/A',
  },
  {
    id: 5,
    user: { name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', avatar: 'https://i.pravatar.cc/40?u=1' },
    loginTime: '2025-10-30 15:05:45',
    device: 'Windows Desktop',
    location: 'Hồ Chí Minh, Vietnam',
    ipAddress: '118.70.123.45',
    status: 'Thành công',
    responseTime: '380ms',
  },
];
// --- END DUMMY DATA ---

const StatCard = ({ title, value, colorClass }) => (
  <div className={`bg-white p-5 rounded-lg shadow`}>
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <p className={`mt-2 text-3xl font-semibold ${colorClass}`}>{value}</p>
  </div>
);

const StatusPill = ({ status }) => {
  const baseStyle = "px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full";
  let specificStyle;
  switch (status) {
    case 'Thành công':
      specificStyle = 'bg-green-100 text-green-800';
      break;
    case 'Thất bại':
      specificStyle = 'bg-red-100 text-red-800';
      break;
    case 'Bị chặn':
      specificStyle = 'bg-yellow-100 text-yellow-800';
      break;
    default:
      specificStyle = 'bg-slate-100 text-slate-800';
  }
  return <span className={`${baseStyle} ${specificStyle}`}>{status}</span>;
};

export default function AdminActivityHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  const filteredData = useMemo(() => {
    return loginHistoryData
      .filter(item => {
        if (statusFilter === 'Tất cả') return true;
        return item.status === statusFilter;
      })
      .filter(item => {
        const term = searchTerm.toLowerCase();
        return (
          item.user.name.toLowerCase().includes(term) ||
          item.user.email.toLowerCase().includes(term) ||
          item.ipAddress.includes(term)
        );
      });
  }, [searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: loginHistoryData.length,
    success: loginHistoryData.filter(i => i.status === 'Thành công').length,
    failed: loginHistoryData.filter(i => i.status === 'Thất bại').length,
    blocked: loginHistoryData.filter(i => i.status === 'Bị chặn').length,
  }), [loginHistoryData]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0">
        <div className="w-full px-6 md:px-10 py-4">
          {/* 1. Header */}
          <div className="mb-8">
             <Link to="/admin/users" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
              <ArrowLeft size={16} className="mr-1" />
              Quay lại danh sách
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Lịch sử đăng nhập</h1>
            <p className="text-sm text-slate-500 mt-1">Theo dõi hoạt động đăng nhập của người dùng.</p>
          </div>

          {/* 2. Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Tổng đăng nhập" value={stats.total} colorClass="text-slate-900" />
            <StatCard title="Thành công" value={stats.success} colorClass="text-green-600" />
            <StatCard title="Thất bại" value={stats.failed} colorClass="text-red-600" />
            <StatCard title="Bị chặn" value={stats.blocked} colorClass="text-yellow-600" />
          </div>

          {/* 3. Filters and Actions */}
          <div className="mb-4 p-4 bg-white rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-3 lg:col-span-1">
                <label htmlFor="search" className="block text-sm font-medium text-slate-700">Tìm kiếm</label>
                <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-slate-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Tên, email, IP..."
                    />
                </div>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700">Trạng thái</label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option>Tất cả</option>
                  <option>Thành công</option>
                  <option>Thất bại</option>
                  <option>Bị chặn</option>
                </select>
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-slate-700">Thời gian</label>
                <select id="time" className="mt-1 block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
                  <option>7 ngày qua</option>
                  <option>Hôm nay</option>
                  <option>Tháng này</option>
                  <option>Tùy chỉnh</option>
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => alert('Chức năng xuất báo cáo đang được phát triển!')}
                  className="w-full flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Download size={16} className="mr-2" />
                  Xuất báo cáo
                </button>
              </div>
            </div>
          </div>

          {/* 4. Data Table */}
          <div className="overflow-hidden shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Người dùng</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Thời gian đăng nhập</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Thiết bị & Vị trí</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Thời gian phản hồi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredData.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full" src={item.user.avatar} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{item.user.name}</div>
                            <div className="text-sm text-slate-500">{item.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.loginTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div>{item.device}</div>
                        <div>{item.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.ipAddress}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusPill status={item.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.responseTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}