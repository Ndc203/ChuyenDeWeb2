import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../layout/AdminSidebar";
import { ShieldCheck, ShieldX } from 'lucide-react';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// Badge for user role
const RoleBadge = ({ role }) => {
  const roleStyles = {
    admin: "bg-red-100 text-red-700",
    customer: "bg-blue-100 text-blue-700",
    default: "bg-gray-100 text-gray-700",
  };
  const style = roleStyles[role] || roleStyles.default;
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
      {role}
    </span>
  );
};

// Badge for user status
const StatusBadge = ({ status }) => {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
        isActive
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {isActive ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch users.");
        console.error("Fetch users error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [API_URL]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b">
          <div className="w-full px-10 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-semibold">Quản lý Người dùng</h1>
              <p className="text-xs text-slate-500 mt-1">Tổng cộng {users.length} tài khoản</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full px-10 pb-10">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm mt-6">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Tên người dùng</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Vai trò</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : (
                  users.map((user, i) => (
                    <tr key={user.user_id} className={i % 2 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-4 py-3 font-medium text-slate-500">#{user.user_id}</td>
                      <td className="px-4 py-3 font-semibold">{user.username}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(user.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
