import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: "Mật khẩu xác nhận không khớp!" });
      return;
    }

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/register", {
        username: form.username,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      if (res.data.success) {
        navigate("/login", {
          state: {
            successMessage: "Đăng ký thành công! Vui lòng đăng nhập.",
            email: form.email,
          },
        });
      }
    } catch (err) {
      if (err.response?.status === 422) {
        const backendErrors = err.response.data.errors || {};
        const errorMap = {};

        if (backendErrors.username) {
          errorMap.username = "Tên đăng nhập đã được sử dụng!";
        }
        if (backendErrors.email) {
          errorMap.email = "Email đã được sử dụng!";
        }
        if (backendErrors.password) {
          errorMap.password = backendErrors.password[0];
        }

        setErrors(errorMap);
      } else {
        setErrors({ general: "Đăng ký thất bại. Vui lòng thử lại!" });
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        // CÙNG MÀU VỚI FORM ĐĂNG NHẬP
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
        <h2
          style={{
            textAlign: "center",
            margin: "0 0 8px",
            fontSize: "26px",
            fontWeight: "600",
            color: "#1e293b",
          }}
        >
          Đăng ký
        </h2>
        <p
          style={{
            textAlign: "center",
            margin: "0 0 28px",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Tạo tài khoản mới
        </p>

        {/* LỖI CHUNG */}
        {errors.general && (
          <p
            style={{
              color: "#ef4444",
              textAlign: "center",
              margin: "0 0 16px",
              fontSize: "14px",
              backgroundColor: "#fee2e2",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            {errors.general}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {/* TÊN ĐĂNG NHẬP */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                color: "#374151",
                fontWeight: "500",
              }}
            >
              Tên đăng nhập
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Nhập tên đăng nhập"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 40px",
                  borderRadius: "12px",
                  border: errors.username ? "1px solid #ef4444" : "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border 0.2s",
                }}
              />
              <svg
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "18px",
                  height: "18px",
                  color: "#94a3b8",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            {errors.username && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "13px",
                  margin: "4px 0 0",
                }}
              >
                {errors.username}
              </p>
            )}
          </div>

          {/* EMAIL */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                color: "#374151",
                fontWeight: "500",
              }}
            >
              Email
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 40px",
                  borderRadius: "12px",
                  border: errors.email ? "1px solid #ef4444" : "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <svg
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "18px",
                  height: "18px",
                  color: "#94a3b8",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            {errors.email && (
              <p style={{ color: "#ef4444", fontSize: "13px", margin: "4px 0 0" }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* MẬT KHẨU */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                color: "#374151",
                fontWeight: "500",
              }}
            >
              Mật khẩu
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 40px",
                  borderRadius: "12px",
                  border: errors.password ? "1px solid #ef4444" : "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <svg
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "18px",
                  height: "18px",
                  color: "#94a3b8",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            {errors.password && (
              <p style={{ color: "#ef4444", fontSize: "13px", margin: "4px 0 0" }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* XÁC NHẬN MẬT KHẨU */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                color: "#374151",
                fontWeight: "500",
              }}
            >
              Xác nhận mật khẩu
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={form.password_confirmation}
                onChange={(e) =>
                  setForm({ ...form, password_confirmation: e.target.value })
                }
                required
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 40px",
                  borderRadius: "12px",
                  border: errors.password_confirmation
                    ? "1px solid #ef4444"
                    : "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <svg
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "18px",
                  height: "18px",
                  color: "#94a3b8",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            {errors.password_confirmation && (
              <p style={{ color: "#ef4444", fontSize: "13px", margin: "4px 0 0" }}>
                {errors.password_confirmation}
              </p>
            )}
          </div>

          {/* ĐIỀU KHOẢN */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#475569",
            }}
          >
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.checked })}
              required
              style={{ marginRight: "8px" }}
            />
            Tôi đồng ý với{" "}
            <a href="#" style={{ color: "#0ea5e9", textDecoration: "underline" }}>
              điều khoản sử dụng
            </a>
          </label>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#0284c7")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#0ea5e9")}
          >
            Đăng ký
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            style={{ color: "#0ea5e9", fontWeight: "600", textDecoration: "none" }}
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}