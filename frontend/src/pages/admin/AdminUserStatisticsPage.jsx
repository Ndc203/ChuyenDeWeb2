
import React, { useState } from 'react';
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
import { ArrowLeft } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- DUMMY DATA ---
const overviewMetrics = {
  totalUsers: 769,
  activeUsers: 512,
  newUsersThisMonth: 203,
  growth: 30.1,
};

const monthlyData = [
  { month: 'Tháng 4', newUsers: 50, activeUsers: 300, totalUsers: 566, growth: 5.2 },
  { month: 'Tháng 5', newUsers: 75, activeUsers: 350, totalUsers: 641, growth: 13.3 },
  { month: 'Tháng 6', newUsers: 60, activeUsers: 400, totalUsers: 701, growth: 9.4 },
  { month: 'Tháng 7', newUsers: 80, activeUsers: 420, totalUsers: 781, growth: 11.4 },
  { month: 'Tháng 8', newUsers: 95, activeUsers: 450, totalUsers: 876, growth: 12.2 },
  { month: 'Tháng 9', newUsers: 110, activeUsers: 480, totalUsers: 986, growth: 12.6 },
  { month: 'Tháng 10', newUsers: 203, activeUsers: 512, totalUsers: 1189, growth: 20.6 },
];
// --- END DUMMY DATA ---

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

export default function AdminUserStatisticsPage() {
  const [timeRange, setTimeRange] = useState('7');

  const filteredData = monthlyData.slice(-parseInt(timeRange));

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

  const chartData = {
    labels: filteredData.map(d => d.month),
    datasets: [
      {
        label: 'Tổng người dùng',
        data: filteredData.map(d => d.totalUsers),
        backgroundColor: '#8884d8',
        borderColor: '#8884d8',
        borderWidth: 1,
      },
      {
        label: 'Người dùng mới',
        data: filteredData.map(d => d.newUsers),
        backgroundColor: '#82ca9d',
        borderColor: '#82ca9d',
        borderWidth: 1,
      },
    ],
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

          {/* 2. Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Tổng người dùng" value={overviewMetrics.totalUsers} />
            <StatCard title="Người dùng hoạt động" value={overviewMetrics.activeUsers} />
            <StatCard title="Người dùng mới tháng này" value={overviewMetrics.newUsersThisMonth} />
            <StatCard title="Tăng trưởng" value={overviewMetrics.growth} growth={overviewMetrics.growth} />
          </div>

          {/* 3. Chart */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Biểu đồ người dùng theo tháng</h2>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="3">3 tháng gần nhất</option>
                <option value="7">7 tháng gần nhất</option>
                <option value="12">1 năm</option>
              </select>
            </div>
            <div className="relative h-[300px]">
              <Bar options={chartOptions} data={chartData} />
            </div>
          </div>

          {/* 4. Data Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Chi tiết theo tháng</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tháng</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Người dùng mới</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Người dùng hoạt động</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng người dùng</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tăng trưởng</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredData.map((item) => (
                    <tr key={item.month}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.newUsers}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.activeUsers}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.totalUsers}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.growth >= 0 ? '+' : ''}{item.growth}%
                        </span>
                      </td>
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
