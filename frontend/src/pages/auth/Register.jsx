import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, User, UserSquare } from 'lucide-react';
import Toast from "../../components/Toast"; // Import the Toast component

const API_URL = "http://127.0.0.1:8000/api";

export default function Register() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (form.password !== form.password_confirmation) {
        showToast("Mật khẩu xác nhận không khớp!", 'error');
        setIsLoading(false);
        return;
    }

    try {
      await axios.post(`${API_URL}/register`, form);
      
      showToast("Đăng Ký Thành Công!");

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/login", { 
          state: { 
              successMessage: "Tài khoản của bạn đã được tạo! Vui lòng đăng nhập.",
              email: form.email 
          } 
        });
      }, 3000);

    } catch (err) {
      console.error(err);
      let errorMessage = "Đăng ký thất bại. Vui lòng thử lại!";
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors;
        errorMessage = Object.values(errors)[0][0];
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      showToast(errorMessage, 'error');
      setIsLoading(false); // Stop loading on error
    }
    // Don't set isLoading to false on success, as the page will redirect
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-[#4e73df] to-[#d4508e] p-4 font-[Poppins,sans-serif]">
      
      <Toast 
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onHide={() => setToast({ ...toast, show: false })}
      />

      <div className="w-full max-w-5xl flex flex-col lg:flex-row rounded-2xl shadow-2xl overflow-visible">
        
        {/* Left Column (Dark Side) */}
        <div className="bg-[#2d3447] text-white p-8 lg:p-12 flex flex-col justify-center items-center lg:items-start text-center lg:text-left lg:w-5/12 rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none relative">
            <h1 className="text-4xl font-bold tracking-wider mb-4">KING</h1>
            <p className="text-gray-300 leading-relaxed mb-6">
                Bắt đầu hành trình của bạn bằng cách tạo một tài khoản. Nhanh chóng, an toàn và dễ dàng.
            </p>
            <Link to="/login" className="bg-transparent border-2 border-white hover:bg-white hover:text-[#2d3447] text-white font-bold py-3 px-8 rounded-full transition-all duration-300">
                Đăng nhập
            </Link>
            
            {/* The Central Arrow Button */}
            <a href="#" onClick={(e) => { e.preventDefault(); if (!isLoading) document.getElementById('register-form-submit').click(); }}
                className={`absolute top-full lg:top-1/2 left-1/2 lg:left-full transform -translate-x-1/2 -translate-y-1/2 h-20 w-20 bg-[#d86b83] rounded-full flex items-center justify-center border-8 border-white shadow-lg transition-all duration-300 z-10 ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-110'}`}
            >
                 {isLoading ? (
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <ArrowRight size={32} className="text-white" />
                )}
            </a>
        </div>

        {/* Right Column (Light Side - Form) */}
        <div className="bg-white p-8 lg:p-12 lg:w-7/12 rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none">
            <h2 className="text-3xl font-bold text-[#222] mb-2">Create an Account</h2>
            <p className="text-[#777] mb-8">Let's get you started!</p>

            <form onSubmit={handleSubmit} className="space-y-5">
                 {/* Full Name */}
                <div className="relative">
                    <UserSquare className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" name="full_name" placeholder="Họ và tên" value={form.full_name} onChange={handleChange} required
                        className="w-full pl-14 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-full focus:outline-none focus:border-[#d86b83] transition-all duration-300" />
                </div>
                {/* Username */}
                <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" name="username" placeholder="Tên đăng nhập" value={form.username} onChange={handleChange} required
                        className="w-full pl-14 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-full focus:outline-none focus:border-[#d86b83] transition-all duration-300" />
                </div>
                {/* Email */}
                <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required
                        className="w-full pl-14 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-full focus:outline-none focus:border-[#d86b83] transition-all duration-300" />
                </div>
                {/* Password */}
                <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="password" name="password" placeholder="Mật khẩu" value={form.password} onChange={handleChange} required
                        className="w-full pl-14 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-full focus:outline-none focus:border-[#d86b83] transition-all duration-300" />
                </div>
                {/* Confirm Password */}
                <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="password" name="password_confirmation" placeholder="Xác nhận mật khẩu" value={form.password_confirmation} onChange={handleChange} required
                        className="w-full pl-14 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-full focus:outline-none focus:border-[#d86b83] transition-all duration-300" />
                </div>
                
                {/* Hidden submit button for the central arrow to click */}
                <button
                    id="register-form-submit"
                    type="submit"
                    disabled={isLoading}
                    className="hidden"
                >
                    {isLoading ? "Creating Account..." : "Register"}
                </button>
            </form>
             <div className="text-center text-sm text-[#777] pt-8">
                    Already have an account? 
                    <Link to="/login" className="font-bold text-[#2d3447] hover:underline ml-1">
                        Login
                    </Link>
                </div>
        </div>

      </div>
    </div>
  );
}
