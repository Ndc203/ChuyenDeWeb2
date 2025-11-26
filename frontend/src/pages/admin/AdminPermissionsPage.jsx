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
        </button>
      </div>
      <p className="text-sm text-slate-500 min-h-[40px]">
        {/* Bạn có thể thêm cột 'description' vào bảng 'roles' để hiển thị ở đây */}
        {role.description || `Mô tả cho vai trò ${role.name}...`}
      </p>
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users size={16} />
          <span>{role.users_count} người dùng</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Shield size={16} />
          <span>{role.permissions.length} quyền</span>
        </div>
      </div>
    </div>
  );
};

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