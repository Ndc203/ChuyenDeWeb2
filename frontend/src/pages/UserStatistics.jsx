import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, Users, UserPlus, Activity, BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const UserStatistics = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('7_months');
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    growth: 0,
    monthlyData: [],
  });

  // Mock data for demonstration. Replace with actual API calls.
  useEffect(() => {
    // Simulate API call
    const fetchStatistics = () => {
      // This is placeholder data. In a real application, you would fetch this from your Laravel API.
      const mockData = {
        totalUsers: 1250,
        activeUsers: 800,
        newUsers: 120,
        growth: 10.5,
        monthlyData: [
          { month: 'Thg 4 2023', totalUsers: 800, newUsers: 50 },
          { month: 'Thg 5 2023', totalUsers: 850, newUsers: 50 },
          { month: 'Thg 6 2023', totalUsers: 920, newUsers: 70 },
          { month: 'Thg 7 2023', totalUsers: 1000, newUsers: 80 },
          { month: 'Thg 8 2023', totalUsers: 1080, newUsers: 80 },
          { month: 'Thg 9 2023', totalUsers: 1150, newUsers: 70 },
          { month: 'Thg 10 2023', totalUsers: 1250, newUsers: 100 },
        ],
      };
      setStatistics(mockData);
    };

    fetchStatistics();
  }, [timeRange]);

  const handleGoBack = () => {
    navigate('/admin/users'); // Assuming this is the user list page
  };

  const getGrowthIcon = (value) => {
    if (value > 0) return <ArrowUp size={16} className="text-green-500" />;
    if (value < 0) return <ArrowDown size={16} className="text-red-500" />;
    return null;
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Thống kê người dùng</h1>
        <button
          onClick={handleGoBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
      <p className="text-gray-600 mb-8">Thống kê số lượng và hoạt động người dùng theo thời gian</p>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Tổng người dùng" value={statistics.totalUsers} icon={<Users size={24} />} />
        <MetricCard title="Người dùng hoạt động" value={statistics.activeUsers} icon={<Activity size={24} />} />
        <MetricCard title="Người dùng mới" value={statistics.newUsers} icon={<UserPlus size={24} />} />
        <MetricCard
          title="Tăng trưởng"
          value={`${statistics.growth > 0 ? '+' : ''}${statistics.growth.toFixed(1)}%`}
          icon={getGrowthIcon(statistics.growth)}
        />
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Biểu đồ Người dùng theo tháng</h2>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded-md px-3 py-2 text-gray-700"
          >
            <option value="3_months">3 tháng gần nhất</option>
            <option value="6_months">6 tháng gần nhất</option>
            <option value="7_months">7 tháng gần nhất</option>
            <option value="12_months">12 tháng gần nhất</option>
            <option value="custom">Tùy chỉnh</option>
          </select>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart
              data={statistics.monthlyData}
              margin={{
                top: 5, right: 30, left: 20, bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalUsers" name="Tổng người dùng" fill="#8884d8" />
              <Bar dataKey="newUsers" name="Người dùng mới" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Bảng Chi tiết theo tháng</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Tháng</th>
                <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Người dùng mới</th>
                <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Người dùng hoạt động</th>
                <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Tổng người dùng</th>
                <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Tăng trưởng (%)</th>
              </tr>
            </thead>
            <tbody>
              {statistics.monthlyData.map((data, index) => (
                <tr key={data.month} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b text-sm text-gray-700">{data.month}</td>
                  <td className="py-2 px-4 border-b text-sm text-gray-700">{data.newUsers}</td>
                  <td className="py-2 px-4 border-b text-sm text-gray-700">{/* Placeholder for active users */}</td>
                  <td className="py-2 px-4 border-b text-sm text-gray-700">{data.totalUsers}</td>
                  <td className="py-2 px-4 border-b text-sm text-gray-700">{/* Placeholder for growth */}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
    <div>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
    <div className="text-gray-400">{icon}</div>
  </div>
);

export default UserStatistics;
