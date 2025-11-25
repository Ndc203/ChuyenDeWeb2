import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Lock, Save, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import ShopHeader from '../../components/shop/ShopHeader';
import AddressSelector from '../../components/AddressSelector';

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // 'info' hoặc 'password'
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form Data
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', address: '', date_of_birth: '', gender: ''
  });
  
  // Password Data
  const [passData, setPassData] = useState({
    current_password: '', new_password: '', new_password_confirmation: ''
  });

  // 1. Tải thông tin User
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const res = await axios.get(`${API_URL}/api/user`); // Route lấy user kèm profile
        const u = res.data;
        
        setUser(u);
        setFormData({
          full_name: u.profile?.full_name || '',
          email: u.email || '',
          phone: u.profile?.phone || '',
          address: u.profile?.address || '',
          date_of_birth: u.profile?.date_of_birth || '',
          gender: u.profile?.gender || 'other',
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // 2. Cập nhật thông tin
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    try {
      const res = await axios.put(`${API_URL}/api/me/update`, formData);
      
      // Cập nhật lại LocalStorage để Header hiển thị tên mới ngay
      localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi cập nhật.' });
    }
  };

  // 3. Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passData.new_password !== passData.new_password_confirmation) {
        setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
        return;
    }

    try {
      await axios.post(`${API_URL}/api/me/change-password`, passData);
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPassData({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi đổi mật khẩu.' });
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 pt-20 text-center">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Hồ sơ cá nhân</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Sidebar Menu */}
            <div className="bg-white rounded-xl shadow-sm p-4 h-fit">
                <div className="flex items-center gap-3 mb-6 px-2">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${user?.profile?.full_name || 'User'}&background=random`} 
                        alt="Avatar" className="w-12 h-12 rounded-full"
                    />
                    <div>
                        <p className="font-bold text-sm text-gray-900">{user?.profile?.full_name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                </div>
                <nav className="space-y-1">
                    <button 
                        onClick={() => setActiveTab('info')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'info' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <User size={18}/> Thông tin tài khoản
                    </button>
                    <button 
                        onClick={() => setActiveTab('password')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'password' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Lock size={18}/> Đổi mật khẩu
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="md:col-span-3 bg-white rounded-xl shadow-sm p-6 md:p-8">
                
                {/* Thông báo */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* TAB 1: THÔNG TIN */}
                {activeTab === 'info' && (
                    <form onSubmit={handleUpdateInfo}>
                        <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b">Cập nhật thông tin</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                                    <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} 
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                                    <input type="date" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} 
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng mặc định</label>
                                
                                {/* 2. Thay thế input cũ bằng component mới */}
                                <AddressSelector 
                                defaultValue={formData.address}
                                    onChange={(fullAddress) => {
                                        // Cập nhật vào state formData của trang Profile
                                        setFormData(prev => ({ ...prev, address: fullAddress }));
                                    }}
                                />
                                
                                {/* Hiển thị địa chỉ hiện tại (để user biết) */}
                                <p className="text-xs text-gray-500 mt-1">
                                    Địa chỉ hiện tại: {formData.address || 'Chưa cập nhật'}
                                </p>
                            </div>
                        </div>

                        <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
                            <Save size={18}/> Lưu thay đổi
                        </button>
                    </form>
                )}

                {/* TAB 2: ĐỔI MẬT KHẨU */}
                {activeTab === 'password' && (
                    <form onSubmit={handleChangePassword} className="max-w-md">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b">Thay đổi mật khẩu</h2>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                                <input type="password" value={passData.current_password} onChange={e => setPassData({...passData, current_password: e.target.value})} 
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                                <input type="password" value={passData.new_password} onChange={e => setPassData({...passData, new_password: e.target.value})} 
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required placeholder="Ít nhất 8 ký tự" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                                <input type="password" value={passData.new_password_confirmation} onChange={e => setPassData({...passData, new_password_confirmation: e.target.value})} 
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                        </div>

                        <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
                            <Save size={18}/> Đổi mật khẩu
                        </button>
                    </form>
                )}

            </div>
        </div>
      </div>
    </div>
  );
}