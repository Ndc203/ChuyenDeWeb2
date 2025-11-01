import React, { useState, useEffect } from 'react';

const RoleModal = ({ isOpen, onClose, onSave, role = null, allPermissions, isViewMode = false }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
      setSelectedPermissions(role.permissions || []);
    } else {
      setName('');
      setDescription('');
      setSelectedPermissions([]);
    }
  }, [role]);

  const handlePermissionChange = (permission) => {
    if (isViewMode) return; // Do not allow changes in view mode
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewMode) return; // Do not save in view mode
    onSave({ ...role, name, description, permissions: selectedPermissions });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{isViewMode ? 'Chi tiết Vai trò' : (role ? 'Chỉnh sửa Vai trò' : 'Tạo Vai trò mới')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Tên vai trò:
            </label>
            <input
              type="text"
              id="name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isViewMode}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
              Mô tả vai trò:
            </label>
            <textarea
              id="description"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isViewMode}
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Quyền hạn:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-3 rounded">
              {allPermissions.map((permission) => (
                <div key={permission} className="flex items-center">
                  <input
                    type="checkbox"
                    id={permission}
                    className="mr-2 leading-tight"
                    checked={selectedPermissions.includes(permission)}
                    onChange={() => handlePermissionChange(permission)}
                    disabled={isViewMode}
                  />
                  <label htmlFor={permission} className="text-sm text-gray-700">
                    {permission}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {isViewMode ? 'Đóng' : 'Hủy'}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Lưu
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleModal;