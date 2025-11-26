import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Lock, Users, Mail, Phone, Calendar, MapPin, User, Shield, Activity } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminSidebar from '../layout/AdminSidebar';
import axiosClient from '../../api/axiosClient'; // Import axiosClient

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const { id: userId } = useParams(); // Nếu có ID thì xem user khác, không có thì xem chính mình

  const [user, setUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  const translateGender = (gender) => {
    const genderMap = {
      male: 'Nam',
      female: 'Nữ',
      other: 'Khác',
    };
    return genderMap[gender] || 'Chưa cập nhật';
  };

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        // Logic: Nếu có userId trên URL -> Gọi API lấy user theo ID
        // Nếu không -> Gọi API lấy profile của chính mình (/user hoặc /me)
        const endpoint = userId ? `/users/${userId}` : '/user';
        
        const response = await axiosClient.get(endpoint);
        
        setUser(response.data);
        setIsOwnProfile(!userId); // Nếu không có param ID, tức là đang xem profile mình

      } catch (err) {
        console.error("Lỗi tải profile:", err);
        setError('Không thể tải thông tin người dùng.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const RoleBadge = ({ role, className }) => {
    if (!role) return null;
    const roleStyles = {
      admin: "bg-purple-100 text-purple-700",
      customer: "bg-blue-100 text-blue-700",
      editor: "bg-orange-100 text-orange-700",
      default: "bg-gray-100 text-gray-700",
    };
    const style = roleStyles[role] || roleStyles.default;
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${style} ${className}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>;
  };

  const StatusBadge = ({ status, className }) => {
    if (!status) return null;
    const isHoatDong = status === 'active';
    const style = isHoatDong ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
    const dotStyle = isHoatDong ? "bg-green-600" : "bg-red-600";
    
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style} ${className}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotStyle}`}></span>
        {status === 'active' ? 'Hoạt động' : 'Bị cấm'}
      </span>
    );
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (error) return <div className="flex h-screen items-center justify-center text-red-500"><p>{error}</p></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0">
        <div className="w-full px-6 md:px-10 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Hồ sơ người dùng</h1>
                    <div className="text-sm text-slate-500 mt-1">
                        <Link to="/admin/users" className="hover:text-indigo-600">Quản lý người dùng</Link> &raquo;
                        <span className="font-medium"> {user.full_name || user.username}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm bg-white border border-slate-300 rounded-md px-3 py-2 hover:bg-slate-50">
                        <ArrowLeft size={16} /> Quay lại
                    </button>
                    <Link to="/admin/users" className="flex items-center gap-2 text-sm bg-white border border-slate-300 rounded-md px-3 py-2 hover:bg-slate-50">
                        <Users size={16} /> DS Người dùng
                    </Link>
                    {isOwnProfile && (
                        <>
                        <button onClick={() => setPasswordModalOpen(true)} className="flex items-center gap-2 text-sm bg-white border border-slate-300 rounded-md px-3 py-2 hover:bg-slate-50">
                            <Lock size={16} /> Đổi mật khẩu
                        </button>
                        <button onClick={() => setEditModalOpen(true)} className="flex items-center gap-2 text-sm bg-indigo-600 text-white rounded-md px-3 py-2 hover:bg-indigo-700">
                            <Edit size={16} /> Chỉnh sửa
                        </button>
                        </>
                    )}
                </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-4">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-300"></div>
                    <div className="p-6 -mt-16 flex flex-col items-center">
                        <img
                            src={user.avatar || `https://i.pravatar.cc/40?u=${user.email}`}
                            alt="Avatar"
                            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                        />
                        <h2 className="text-2xl font-bold text-slate-900 mt-4">{user.full_name || user.username}</h2>
                        <div className="flex items-center gap-4 mt-2">
                            <RoleBadge role={user.role} />
                            <StatusBadge status={user.status} />
                        </div>
                    </div>
                    <div className="border-t border-slate-200 px-6 py-4">
                        <h3 className="font-semibold text-slate-800 mb-3">Thông tin liên hệ</h3>
                        <div className="space-y-3 text-sm">
                            <InfoRow icon={<Mail size={14}/>} label="Email" value={user.email} href={`mailto:${user.email}`} />
                            <InfoRow icon={<Phone size={14}/>} label="Số điện thoại" value={user.phone || 'Chưa cập nhật'} />
                            <InfoRow icon={<Calendar size={14}/>} label="Ngày tham gia" value={new Date(user.created_at).toLocaleDateString('vi-VN')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Details & Activity */}
            <div className="lg:col-span-8">
                <div className="bg-white rounded-lg shadow-lg">
                    <div className="border-b border-slate-200">
                        <nav className="-mb-px flex gap-6 px-6">
                            <TabButton name="overview" activeTab={activeTab} setActiveTab={setActiveTab} icon={<User size={16}/>}>Tổng quan</TabButton>
                            <TabButton name="activity" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Activity size={16}/>}>Hoạt động</TabButton>
                            <TabButton name="permissions" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Shield size={16}/>}>Phân quyền</TabButton>
                        </nav>
                    </div>
                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-4">Thông tin chi tiết</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <InfoRow icon={<User size={14}/>} label="Họ và tên" value={user.full_name || 'Chưa cập nhật'} />
                                    <InfoRow icon={<MapPin size={14}/>} label="Địa chỉ" value={user.address || 'Chưa cập nhật'} />
                                    <InfoRow icon={<Calendar size={14}/>} label="Ngày sinh" value={user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} />
                                    <InfoRow icon={<Users size={14}/>} label="Giới tính" value={translateGender(user.gender)} />
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Giới thiệu bản thân</h3>
                                    <p className="text-sm text-slate-600 italic">{user.about_me || 'Chưa có giới thiệu.'}</p>
                                </div>
                            </div>
                        )}
                         {activeTab === 'activity' && <div className="text-center py-8 text-slate-500">Chức năng đang được phát triển.</div>}
                         {activeTab === 'permissions' && <div className="text-center py-8 text-slate-500">Chức năng đang được phát triển.</div>}
                    </div>
                </div>
            </div>
          </div>
        </div>
        {isOwnProfile && isEditModalOpen && <EditProfileModal user={user} setUser={setUser} closeModal={() => setEditModalOpen(false)} />}
        {isOwnProfile && isPasswordModalOpen && <ChangePasswordModal closeModal={() => setPasswordModalOpen(false)} />}
      </main>
    </div>
  );
};

const TabButton = ({ name, activeTab, setActiveTab, icon, children }) => (
    <button
        onClick={() => setActiveTab(name)}
        className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 text-sm font-medium ${
            activeTab === name
            ? 'border-b-2 border-indigo-500 text-indigo-600'
            : 'border-b-2 border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
        }`}
    >
        {icon} {children}
    </button>
);

const InfoRow = ({ icon, label, value, href }) => (
  <div className="flex items-start py-2">
    <div className="flex-shrink-0 w-6 text-slate-400 pt-0.5">{icon}</div>
    <div className="flex-1">
      <p className="text-xs text-slate-500">{label}</p>
      {href ? (
        <a href={href} className="text-sm font-medium text-indigo-600 hover:underline">{value}</a>
      ) : (
        <p className="text-sm font-medium text-slate-800">{value}</p>
      )}
    </div>
  </div>
);

/* === Modal Chỉnh Sửa (Dùng axiosClient) === */
const EditProfileModal = ({ user, setUser, closeModal }) => {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '', phone: user.phone || '', address: user.address || '',
    date_of_birth: user.date_of_birth || '', gender: user.gender || '',
    about_me: user.about_me || '',
  });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            // Dùng axiosClient.put
            const response = await axiosClient.put('/me/update', formData);
            
            setUser(response.data.user);
            setSuccess(response.data.message);
            setTimeout(() => closeModal(), 1500);
        } catch (err) {
            const message = err.response?.data?.message || 'Cập nhật thất bại.';
            setError(message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Chỉnh sửa thông tin</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Họ và tên" className="p-2 border rounded"/>
                        <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Số điện thoại" className="p-2 border rounded"/>
                        <input name="address" value={formData.address} onChange={handleChange} placeholder="Địa chỉ" className="p-2 border rounded"/>
                        <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="p-2 border rounded"/>
            <select name="gender" value={formData.gender} onChange={handleChange} className="p-2 border rounded">
              <option value="">Chọn giới tính</option> <option value="male">Nam</option> <option value="female">Nữ</option> <option value="other">Khác</option>
            </select>
                    </div>
                    <textarea name="about_me" value={formData.about_me} onChange={handleChange} placeholder="Giới thiệu bản thân" className="w-full p-2 border rounded mt-4" rows="3"></textarea>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
                    <div className="flex justify-end space-x-2 mt-6">
                        <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Lưu thay đổi</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* === Modal Đổi Mật Khẩu (Dùng axiosClient) === */
const ChangePasswordModal = ({ closeModal }) => {
    const [formData, setFormData] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (formData.new_password !== formData.new_password_confirmation) {
            setError('Mật khẩu mới không khớp.');
            return;
        }
        try {
            // Dùng axiosClient.post
            const response = await axiosClient.post('/me/change-password', formData);
            
            setSuccess(response.data.message);
            setTimeout(() => closeModal(), 1500);
        } catch (err) {
            const message = err.response?.data?.message || 'Đổi mật khẩu thất bại.';
            setError(message);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Đổi mật khẩu</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input type="password" name="current_password" value={formData.current_password} onChange={handleChange} placeholder="Mật khẩu hiện tại" required className="w-full p-2 border rounded"/>
                        <input type="password" name="new_password" value={formData.new_password} onChange={handleChange} placeholder="Mật khẩu mới" required className="w-full p-2 border rounded"/>
                        <input type="password" name="new_password_confirmation" value={formData.new_password_confirmation} onChange={handleChange} placeholder="Xác nhận mật khẩu mới" required className="w-full p-2 border rounded"/>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
                    <div className="flex justify-end space-x-2 mt-6">
                        <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded">Xác nhận</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminProfilePage;