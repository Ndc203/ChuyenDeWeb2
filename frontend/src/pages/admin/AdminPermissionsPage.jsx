<<<<<<< HEAD
import React, { useState } from 'react';
import { ArrowLeft, Pencil, Users, ShieldCheck } from 'lucide-react';
import RoleModal from '../../components/admin/RoleModal';
import AdminSidebar from '../layout/AdminSidebar';
import { useNavigate } from 'react-router-dom';

// Mock data for roles
const initialRoles = [
  {
    id: 1,
    name: 'Quản trị viên siêu cấp',
    description: 'Quyền cao nhất, có thể thực hiện mọi thao tác.',
    userCount: 2,
    permissionCount: 10,
    permissions: [
      'Xem người dùng',
      'Thêm người dùng',
      'Sửa người dùng',
      'Xóa người dùng',
      'Xem vai trò',
      'Thêm vai trò',
      'Sửa vai trò',
      'Xóa vai trò',
      'Xem quyền hạn',
      'Gán quyền cho vai trò',
    ],
  },
  {
    id: 2,
    name: 'Quản trị viên',
    description: 'Quản lý người dùng, xem báo cáo, phân quyền cấp dưới.',
    userCount: 5,
    permissionCount: 8,
    permissions: [
      'Xem người dùng',
      'Thêm người dùng',
      'Sửa người dùng',
      'Xóa người dùng',
      'Xem vai trò',
      'Sửa vai trò',
      'Gán quyền cho vai trò',
    ],
  },
  {
    id: 3,
    name: 'Người điều hành',
    description: 'Xem và cập nhật thông tin người dùng, không được xóa.',
    userCount: 12,
    permissionCount: 5,
    permissions: [
      'Xem người dùng',
      'Sửa người dùng',
      'Xem vai trò',
      'Xem quyền hạn',
      'Gán quyền cho vai trò',
    ],
  },
  {
    id: 4,
    name: 'Người dùng thường',
    description: 'Xem và chỉnh sửa thông tin cá nhân, không có quyền truy cập trang quản trị.',
    userCount: 50,
    permissionCount: 2,
    permissions: ['Xem thông tin cá nhân', 'Cập nhật thông tin cá nhân'],
  },
];

// Mock data for permissions
const allPermissions = [
  'Xem người dùng',
  'Thêm người dùng',
  'Sửa người dùng',
  'Xóa người dùng',
  'Xem vai trò',
  'Thêm vai trò',
  'Sửa vai trò',
  'Xóa vai trò',
  'Xem quyền hạn',
  'Gán quyền cho vai trò',
  'Xem thông tin cá nhân',
  'Cập nhật thông tin cá nhân',
];

const RoleCard = ({ role, onEdit, onView }) => (
  <div className="bg-white shadow-md rounded-lg p-6 flex flex-col justify-between cursor-pointer" onClick={() => onView(role)}>
    <div>
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-gray-800">{role.name}</h3>
        <button onClick={(e) => { e.stopPropagation(); onEdit(role); }} className="text-gray-400 hover:text-blue-500">
          <Pencil className="h-5 w-5" />
=======
import React, { useState, useEffect, Fragment } from "react";
import { Plus, Edit, Users, Shield, ArrowLeft } from "lucide-react";
import AdminSidebar from "../layout/AdminSidebar.jsx";
import axiosClient from "../../api/axiosClient";
import EditRoleModal from "./EditRoleModal.jsx";
import AddRoleModal from "./AddRoleModal.jsx";

// Helper: Component Card Vai Trò (như trong ảnh)
const RoleCard = ({ role, onEditClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-800">{role.name}</h3>
        <button className="p-2 text-slate-400 hover:text-indigo-600" onClick={onEditClick}>
          <Edit size={16} />
>>>>>>> Hoa/Post_Fix_Loi
        </button>
      </div>
      <p className="text-gray-600 mt-2">{role.description}</p>
    </div>
    <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
      <div className="flex items-center">
        <Users className="h-5 w-5 mr-2" />
        <span>{role.userCount} người dùng</span>
      </div>
      <div className="flex items-center">
        <ShieldCheck className="h-5 w-5 mr-2" />
        <span>{role.permissions.length} quyền</span>
      </div>
    </div>
  </div>
);

const AdminPermissionsPage = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState(initialRoles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false); // New state for view mode
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleCreateRole = () => {
    setCurrentRole(null); // For creating a new role
    setIsViewMode(false); // Ensure edit mode for creation
    setIsModalOpen(true);
  };

  const handleEditRole = (role) => {
    setCurrentRole(role);
    setIsViewMode(false); // Ensure edit mode for editing
    setIsModalOpen(true);
  };

  const handleViewRole = (role) => {
    navigate(`/admin/users?role=${role.name}`);
  };

  const handleSaveRole = (updatedRole) => {
    if (updatedRole.name) {
      if (currentRole) {
        // Update existing role
        setRoles(roles.map((r) => (r.id === currentRole.id ? { ...updatedRole, permissionCount: updatedRole.permissions.length } : r)));
      } else {
        // Add new role
        setRoles([...roles, { ...updatedRole, id: Date.now(), userCount: 0, permissionCount: updatedRole.permissions.length }]);
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0">
        <div className="p-8 bg-gray-50">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Phân Quyền</h1>
            <p className="text-gray-600 mt-1">Quản lý vai trò và quyền hạn của người dùng trong hệ thống.</p>
          </header>

          <div className="flex justify-end items-center mb-4">
            <button
              onClick={handleBack}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-2"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Quay lại
            </button>
            <button
              onClick={handleCreateRole}
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
            >
              + Tạo vai trò mới
            </button>
          </div>

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('roles')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'roles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vai trò ({roles.length})
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'permissions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Quyền hạn ({allPermissions.length})
              </button>
            </nav>
          </div>

          <div className="mt-8">
            {activeTab === 'roles' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                  <RoleCard key={role.id} role={role} onEdit={handleEditRole} onView={handleViewRole} />
                ))}
              </div>
            )}
            {activeTab === 'permissions' && (
              <div className="bg-white shadow-md rounded-lg p-6">
                 <h2 className="text-2xl font-bold text-gray-800 mb-4">Danh sách Quyền hạn</h2>
                 <ul className="space-y-2">
                    {allPermissions.map(permission => (
                        <li key={permission} className="p-2 bg-gray-100 rounded-md">{permission}</li>
                    ))}
                 </ul>
              </div>
            )}
          </div>

          <RoleModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveRole}
            role={currentRole}
            allPermissions={allPermissions}
            isViewMode={isViewMode}
          />
        </div>
      </main>
    </div>
  );
};

<<<<<<< HEAD
export default AdminPermissionsPage;
=======
export default function AdminRolesPage() {
  const [activeTab, setActiveTab] = useState("roles"); // 'roles' hoặc 'permissions'
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Để tải lại list

  // useEffect để tải cả Roles và Permissions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Chạy song song 2 API
        const [rolesRes, permsRes] = await Promise.all([
          axiosClient.get('/roles'),
          axiosClient.get('/permissions')
        ]);
        
        setRoles(rolesRes.data);
        setPermissions(permsRes.data);
      } catch (error) {
        console.error("Không thể tải dữ liệu phân quyền:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  // (Hàm Edit)
  const handleOpenEditModal = (role) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRole(null);
  };
  
  // (Hàm Add)
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  // (Hàm Success - Dùng chung)
  const handleSuccess = (message) => {
    handleCloseEditModal(); // Đóng modal edit (nếu đang mở)
    handleCloseAddModal(); // Đóng modal add (nếu đang mở)
    setRefreshTrigger(prev => prev + 1); // Tải lại list
    alert(message); // Thông báo
  };

  return (
    <Fragment>
      <div className="min-h-screen flex bg-slate-50 text-slate-800">
        <AdminSidebar />
        <main className="flex-1 w-full min-w-0">
          <div className="w-full px-6 md:px-10 py-6">
            {/* 1. Header & Nút bấm */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Quản lý vai trò</h1>
                <p className="text-sm text-slate-500 mt-1">Quản lý vai trò và quyền hạn của người dùng.</p>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 'roles' && (
                  <button onClick={handleOpenAddModal} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 shadow-sm">
                    <Plus size={18} /> Tạo vai trò mới
                  </button>
                )}
              </div>
            </div>

            {/* 2. Thanh Tabs */}
            <div className="border-b border-slate-200 mb-6">
              <nav className="-mb-px flex gap-6">
                <TabButton
                  name="roles"
                  label="Vai trò"
                  count={roles.length}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <TabButton
                  name="permissions"
                  label="Quyền hạn"
                  count={permissions.length}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </nav>
            </div>

            {/* 3. Nội dung Tabs */}
            {loading ? (
              <p>Đang tải...</p>
            ) : (
              <div>
                {/* Tab 1: Danh sách Vai trò (Roles) */}
                {activeTab === 'roles' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map(role => (
                      <RoleCard key={role.id} role={role} onEditClick={() => handleOpenEditModal(role)}/>
                    ))}
                  </div>
                )}
                
                {/* Tab 2: Danh sách Quyền hạn (Permissions) */}
                {activeTab === 'permissions' && (
                   <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {permissions.map(perm => (
                          <div key={perm.id} className="text-sm p-3 bg-slate-50 rounded-md border">
                            {perm.name}
                          </div>
                        ))}
                      </div>
                   </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* MODAL CHỈNH SỬA VAI TRÒ */}
      {isEditModalOpen && (
        <EditRoleModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          role={selectedRole}
          allPermissions={permissions}
          onSuccess={() => handleSuccess("Cập nhật vai trò thành công!")}
        />
      )}
      
      {/* MODAL TẠO VAI TRÒ */}
      {isAddModalOpen && (
        <AddRoleModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          allPermissions={permissions}
          onSuccess={() => handleSuccess("Tạo vai trò mới thành công!")}
        />
      )}
    </Fragment>
  );
}

// Component con cho nút Tab
const TabButton = ({ name, label, count, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(name)}
    className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 text-sm font-medium ${
      activeTab === name
        ? 'border-b-2 border-indigo-500 text-indigo-600'
        : 'border-b-2 border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
    }`}
  >
    {label}
    <span className={`px-2 py-0.5 rounded-full text-xs ${
      activeTab === name ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
    }`}>
      {count}
    </span>
  </button>
);
>>>>>>> Hoa/Post_Fix_Loi
