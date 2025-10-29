import { useEffect, useState } from "react";

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

  return (
    <div style={{ padding: "50px", fontSize: "20px", textAlign: "center" }}>
      <h1>React + Laravel Demo</h1>
      {loading ? (
        <p>⏳ Đang tải dữ liệu từ API...</p>
      ) : (
        <p>💬 Kết quả API: <strong>{message}</strong></p>
      )}
    </div>
  );
}

export default App;
