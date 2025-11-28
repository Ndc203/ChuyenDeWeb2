import React, { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đã có lỗi xảy ra.');
      }

      setMessage(data.message || 'Hãy kiểm tra email để đặt lại mật khẩu.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-[#4e73df] to-[#d4508e] p-4 font-[Poppins,sans-serif]">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row rounded-2xl shadow-2xl overflow-visible">
        {/* Left Column */}
        <div className="bg-[#2d3447] text-white p-8 lg:p-12 flex flex-col justify-center items-center lg:items-start text-center lg:text-left lg:w-5/12 rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none relative">
          <h1 className="text-4xl font-bold tracking-wider mb-4">KING</h1>
          <p className="text-gray-300 leading-relaxed mb-6">
            Quên mật khẩu? Chúng tôi sẽ giúp bạn lấy lại quyền truy cập chỉ với vài bước đơn giản.
          </p>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <span>Nhớ mật khẩu? </span>
              <Link to="/login" className="text-white font-semibold hover:underline">
                Đăng nhập
              </Link>
            </div>
            <div>
              <span>Chưa có tài khoản? </span>
              <Link to="/register" className="text-white font-semibold hover:underline">
                Đăng ký
              </Link>
            </div>
          </div>

          {/* Central arrow submit button to mirror login/register layout */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (!loading) {
                document.getElementById('forgot-password-submit')?.click();
              }
            }}
            className={`absolute top-full lg:top-1/2 left-1/2 lg:left-full transform -translate-x-1/2 -translate-y-1/2 h-20 w-20 bg-[#d86b83] rounded-full flex items-center justify-center border-8 border-white shadow-lg transition-all duration-300 z-10 ${
              loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-110'
            }`}
          >
            {loading ? (
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight size={32} className="text-white" />
            )}
          </a>
        </div>

        {/* Right Column */}
        <div className="bg-white p-8 lg:p-12 lg:w-7/12 rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none">
          <h2 className="text-3xl font-bold text-[#222] mb-2">Quên mật khẩu?</h2>
          <p className="text-[#777] mb-8">Nhập email để nhận liên kết đặt lại mật khẩu.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
                className="w-full pl-14 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-full focus:outline-none focus:border-[#d86b83] transition-all duration-300"
              />
            </div>

            {message && <p className="text-green-600 text-sm text-center">{message}</p>}
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <button
              id="forgot-password-submit"
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 font-semibold text-white bg-[#d86b83] rounded-full hover:bg-[#c45977] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d86b83]/70 transition-all duration-300 disabled:opacity-60"
            >
              {loading ? 'Đang gửi...' : 'Gửi hướng dẫn khôi phục'}
            </button>
          </form>

          <div className="text-center text-sm text-[#777] pt-8">
            <Link to="/login" className="font-bold text-[#2d3447] hover:underline">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
