import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../layout/AdminSidebar';
import { ArrowLeft, Search, Download } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';


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

const mapStatusToLabel = (status) => {
  if (!status) return 'N/A';
  switch (status) {
    case 'success': return 'Thành công';
    case 'failed': return 'Thất bại';
    case 'blocked': return 'Bị chặn';
    default: return status;
  }
};

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return 'N/A';
  try {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch (e) {
    return dateTimeStr;
  }
};

export default function AdminActivityHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setLoading(true);
    try {
      const resp = await axios.get(`${API_URL}/api/activity-logs`, { headers: { Authorization: `Bearer ${token}` } });
      // Laravel pagination returns data in resp.data.data
      const data = resp.data.data ?? resp.data;
      setLogs(data.map(l => ({
        id: l.id,
        user: {
          name: l.username || l.user?.username || 'N/A',
          email: l.user?.email || '',
          avatar: `https://i.pravatar.cc/40?u=${l.user?.email || l.username || l.id}`,
        },
        loginTime: formatDateTime(l.created_at),
        // Per request: always show "Laptop" for device and location in UI
        device: 'Laptop',
        location: 'Tp.HCM',
        ipAddress: l.ip_address || 'N/A',
        status: mapStatusToLabel(l.status),
        responseTime: l.response_time_ms ? `${l.response_time_ms}ms` : 'N/A',
      })));
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return logs
      .filter(item => {
        if (statusFilter === 'Tất cả') return true;
        return item.status === statusFilter;
      })
      .filter(item => {
        const term = searchTerm.toLowerCase();
        return (
          item.user.name.toLowerCase().includes(term) ||
          (item.user.email && item.user.email.toLowerCase().includes(term)) ||
          item.ipAddress.includes(term)
        );
      });
  }, [logs, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: logs.length,
    success: logs.filter(i => i.status === 'Thành công').length,
    failed: logs.filter(i => i.status === 'Thất bại').length,
    blocked: logs.filter(i => i.status === 'Bị chặn').length,
  }), [logs]);

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