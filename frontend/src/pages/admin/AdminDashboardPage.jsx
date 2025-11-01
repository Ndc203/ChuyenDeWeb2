import React from "react";
import {
  LayoutGrid,
  ShoppingCart,
  Users,
  BarChart3,
  Activity,
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboardPage() {
  // Dữ liệu giả lập (có thể thay bằng dữ liệu API)
  const postsByMonth = [
    { month: "1", posts: 5 },
    { month: "2", posts: 8 },
    { month: "3", posts: 12 },
    { month: "4", posts: 9 },
    { month: "5", posts: 15 },
    { month: "6", posts: 18 },
    { month: "7", posts: 10 },
    { month: "8", posts: 20 },
    { month: "9", posts: 25 },
    { month: "10", posts: 22 },
    { month: "11", posts: 28 },
    { month: "12", posts: 30 },
  ];

  const usersByRole = [
    { name: "Admin", value: 10 },
    { name: "Người dùng", value: 90 },
  ];

  const COLORS = ["#4F46E5", "#10B981"];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 w-full p-6 space-y-6 overflow-x-hidden">
        {/* Tiêu đề */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <LayoutGrid className="text-indigo-600" size={26} />
            Tổng quan hệ thống
          </h1>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<ShoppingCart size={22} />}
            label="Tổng sản phẩm"
            value="120"
            color="bg-indigo-500"
          />
          <StatCard
            icon={<Users size={22} />}
            label="Người dùng"
            value="85"
            color="bg-green-500"
          />
          <StatCard
            icon={<BarChart3 size={22} />}
            label="Bài viết"
            value="35"
            color="bg-yellow-500"
          />
          <StatCard
            icon={<Activity size={22} />}
            label="Hoạt động hôm nay"
            value="12"
            color="bg-red-500"
          />
        </div>

        {/* Biểu đồ thống kê */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Biểu đồ đường */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Bài viết theo tháng
            </h2>
            <div className="w-full h-72">
              <ResponsiveContainer>
                <LineChart data={postsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="posts"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Biểu đồ tròn */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Tỉ lệ người dùng theo vai trò
            </h2>
            <div className="w-full h-72 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usersByRole}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {usersByRole.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ✅ Component thẻ thống kê nhỏ
function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
      <div
        className={`p-3 rounded-xl text-white flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
