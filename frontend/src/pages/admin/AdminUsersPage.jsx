import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AdminSidebar from "../layout/AdminSidebar";
import { Plus, BarChart2, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';

const enhanceUserData = (user) => ({
  ...user,
  avatar: `https://i.pravatar.cc/40?u=${user.email}`,
  last_login: user.last_login || new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 14).toISOString(),
});

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const RoleBadge = ({ role }) => {
  if (!role) return null;
  const roleStyles = {
    admin: "bg-purple-100 text-purple-700",
    customer: "bg-blue-100 text-blue-700",
    editor: "bg-orange-100 text-orange-700",
    default: "bg-gray-100 text-gray-700",
  };
  const style = roleStyles[role] || roleStyles.default;
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${style}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>;
};

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const isHoatDong = status === "Hoạt động";
  const isBiCam = status === "Bị cấm";
  let style = "bg-gray-100 text-gray-700";
  if (isHoatDong) style = "bg-green-100 text-green-700";
  if (isBiCam) style = "bg-red-100 text-red-700";
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isHoatDong ? 'bg-green-600' : isBiCam ? 'bg-red-600' : 'bg-gray-600'}`}></span>
      {status}
    </span>
  );
};

const AddUserModal = ({ onClose, onSave }) => {
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'customer', status: 'Hoạt động' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setNewUser({ ...newUser, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        if (!newUser.username || !newUser.email || !newUser.password) {
            setError('Tên, email, và mật khẩu là bắt buộc.');
            return;
        }
        setError('');
        onSave(newUser);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Thêm người dùng mới</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={24} /></button>
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="space-y-4">
                    <input name="username" value={newUser.username} onChange={handleChange} placeholder="Tên người dùng" className="w-full border-slate-300 rounded-md" />
                    <input name="email" type="email" value={newUser.email} onChange={handleChange} placeholder="Email" className="w-full border-slate-300 rounded-md" />
                    <input name="password" type="password" value={newUser.password} onChange={handleChange} placeholder="Mật khẩu" className="w-full border-slate-300 rounded-md" />
                    <select name="role" value={newUser.role} onChange={handleChange} className="w-full border-slate-300 rounded-md">
                        <option value="customer">Người dùng</option>
                        <option value="editor">Điều hành viên</option>
                        <option value="admin">Quản trị viên</option>
                    </select>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-md hover:bg-slate-50">Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Tạo người dùng</button>
                </div>
            </div>
        </div>
    );
};

const EditUserModal = ({ user, onClose, onSave }) => {
    const [role, setRole] = useState(user.role);
    const [status, setStatus] = useState(user.status);

    const handleSave = () => onSave(user.user_id, { role, status });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Chỉnh sửa người dùng</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                    <input type="text" disabled value={user.username} className="mt-1 w-full border-slate-300 rounded-md bg-slate-100" />
                    <input type="text" disabled value={user.email} className="mt-1 w-full border-slate-300 rounded-md bg-slate-100" />
                    <select value={role} onChange={e => setRole(e.target.value)} className="mt-1 w-full border-slate-300 rounded-md">
                        <option value="customer">Người dùng</option><option value="editor">Điều hành viên</option><option value="admin">Quản trị viên</option>
                    </select>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 w-full border-slate-300 rounded-md">
                        <option value="Hoạt động">Hoạt động</option><option value="Không hoạt động">Không hoạt động</option><option value="Bị cấm">Bị cấm</option>
                    </select>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-md hover:bg-slate-50">Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Lưu thay đổi</button>
                </div>
            </div>
        </div>
    );
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [searchParams] = useSearchParams();
  const initialRoleFilter = searchParams.get('role') || "all";

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(8);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const fetchUsers = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) { setError("Authentication token not found."); setLoading(false); return; }
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      // Removed mock status and role data. Now it relies on API data.
      setUsers(response.data.map(enhanceUserData));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [API_URL]);

  const handleDelete = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này không?")) {
      const token = localStorage.getItem("authToken");
      try {
        await axios.delete(`${API_URL}/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(users.filter(user => user.user_id !== userId));
        alert("Người dùng đã được xóa thành công!");
      } catch (err) { alert("Lỗi khi xóa người dùng: " + (err.response?.data?.message || err.message)); }
    }
  };

  const handleOpenEditModal = (user) => { setEditingUser(user); setIsEditModalOpen(true); };
  const handleCloseEditModal = () => { setEditingUser(null); setIsEditModalOpen(false); };

  const handleSaveUser = async (userId, updatedData) => {
    const token = localStorage.getItem("authToken");
    try {
        await axios.put(`${API_URL}/api/users/${userId}`, updatedData, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(users.map(user => user.user_id === userId ? { ...user, ...updatedData } : user));
        alert("Cập nhật người dùng thành công!");
        handleCloseEditModal();
    } catch (err) { alert("Lỗi khi cập nhật người dùng: " + (err.response?.data?.message || err.message)); }
  };

  const handleAddUser = async (newUserData) => {
    const token = localStorage.getItem("authToken");
    try {
        await axios.post(`${API_URL}/api/users`, newUserData, { headers: { Authorization: `Bearer ${token}` } });
        // Instead of optimistically updating, re-fetch the entire list for consistency.
        await fetchUsers(); 
        alert("Thêm người dùng thành công!");
        setIsAddModalOpen(false);
    } catch (err) {
        alert("Lỗi khi thêm người dùng: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredUsers = useMemo(() => users.filter(user => 
    (roleFilter === "all" || user.role === roleFilter) &&
    (statusFilter === "all" || user.status === statusFilter) &&
    (searchTerm === "" || user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [users, searchTerm, roleFilter, statusFilter]);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedUsers(currentUsers.map(u => u.user_id));
    else setSelectedUsers([]);
  };

  const handleSelectUser = (e, userId) => {
    if (e.target.checked) setSelectedUsers(prev => [...prev, userId]);
    else setSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0">
        <div className="w-full px-6 md:px-10 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Quản lý người dùng</h1>
              <p className="text-sm text-slate-500 mt-1">Quản lý danh sách người dùng và phân quyền.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin/user-statistics" className="flex items-center gap-2 text-sm bg-white border border-slate-300 rounded-md px-3 py-2 hover:bg-slate-50"><BarChart2 size={16} /> Thống kê</Link>
              <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-sm bg-indigo-600 text-white rounded-md px-3 py-2 hover:bg-indigo-700"><Plus size={16} /> Thêm người dùng</button>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="text" placeholder="Tìm theo tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border-slate-300 rounded-md pl-10" />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full border-slate-300 rounded-md">
                <option value="all">Tất cả vai trò</option><option value="admin">Quản trị viên</option><option value="editor">Điều hành viên</option><option value="customer">Người dùng</option>
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full border-slate-300 rounded-md">
                <option value="all">Tất cả trạng thái</option><option value="Hoạt động">Hoạt động</option><option value="Không hoạt động">Không hoạt động</option><option value="Bị cấm">Bị cấm</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden shadow-sm rounded-lg bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0} /></th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Người dùng</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Vai trò</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Trạng thái</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Đăng nhập cuối</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Ngày tạo</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={7} className="p-6 text-center text-red-500">{error}</td></tr>
                  ) : currentUsers.map(user => (
                    <tr key={user.user_id} className="hover:bg-slate-50">
                      <td className="p-4"><input type="checkbox" checked={selectedUsers.includes(user.user_id)} onChange={e => handleSelectUser(e, user.user_id)} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} alt={user.username} className="h-10 w-10 rounded-full object-cover" />
                          <div><p className="font-semibold text-slate-800">{user.username}</p><p className="text-slate-500">{user.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                      <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(user.last_login)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                            <Link to={`/admin/profile/${user.user_id}`} className="hover:text-indigo-600"><Eye size={16} /></Link>
                            <button onClick={() => handleOpenEditModal(user)} className="hover:text-indigo-600"><Pencil size={16} /></button>
                            <button onClick={() => handleDelete(user.user_id)} className="hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm text-slate-600">Hiển thị {indexOfFirstUser + 1} đến {Math.min(indexOfLastUser, filteredUsers.length)} trong tổng số {filteredUsers.length} người dùng</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={20} /></button>
                <span className="text-sm font-medium">{currentPage} / {totalPages > 0 ? totalPages : 1}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={20} /></button>
              </div>
            </div>
          </div>
        </div>
        {isEditModalOpen && <EditUserModal user={editingUser} onClose={handleCloseEditModal} onSave={handleSaveUser} />}
        {isAddModalOpen && <AddUserModal onClose={() => setIsAddModalOpen(false)} onSave={handleAddUser} />}
      </main>
    </div>
  );
}