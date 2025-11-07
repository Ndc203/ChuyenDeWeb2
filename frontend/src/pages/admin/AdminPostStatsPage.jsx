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
import { BarChart2, PieChart as PieChartIcon } from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

export default function AdminPostStatisticsPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/posts/statistics").then((res) => {
      setStats(res.data);
    });
  }, []);

  if (!stats)
    return (
      <div className="min-h-screen flex bg-slate-50 text-slate-800">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Đang tải thống kê...</p>
        </main>
      </div>
    );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b">
          <div className="w-full px-10 py-4 flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-semibold">
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
              <p className="text-2xl font-bold mt-1">{stats.total_posts}</p>
            </div>
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <h3 className="text-sm text-slate-500">Bài viết nổi bật</h3>
              <p className="text-2xl font-bold mt-1">
                {stats.trending_posts}
              </p>
            </div>
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <h3 className="text-sm text-slate-500">
                Bài viết mới trong tháng
              </h3>
              <p className="text-2xl font-bold mt-1">
                {stats.new_posts_this_month}
              </p>
            </div>
          </div>

          {/* Biểu đồ trạng thái */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <PieChartIcon className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold">Trạng thái bài viết</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={stats.posts_by_status}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
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

          {/* Biểu đồ danh mục */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold">Bài viết theo danh mục</h2>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.posts_by_category}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
