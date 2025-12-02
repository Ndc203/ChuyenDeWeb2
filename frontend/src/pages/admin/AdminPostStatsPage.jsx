import React, { useEffect, useState } from "react";
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
import { BarChart2, PieChart as PieChartIcon, Loader2 } from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar";
import axiosClient from "../../api/axiosClient"; // Import axiosClient

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

export default function AdminPostStatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gọi API thông qua axiosClient
    axiosClient.get("/post-statistics")
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error("Lỗi khi tải thống kê:", err);
        // Có thể set data giả ở đây nếu muốn test giao diện khi chưa có backend
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex bg-slate-50 text-slate-800">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center flex-col text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-600" />
          <p>Đang tải thống kê...</p>
        </main>
      </div>
    );
  }

  // Nếu tải xong mà không có dữ liệu (API lỗi)
  if (!stats) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b">
          <div className="w-full px-10 py-4 flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              📊 Thống kê Bài viết
            </h1>
          </div>
        </div>

        {/* Nội dung chính */}
        <div className="w-full px-10 py-6 space-y-8">
          {/* Tổng quan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <h3 className="text-sm text-slate-500">Tổng bài viết</h3>
              <p className="text-2xl font-bold mt-1 text-indigo-600">{stats.total_posts}</p>
            </div>
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <h3 className="text-sm text-slate-500">Bài viết nổi bật</h3>
              <p className="text-2xl font-bold mt-1 text-amber-500">
                {stats.trending_posts}
              </p>
            </div>
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <h3 className="text-sm text-slate-500">
                Bài viết mới trong tháng
              </h3>
              <p className="text-2xl font-bold mt-1 text-emerald-600">
                {stats.new_posts_this_month}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Biểu đồ trạng thái (Pie Chart) */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3 border-b pb-2">
                <PieChartIcon className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold">Trạng thái bài viết</h2>
              </div>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value" // Backend phải trả về key 'value'
                      nameKey="name"  // Backend phải trả về key 'name'
                      data={stats.posts_by_status}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
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
            </div>

            {/* Biểu đồ danh mục (Bar Chart) */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3 border-b pb-2">
                <BarChart2 className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold">Bài viết theo danh mục</h2>
              </div>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.posts_by_category}>
                    <XAxis dataKey="category" tick={{fontSize: 12}} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                    <Legend />
                    <Bar name="Số lượng" dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}