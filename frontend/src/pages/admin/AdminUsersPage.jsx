import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AdminSidebar from "../layout/AdminSidebar";
import { Plus, BarChart2, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import axiosClient from "../../api/axiosClient"; // Import axiosClient

// --- Helper Functions ---

// Map backend status values to localized labels for UI
const mapServerStatusToLocal = (status) => {
  if (!status) return 'Không hoạt động';
  if (status === 'active') return 'Hoạt động';
  if (status === 'banned') return 'Bị cấm';
  return status;
};

// Map localized UI status back to backend expected values
const mapLocalStatusToServer = (status) => {
  if (!status) return null;
  if (status === 'Hoạt động') return 'active';
  if (status === 'Bị cấm') return 'banned';
  if (status === 'Không hoạt động') return 'banned';
  return status;
};

// Role mapping
const mapRoleToServer = (role) => {
  if (!role) return null;
  return role; 
};

// enhanceUserData: accept currentUserId to mark only the logged-in account as 'Hoạt động'.
const enhanceUserData = (user, currentUserId = null) => {
  const avatar = user.avatar || `https://i.pravatar.cc/40?u=${user.email}`;
  const last_login = user.last_login || new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 14).toISOString();

  let localizedStatus;
  if (currentUserId && user.user_id === currentUserId) {
    localizedStatus = 'Hoạt động';
  } else {
    if (user.status === 'banned') localizedStatus = 'Bị cấm';
    else localizedStatus = 'Không hoạt động'; // Mặc định nếu không phải mình và không bị ban
  }

  return {
    ...user,
    avatar,
    last_login,
    status: localizedStatus,
  };
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// --- Components ---

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
        const username = newUser.username.replace(/\u3000/g, ' ').trim();
        const email = newUser.email.trim();
        const password = newUser.password.trim();

        if (!username || !email || !password) {
            setError('Ten, email, va mat khau la bat buoc.');
            return;
        }
        setError('');
        onSave({
            ...newUser,
            username,
            email,
            password,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center px-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Thêm người dùng mới</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={24} /></button>
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="space-y-4">
                    <input name="username" value={newUser.username} onChange={handleChange} placeholder="Tên người dùng" className="w-full border-slate-300 rounded-md p-2 border" />
                    <input name="email" type="email" value={newUser.email} onChange={handleChange} placeholder="Email" className="w-full border-slate-300 rounded-md p-2 border" />
                    <input name="password" type="password" value={newUser.password} onChange={handleChange} placeholder="Mật khẩu" className="w-full border-slate-300 rounded-md p-2 border" />
                    <select name="role" value={newUser.role} onChange={handleChange} className="w-full border-slate-300 rounded-md p-2 border">
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

    const handleSave = () => onSave(user.user_id, { role, status, lock_version: user.updated_at });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center px-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Chỉnh sửa người dùng</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                    <input type="text" disabled value={user.username} className="mt-1 w-full border-slate-300 rounded-md bg-slate-100 p-2 border" />
                    <input type="text" disabled value={user.email} className="mt-1 w-full border-slate-300 rounded-md bg-slate-100 p-2 border" />
                    <select value={role} onChange={e => setRole(e.target.value)} className="mt-1 w-full border-slate-300 rounded-md p-2 border">
                        <option value="customer">Người dùng</option><option value="editor">Điều hành viên</option><option value="admin">Quản trị viên</option>
                    </select>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 w-full border-slate-300 rounded-md p-2 border">
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

// --- Main Page ---

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
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

  // === 1. Fetch Users (Dùng axiosClient) ===
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Gọi API lấy thông tin user hiện tại để so sánh ID
      const meResp = await axiosClient.get('/user');
      setCurrentUserId(meResp.data.user_id);

      // Gọi API lấy danh sách user
      const response = await axiosClient.get('/users');
      
      // Xử lý dữ liệu
      setUsers(response.data.map(u => enhanceUserData(u, meResp.data.user_id)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // === 2. Delete User ===
  const handleDelete = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này không?")) {
      try {
        await axiosClient.delete(`/users/${userId}`);
        setUsers(users.filter(user => user.user_id !== userId));
        alert("Người dùng đã được xóa thành công!");
      } catch (err) { 
        alert("Lỗi khi xóa người dùng: " + (err.response?.data?.message || err.message)); 
      }
    }
  };

  const handleOpenEditModal = (user) => { setEditingUser(user); setIsEditModalOpen(true); };
  const handleCloseEditModal = () => { setEditingUser(null); setIsEditModalOpen(false); };

  // === 3. Save User (Update) ===
  const handleSaveUser = async (userId, updatedData) => {
    try {
        const payload = {
            status: mapLocalStatusToServer(updatedData.status),
            role: mapRoleToServer(updatedData.role),
        };

        if (updatedData.lock_version) {
            payload.lock_version = updatedData.lock_version;
        }
        
        await axiosClient.put(`/users/${userId}`, payload);
        
        await fetchUsers();
        alert("Cập nhật người dùng thành công!");
        handleCloseEditModal();
    } catch (err) { 
        if (err.response?.status === 409) {
            alert(err.response?.data?.message || "Thong tin da thay doi. Vui long tai lai danh sach truoc khi luu.");
        } else {
            alert("Lỗi khi cập nhật người dùng: " + (err.response?.data?.message || err.message));
        }
    }
  };

  // === 4. Add User (Create) ===
  const handleAddUser = async (newUserData) => {
    try {
        const payload = {
          username: newUserData.username.replace(/\u3000/g, ' ').trim(),
          email: newUserData.email.trim(),
          password: newUserData.password.trim(),
          role: mapRoleToServer(newUserData.role),
          status: mapLocalStatusToServer(newUserData.status),
        };
        
        await axiosClient.post('/users', payload);
        
        await fetchUsers(); 
        alert("Thêm người dùng thành công!");
        setIsAddModalOpen(false);
    } catch (err) {
        alert("Lỗi khi thêm người dùng: " + (err.response?.data?.message || err.message));
    }
  };

  // === Filter Logic ===
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
          {/* Header */}
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

          {/* Filter Bar */}
          <div className="p-4 bg-white rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="text" placeholder="Tìm theo tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border-slate-300 rounded-md pl-10 p-2 border" />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full border-slate-300 rounded-md p-2 border">
                <option value="all">Tất cả vai trò</option><option value="admin">Quản trị viên</option><option value="editor">Điều hành viên</option><option value="customer">Người dùng</option>
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full border-slate-300 rounded-md p-2 border">
                <option value="all">Tất cả trạng thái</option><option value="Hoạt động">Hoạt động</option><option value="Không hoạt động">Không hoạt động</option><option value="Bị cấm">Bị cấm</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden shadow-sm rounded-lg bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600 border-b border-slate-300">
                    <th className="p-4 w-12 border-r border-slate-300"><input type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0} /></th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-300">Người dùng</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-300">Vai trò</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-300">Trạng thái</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-300">Đăng nhập cuối</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-300">Ngày tạo</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={7} className="p-6 text-center text-red-500">{error}</td></tr>
                  ) : currentUsers.map(user => (
                    <tr key={user.user_id} className="hover:bg-slate-50 border-b border-slate-200">
                      <td className="p-4 border-r border-slate-200"><input type="checkbox" checked={selectedUsers.includes(user.user_id)} onChange={e => handleSelectUser(e, user.user_id)} /></td>
                      <td className="px-4 py-3 border-r border-slate-200">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} alt={user.username} className="h-10 w-10 rounded-full object-cover" />
                          <div><p className="font-semibold text-slate-800">{user.username}</p><p className="text-slate-500">{user.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200"><RoleBadge role={user.role} /></td>
                      <td className="px-4 py-3 border-r border-slate-200"><StatusBadge status={user.status} /></td>
                      <td className="px-4 py-3 text-slate-500 border-r border-slate-200">{formatDate(user.last_login)}</td>
                      <td className="px-4 py-3 text-slate-500 border-r border-slate-200">{formatDate(user.created_at)}</td>
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
            {/* Pagination */}
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
