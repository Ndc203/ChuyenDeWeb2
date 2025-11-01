import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  LayoutGrid,
  FileBarChart,
  TrendingUp,
  PlusCircle,
} from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";

// 🎨 Màu biểu đồ
const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

export default function AdminPostStatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // đảm bảo ResponsiveContainer render sau khi mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/post-statistics")
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching post statistics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Đang tải thống kê bài viết...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Không thể tải dữ liệu thống kê.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 w-full min-w-0 overflow-x-hidden p-6 space-y-6">
        {/* Tiêu đề */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileBarChart className="text-indigo-600" size={26} />
            Thống kê bài viết
          </h1>
        </div>

        {/* Thống kê tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={<LayoutGrid size={22} />}
            label="Tổng số bài viết"
            value={stats.total_posts}
            color="bg-indigo-500"
          />
          <StatCard
            icon={<TrendingUp size={22} />}
            label="Bài viết trending"
            value={stats.trending_posts}
            color="bg-green-500"
          />
          <StatCard
            icon={<PlusCircle size={22} />}
            label="Bài viết mới tháng này"
            value={stats.new_posts_this_month}
            color="bg-yellow-500"
          />
        </div>

        {/* Biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ tròn - trạng thái */}
          <ChartCard title="Tỷ lệ trạng thái">
            {mounted && (
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.posts_by_status}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label
                    >
                      {stats.posts_by_status.map((entry, index) => (
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
            )}
          </ChartCard>

          {/* Biểu đồ cột - danh mục */}
          <ChartCard title="Số lượng bài viết theo danh mục">
            {mounted && (
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.posts_by_category}>
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
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

// ✅ Component khung biểu đồ
function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow" style={{ minHeight: "350px" }}>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
