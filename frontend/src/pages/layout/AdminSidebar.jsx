import {
  LayoutGrid,
  Package,
  HardDrive,
  Tag,
  ListTree,
  Image as ImageIcon,
  Home,
  Users,
  UserCheck,
  LogOut,
  History,
  BarChart,
  FileText,
  FolderTree,
  MessageSquare,
  Star,
  DollarSign,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import SidebarTopControls from "../../code/SidebarTopControls";
import SidebarBottomControls from "../../code/SidebarBottomControls";
import { useThemeLang } from "../../code/ThemeLangContext";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme, t } = useThemeLang();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get("http://127.0.0.1:8000/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        // If token is invalid, server might return 401
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      // Dù có lỗi hay không, vẫn xóa token và điều hướng
    } finally {
      localStorage.removeItem("authToken");
      navigate("/login");
    }
  };

  const asideClass = `w-64 hidden md:flex flex-col gap-4 border-r backdrop-blur-sm ${
    theme === "dark" ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white/90"
  }`;

  return (
    <aside className={asideClass}>
      {/* Header admin info */}
  <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        {loading ? (
          <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse"></div>
        ) : (
          <img 
            src={`https://i.pravatar.cc/40?u=${user?.email}`} 
            alt="User Avatar" 
            className="h-9 w-9 rounded-full object-cover"
          />
        )}
        <div>
          <div className="font-semibold leading-5">{loading ? 'Đang tải...' : user?.username || 'Admin Panel'}</div>
          <div className="text-xs text-slate-500">{loading ? '...' : user?.email || 'admin@example.com'}</div>
        </div>
  </div>

  {/* Top control: theme toggle */}
  <SidebarTopControls />

      {/* Navigation */}
      <nav className="px-2">
  <SideItem icon={<LayoutGrid size={18} />} label={t("dashboard")} to="/admin/dashboard" />

  <SectionLabel>{t("transaction_management").replace(/\n/g, " ")}</SectionLabel>
  <SideItem icon={<Package size={18} />} label={t("products")} to="/admin/products" />
  <SideItem icon={<HardDrive size={18} />} label={t("stock")} to="/admin/stock" />
  <SideItem icon={<Star size={18} />} label={t("reviews")} to="/admin/reviews" />
        

  <SectionLabel>{t("transaction_management").replace(/\n/g, " ")}</SectionLabel>
  <SideItem icon={<ListTree size={18} />} label={t("categories")} to="/admin/categories" />
  <SideItem icon={<ImageIcon size={18} />} label={t("brands")} to="/admin/brands" />

  <SectionLabel>{t("transaction_management").replace(/\n/g, " ")}</SectionLabel>
  <SideItem icon={<Home size={18} />} label={t("dashboard")} to="/admin/orders" />
  <SideItem icon={<Tag size={18} />} label={t("coupons")} to="/admin/coupons" />
  <SideItem icon={<DollarSign size={18} />} label={t("revenue_report")} to="/admin/revenue-report" />

  <SectionLabel>{t("users_section")}</SectionLabel>
  <SideItem icon={<Users size={18} />} label={t("user_list")} to="/admin/users" />
  <SideItem icon={<History size={18} />} label={t("activity_history")} to="/admin/activity-history" />
  <SideItem icon={<BarChart size={18} />} label={t("user_stats")} to="/admin/user-statistics" />
  <SideItem icon={<UserCheck size={18} />} label={t("permissions")} to="/admin/permissions" />
  <SideItem icon={<Users size={18} />} label={t("profile")} to="/admin/profile" />

  <SectionLabel>{t("posts_section")}</SectionLabel>
  <SideItem icon={<FileText size={18} />} label={t("post_list")} to="/admin/posts"/>
  <SideItem icon={<BarChart size={18} />} label={t("post_stats")} to="/admin/post-statistics" />
  <SideItem icon={<FolderTree size={18} />} label={t("post_categories")} to="/admin/postcategories"/>
  <SideItem icon={<MessageSquare size={18} />} label={t("comments")} to="/admin/comments"/>
      </nav>

      {/* Controls (theme/lang) inserted before logout */}
      <div className="mt-auto px-4 py-3">
        <div className="mb-3">
          <SidebarBottomControls />
        </div>
        <div>
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm hover:bg-slate-50"
          >
            <LogOut size={16} /> {t("logout")}
          </button>
        </div>
      </div>
      </aside>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="px-4 mt-3 mb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
      {children}
    </div>
  );
}

function SideItem({ icon, label, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition ${
          isActive
            ? "bg-indigo-50 text-indigo-700 font-medium"
            : "text-slate-700 hover:bg-slate-50"
        }`
      }
    >
      {icon} {label}
    </NavLink>
  );
}
