import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import axiosClient from "../../api/axiosClient"; // Đảm bảo đường dẫn import đúng

export default function AddRoleModal({ isOpen, onClose, allPermissions, onSuccess }) {
  // Bắt đầu với Tên rỗng
  const [roleName, setRoleName] = useState('');
  
  // Bắt đầu với Set Quyền rỗng
  const [selectedPerms, setSelectedPerms] = useState(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hàm xử lý check/uncheck (giữ nguyên)
  const handlePermissionChange = (permissionName) => {
    const newPerms = new Set(selectedPerms);
    if (newPerms.has(permissionName)) {
      newPerms.delete(permissionName);
    } else {
      newPerms.add(permissionName);
    }
    setSelectedPerms(newPerms);
  };

  // Hàm xử lý Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // --- SỬA ĐỔI: Dùng axiosClient ---
      // Không cần lấy token thủ công, không cần khai báo URL đầy đủ
      await axiosClient.post('/roles', {
        name: roleName,
        permissions: Array.from(selectedPerms) // Chuyển Set về mảng để gửi lên server
      });
      
      // Báo thành công và reset form (nếu cần thiết logic reset có thể đặt ở đây hoặc parent)
      onSuccess();
      setRoleName('');
      setSelectedPerms(new Set());

    } catch (err) {
      console.error(err);
      // Xử lý lỗi validation từ Laravel (422)
      if (err.response && err.response.status === 422) {
        // Lấy lỗi đầu tiên của trường 'name' nếu có, hoặc hiển thị message chung
        const errorMsg = err.response.data.errors?.name?.[0] || err.response.data.message;
        setError(errorMsg);
      } else {
        setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-900">
                    Tạo Vai trò mới
                  </Dialog.Title>
                  <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {/* Tên Vai trò */}
                  <div>
                    <label htmlFor="roleName" className="block text-sm font-medium text-slate-700">Tên vai trò</label>
                    <input
                      type="text"
                      id="roleName"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Ví dụ: Staff, Biên tập viên,..."
                      required
                    />
                  </div>

                  {/* Danh sách Quyền hạn */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Quyền hạn</label>
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allPermissions.map(perm => (
                        <label key={perm.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={selectedPerms.has(perm.name)}
                            onChange={() => handlePermissionChange(perm.name)}
                          />
                          <span className="text-sm text-slate-700">{perm.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  {/* Nút bấm */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 shadow-sm"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                    >
                      {loading ? "Đang tạo..." : "Tạo mới"}
                    </button>
                  </div>
                </form>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}