import { useState, useEffect } from "react";
import axiosClient from '../../api/axiosClient';
import { useNavigate, Link, useLocation } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Xử lý thông báo từ trang Register chuyển sang
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      if (location.state.email) {
        setForm((prev) => ({ ...prev, email: location.state.email }));
      }
      // Xóa thông báo sau 5 giây
      const timer = setTimeout(() => {
        setSuccessMessage("");
        window.history.replaceState({}, document.title);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await axiosClient.post("/login", {
        email: form.email,
        password: form.password,
      });

      // Lấy dữ liệu (axiosClient trả về response object)
      const { access_token, role, user } = res.data;

      if (access_token) {
        // 1. Lưu vào LocalStorage (Token Key phải khớp với axiosClient)
        localStorage.setItem("authToken", access_token);
        
        // Lưu thêm thông tin phụ trợ nếu cần hiển thị UI
        localStorage.setItem("userRole", role);
        localStorage.setItem("userInfo", JSON.stringify(user));

        alert("Đăng nhập thành công!");

        // 2. ĐIỀU HƯỚNG
        if (role === 'admin' || role === 'Admin') {
            navigate("/admin/dashboard");
        } else {
            navigate("/"); 
        }
      }
    } catch (err) {
      console.error(err);
      // Xử lý thông báo lỗi từ Backend trả về
      setError(err.response?.data?.message || "Đăng nhập thất bại! Vui lòng kiểm tra lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "40px 32px",
          borderRadius: "20px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <h2 style={{ textAlign: "center", margin: "0 0 8px", fontSize: "26px", fontWeight: "600", color: "#1e293b" }}>
          Đăng nhập
        </h2>
        <p style={{ textAlign: "center", margin: "0 0 28px", color: "#64748b", fontSize: "14px" }}>
          Chào mừng bạn quay trở lại
        </p>

        {/* THÔNG BÁO THÀNH CÔNG */}
        {successMessage && (
          <div
            style={{
              color: "#065f46",
              textAlign: "center",
              marginBottom: "16px",
              fontSize: "14px",
              backgroundColor: "#d1fae5",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #a7f3d0",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* THÔNG BÁO LỖI */}
        {error && (
          <div style={{ color: "#b91c1c", textAlign: "center", marginBottom: "16px", fontSize: "14px", backgroundColor: "#fee2e2", padding: "8px", borderRadius: "8px", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Email</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", transition: "border-color 0.2s" }}
              />
              <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#94a3b8" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Mật khẩu */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
              />
              <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#94a3b8" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", fontSize: "13px" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} style={{ marginRight: "6px" }} />
              <span style={{ color: "#475569" }}>Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" style={{ color: "#0ea5e9", textDecoration: "none", fontWeight: "500" }}>Quên mật khẩu?</Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: isLoading ? "#9ca3af" : "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#64748b" }}>
          Chưa có tài khoản? <Link to="/register" style={{ color: "#0ea5e9", fontWeight: "600", textDecoration: "none" }}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}