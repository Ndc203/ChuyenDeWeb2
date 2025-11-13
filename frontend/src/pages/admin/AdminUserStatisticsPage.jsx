import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import AdminSidebar from '../layout/AdminSidebar';
import { ArrowLeft, Loader, AlertTriangle } from 'lucide-react';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = ({ title, value, growth }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      {growth !== undefined && (
        <span className={`ml-2 flex items-baseline text-sm font-semibold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {growth >= 0 ? '+' : ''}
          {growth}%
        </span>
      )}
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-32">
    <Loader className="animate-spin text-slate-500" size={40} />
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow" role="alert">
    <div className="flex">
      <div className="py-1"><AlertTriangle className="mr-3" /></div>
      <div>
        <p className="font-bold">Đã xảy ra lỗi</p>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  </div>
);

export default function AdminUserStatisticsPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    customerUsers: 0,
  });

  const [monthlyChartData, setMonthlyChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const statsPromise = axios.get('/api/user-statistics');
        const monthlyPromise = axios.get('/api/monthly-user-statistics');

        const [statsResponse, monthlyResponse] = await Promise.all([statsPromise, monthlyPromise]);

        // Process general stats
        setStats(statsResponse.data);

        // Process monthly stats for chart
        const monthlyData = monthlyResponse.data;
        const labels = monthlyData.map(item => `Tháng ${item.month}/${item.year}`);
        const newUsersData = monthlyData.map(item => item.newUsers);

        setMonthlyChartData({
          labels: labels,
          datasets: [
            {
              label: 'Người dùng mới',
              data: newUsersData,
              backgroundColor: '#82ca9d',
              borderColor: '#82ca9d',
              borderWidth: 1,
            },
          ],
        });

      } catch (err) {
        console.error('Error fetching statistics data:', err);
        setError('Không thể tải dữ liệu từ máy chủ. Vui lòng đảm bảo backend đang chạy và API đang hoạt động. Lỗi: ' + (err.response?.data?.message || err.message));
      }
      setLoading(false);
    };

    fetchAllData();
  }, []);

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: true,
          color: 'rgba(203, 213, 225, 0.5)',
          borderDash: [3, 3],
        },
      },
      y: {
        stacked: false,
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0">
        <div className="w-full px-6 md:px-10 py-4">
          {/* 1. Header and Navigation */}
          <div className="mb-8">
            <Link to="/admin/users" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
              <ArrowLeft size={16} className="mr-1" />
              Quay lại danh sách
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Thống kê người dùng</h1>
            <p className="text-sm text-slate-500 mt-1">Theo dõi số lượng và hoạt động người dùng theo thời gian.</p>
          </div>

          {error && <div className="mb-8"><ErrorDisplay message={error} /></div>}

          {/* 2. Overview Metrics */}
          <div className="mb-8">
            {loading ? <LoadingSpinner /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Tổng người dùng" value={stats.totalUsers} />
                <StatCard title="Người dùng hoạt động" value={stats.activeUsers} />
                <StatCard title="Người dùng bị cấm" value={stats.inactiveUsers} />
                <StatCard title="Quản trị viên" value={stats.adminUsers} />
                <StatCard title="Khách hàng" value={stats.customerUsers} />
              </div>
            )}
          </div>

          {/* 3. Chart */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Biểu đồ người dùng mới theo tháng (12 tháng gần nhất)</h2>
            {loading ? <LoadingSpinner /> : (
              <div className="relative h-[300px]">
                <Bar options={chartOptions} data={monthlyChartData} />
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
