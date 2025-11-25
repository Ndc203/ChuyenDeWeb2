import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000/api";

export default function Register() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    full_name: "", // Bắt buộc cho Profile
    username: "",
    email: "",
    password: "",
    password_confirmation: "" // Bắt buộc cho Laravel validation 'confirmed'
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Kiểm tra cơ bản ở Frontend
    if (form.password !== form.password_confirmation) {
        setError("Mật khẩu xác nhận không khớp!");
        setIsLoading(false);
        return;
    }

    try {
      // Gọi API đăng ký
      await axios.post(`${API_URL}/register`, form);

      // Thành công -> Chuyển sang trang Login kèm thông báo
      // (Dùng state của router để truyền message)
      navigate("/login", { 
        state: { 
            successMessage: "Đăng ký thành công! Vui lòng đăng nhập.",
            email: form.email 
        } 
      });

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 422) {
        // Lỗi validation từ Laravel (trả về mảng errors)
        const errors = err.response.data.errors;
        // Lấy lỗi đầu tiên tìm thấy để hiển thị
        const firstError = Object.values(errors)[0][0];
        setError(firstError);
      } else {
        setError(err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!");
      }
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
          maxWidth: "450px", // Rộng hơn xíu để chứa nhiều field
        }}
      >
        <h2 style={{ textAlign: "center", margin: "0 0 8px", fontSize: "26px", fontWeight: "600", color: "#1e293b" }}>
          Tạo tài khoản
        </h2>
        <p style={{ textAlign: "center", margin: "0 0 28px", color: "#64748b", fontSize: "14px" }}>
          Trở thành thành viên của TechStore ngay hôm nay
        </p>

        {error && (
          <div style={{ color: "#b91c1c", textAlign: "center", marginBottom: "16px", fontSize: "14px", backgroundColor: "#fee2e2", padding: "10px", borderRadius: "8px", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Họ và tên */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Họ và tên</label>
            <input
              type="text"
              name="full_name"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={form.full_name}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
            />
          </div>

          {/* Tên đăng nhập */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Tên đăng nhập</label>
            <input
              type="text"
              name="username"
              placeholder="username123"
              value={form.username}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
            />
          </div>

          {/* Mật khẩu */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Mật khẩu</label>
            <input
              type="password"
              name="password"
              placeholder="Ít nhất 8 ký tự"
              value={form.password}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
            />
          </div>

          {/* Xác nhận mật khẩu */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Xác nhận mật khẩu</label>
            <input
              type="password"
              name="password_confirmation"
              placeholder="Nhập lại mật khẩu"
              value={form.password_confirmation}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
            />
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
            {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#64748b" }}>
          Đã có tài khoản? <Link to="/login" style={{ color: "#0ea5e9", fontWeight: "600", textDecoration: "none" }}>Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}