import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Đang tải...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/test")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Không kết nối được API"));
  }, []);

  return (
    <div style={{ padding: "50px", fontSize: "20px" }}>
      <h1>React + Laravel demo</h1>
      <p>Kết quả API: {message}</p>
    </div>
  );
}

export default App;
