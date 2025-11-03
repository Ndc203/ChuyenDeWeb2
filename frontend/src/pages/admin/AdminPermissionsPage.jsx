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

export default AdminPermissionsPage;
