import { Outlet } from "react-router-dom";
import AdminSidebar from "./pages/layout/AdminSidebar";
import { useTheme } from "./context/ThemeContext";

function App() {
  const { theme } = useTheme();

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-900 ${theme}`}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
