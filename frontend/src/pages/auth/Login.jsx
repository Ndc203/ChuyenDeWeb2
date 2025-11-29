import { useState, useEffect } from "react";
import axiosClient from '../../api/axiosClient';
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, Lock, ArrowRight, Facebook } from 'lucide-react';
import Toast from "../../components/Toast"; // Import the Toast component

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const navigate = useNavigate();
  const location = useLocation();

  // Effect to handle success message from registration page
  useEffect(() => {
    if (location.state?.successMessage) {
      setToast({ show: true, message: location.state.successMessage, type: 'success' });
      if (location.state.email) {
        setForm((prev) => ({ ...prev, email: location.state.email }));
      }
      // Clear location state after showing toast
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axiosClient.post("/login", {
        email: form.email,
        password: form.password,
      });

      const { access_token, role, user } = res.data;

      if (access_token) {
        localStorage.setItem("authToken", access_token);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userInfo", JSON.stringify(user));

        showToast("Đăng nhập thành công!");

        // Redirect after 3 seconds
        setTimeout(() => {
            if (role === 'admin' || role === 'Admin') {
                navigate("/admin/dashboard");
            } else {
                navigate("/"); 
            }
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Đăng nhập thất bại! Vui lòng kiểm tra lại.";
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
            <h1 className="text-4xl font-bold tracking-wider mb-4">TechStore</h1>
            <p className="text-gray-300 leading-relaxed mb-6">
                Chào mừng bạn đến với hệ thống quản lý. Đăng nhập để tiếp tục và khám phá những tính năng tuyệt vời.
            </p>
            
            {/* The Central Arrow Button */}
            <a href="#" onClick={(e) => { e.preventDefault(); if (!isLoading) document.getElementById('login-form-submit').click(); }}
                className={`absolute top-full lg:top-1/2 left-1/2 lg:left-full transform -translate-x-1/2 -translate-y-1/2 h-20 w-20 bg-[#d86b83] rounded-full flex items-center justify-center border-8 border-white shadow-lg  transition-all duration-300 z-10 ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-110'}`}
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
            <h2 className="text-3xl font-bold text-[#222] mb-2">Welcome Back!</h2>
            <p className="text-[#777] mb-8">Sign in to continue</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className="w-full pl-14 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-full focus:outline-none focus:border-[#d86b83] transition-all duration-300"
                    />
                </div>

                {/* Password */}
                <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        className="w-full pl-14 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-full focus:outline-none focus:border-[#d86b83] transition-all duration-300"
                    />
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-[#777] cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={form.remember} 
                            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                            className="h-4 w-4 rounded text-[#d86b83] focus:ring-[#d86b83]/50 border-gray-300"
                        />
                        Remember me
                    </label>
                    <Link to="/forgot-password" className="font-medium text-[#777] hover:text-[#d86b83] hover:underline">
                        Forgot Password?
                    </Link>
                </div>
                
                {/* Hidden submit button for the central arrow to click */}
                <button
                    id="login-form-submit"
                    type="submit"
                    disabled={isLoading}
                    className="hidden"
                >
                    {isLoading ? "Logging in..." : "Login"}
                </button>
            </form>

            <div className="flex items-center my-8">
                <hr className="flex-grow border-t border-gray-300" />
                <span className="px-4 text-sm text-gray-500">OR SIGN IN WITH</span>
                <hr className="flex-grow border-t border-gray-300" />
            </div>

            <div className="space-y-4">
                {/* Google Button */}
                <a href={`${API_BASE_URL}/api/auth/google/redirect`} className="flex items-center justify-center w-full bg-[#dd4b39] text-white rounded-md overflow-hidden transition-opacity duration-300 hover:opacity-90">
                    <div className="w-12 h-12 flex items-center justify-center border-r border-black/20">
                        <span className="font-bold text-xl">G</span>
                    </div>
                    <span className="flex-1 text-center text-sm font-medium">
                        Sign in with Google
                    </span>
                </a>

                {/* Facebook Button */}
                <a href={`${API_BASE_URL}/api/auth/facebook/redirect`} className="flex items-center justify-center w-full bg-[#3b5998] text-white rounded-md overflow-hidden transition-opacity duration-300 hover:opacity-90">
                    <div className="w-12 h-12 flex items-center justify-center border-r border-black/20">
                        <Facebook size={24} />
                    </div>
                    <span className="flex-1 text-center text-sm font-medium">
                        Sign in with Facebook
                    </span>
                </a>
            </div>

             <div className="text-center text-sm text-[#777] pt-8">
                    Don't have an account? 
                    <Link to="/register" className="font-bold text-[#2d3447] hover:underline ml-1">
                        Register
                    </Link>
                </div>
        </div>

      </div>
    </div>
  );
}
