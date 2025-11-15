import { useEffect, useState } from "react";
import { useThemeLang } from "./code/ThemeLangContext";
// ...existing code...

function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAPI = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/test");
        if (!res.ok) throw new Error("API lỗi hoặc không tồn tại");
        const data = await res.json();
        setMessage(data.message || "Không có dữ liệu trả về");
      } catch (error) {
        setMessage("❌ Không kết nối được đến Laravel API");
      } finally {
        setLoading(false);
      }
    };
    fetchAPI();
  }, []);

  return <AppContent message={message} loading={loading} />;
}

function AppContent({ message, loading }) {
  const { theme, language } = useThemeLang();

  return (
    <div
      style={{
        padding: "50px",
        fontSize: "20px",
        textAlign: "center",
        background: theme === "dark" ? "#222" : "#fff",
        color: theme === "dark" ? "#fff" : "#222",
        minHeight: "100vh",
        transition: "all 0.3s"
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          width: "220px",
          background: theme === "dark" ? "#333" : "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
          borderRight: theme === "dark" ? "1px solid #444" : "1px solid #eee"
        }}
      >
        {/* Các mục sidebar */}
        <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ color: "#888", fontWeight: "bold", fontSize: "13px", paddingLeft: "24px", marginBottom: "4px" }}>{language === "vi" ? "QUẢN LÝ GIAO DỊCH" : "TRANSACTION MANAGEMENT"}</div>
          <SidebarItem icon="🏠" label={language === "vi" ? "Đơn hàng" : "Orders"} />
          <SidebarItem icon="🏷️" label={language === "vi" ? "Mã giảm giá" : "Discount"} />
          <SidebarItem icon="💲" label={language === "vi" ? "Báo cáo doanh thu" : "Revenue Report"} />
          <div style={{ color: "#888", fontWeight: "bold", fontSize: "13px", paddingLeft: "24px", margin: "12px 0 4px 0" }}>{language === "vi" ? "NGƯỜI DÙNG" : "USER"}</div>
          <SidebarItem icon="👤" label={language === "vi" ? "Danh sách Người dùng" : "User List"} active />
          <SidebarItem icon="🕒" label={language === "vi" ? "Lịch sử hoạt động" : "Activity History"} />
          <SidebarItem icon="📊" label={language === "vi" ? "Thống kê người dùng" : "User Stats"} />
          <SidebarItem icon="🔑" label={language === "vi" ? "Phân Quyền" : "Permission"} />
          <SidebarItem icon="👤" label={language === "vi" ? "Trang cá nhân" : "Profile"} />
          <div style={{ color: "#888", fontWeight: "bold", fontSize: "13px", paddingLeft: "24px", margin: "12px 0 4px 0" }}>{language === "vi" ? "BÀI VIẾT" : "POSTS"}</div>
          <SidebarItem icon="📄" label={language === "vi" ? "Danh sách Bài viết" : "Post List"} />
          <SidebarItem icon="📊" label={language === "vi" ? "Thống kê Bài viết" : "Post Stats"} />
          <SidebarItem icon="🗂️" label={language === "vi" ? "Danh sách Chuyên mục Bài Viết" : "Category List"} />
          <SidebarItem icon="💬" label={language === "vi" ? "Danh sách Bình luận" : "Comment List"} />
        </div>
        {/* Các nút chức năng ở cuối sidebar (từ component) */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <SidebarControls />
          <button
            style={{ padding: "10px 0", borderRadius: "8px", border: "1px solid #ccc", cursor: "pointer", background: theme === "dark" ? "#222" : "#fff", color: theme === "dark" ? "#fff" : "#222", fontWeight: "bold" }}
          >
            {language === "vi" ? "Đăng xuất" : "Logout"}
          </button>
        </div>
      </div>
      {/* Nội dung chính */}
      <div style={{ marginLeft: "240px" }}>
        <h1>{language === "vi" ? "React + Laravel Demo" : "React + Laravel Demo"}</h1>
        {loading ? (
          <p>{language === "vi" ? "⏳ Đang tải dữ liệu từ API..." : "⏳ Loading data from API..."}</p>
        ) : (
          <p>
            {language === "vi" ? "💬 Kết quả API: " : "💬 API Result: "}
            <strong>{message}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
// Component cho từng mục sidebar
function SidebarItem({ icon, label, active }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 24px",
        borderRadius: "8px",
        background: active ? "#e0e7ff" : "transparent",
        color: active ? "#3b82f6" : "inherit",
        fontWeight: active ? "bold" : "normal",
        cursor: "pointer"
      }}
    >
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default App;