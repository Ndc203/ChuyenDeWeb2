import React, { useEffect, useState } from "react";
import {
  LayoutGrid,
  ShoppingCart,
  Users,
  BarChart3,
  Activity,
  Loader2
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";
import axiosClient from "../../api/axiosClient"; 
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

// Màu sắc cho biểu đồ tròn (Thêm nhiều màu để dự phòng nếu có nhiều role)
const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get('/dashboard')
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error("Lỗi tải thống kê:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex bg-slate-50 text-slate-800">
        <AdminSidebar />
        <main className="flex-1 w-full p-6 flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </main>
      </div>
    );
  }

  // Nếu API lỗi hoặc null, dùng object rỗng để tránh crash
  const data = stats || {};
  const pieData = data.users_by_role || []; 
  const lineData = data.posts_by_month || [];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />

      <main className="flex-1 w-full p-6 space-y-6 overflow-x-hidden">
        {/* Tiêu đề */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2 text-slate-800">
            <LayoutGrid className="text-indigo-600" size={26} />
            Tổng quan hệ thống
          </h1>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<ShoppingCart size={22} />}
            label="Tổng sản phẩm"
            value={data.total_products ?? 0}
            color="bg-indigo-500"
          />
          <StatCard
            icon={<Users size={22} />}
            label="Tổng người dùng"
            value={data.total_users ?? 0}
            color="bg-green-500"
          />
          <StatCard
            icon={<BarChart3 size={22} />}
            label="Bài viết/Tin tức"
            value={data.total_posts ?? 0}
            color="bg-yellow-500"
          />
          <StatCard
            icon={<Activity size={22} />}
            label="Hoạt động hôm nay"
            value={data.active_today ?? 0}
            color="bg-red-500"
          />
        </div>

        {/* Khu vực Biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          
          {/* 1. Biểu đồ đường */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-700">
              Hoạt động theo tháng
            </h2>
            <div className="w-full h-72">
              {lineData.length > 0 ? (
                <ResponsiveContainer>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} dy={10} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Line type="monotone" dataKey="posts" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
              )}
            </div>
          </div>

          {/* 2. Biểu đồ tròn (Pie Chart) - Dữ liệu thực */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-700">
              Tỷ lệ người dùng theo vai trò
            </h2>
            <div className="w-full h-72 flex justify-center relative">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData} // Dữ liệu lấy từ API
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value" // Key chứa số lượng (Backend trả về 'value')
                      nameKey="name"  // Key chứa tên role (Backend trả về 'name')
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]} // Tự động xoay vòng màu
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                    Chưa có user nào
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`p-3 rounded-xl text-white flex items-center justify-center shadow-sm ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}