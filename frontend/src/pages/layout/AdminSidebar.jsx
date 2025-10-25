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
} from "lucide-react";

export default function AdminSidebar() {
  return (
    <aside className="w-64 hidden md:flex flex-col gap-4 border-r bg-white/90 backdrop-blur-sm">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold">
          A
        </div>
        <div>
          <div className="font-semibold leading-5">Admin Panel</div>
          <div className="text-xs text-slate-500">admin@example.com</div>
        </div>
      </div>

      <nav className="px-2">
        <SideItem icon={<LayoutGrid size={18} />} label="Tổng quan" />
        <SectionLabel>QUẢN LÝ SẢN PHẨM</SectionLabel>
        <SideItem icon={<Package size={18} />} label="Danh sách Sản phẩm" />
        <SideItem icon={<HardDrive size={18} />} label="Tồn kho" />
        <SideItem icon={<Tag size={18} />} label="Thuộc tính SP" />
        <SectionLabel>QUẢN LÝ CẤU TRÚC</SectionLabel>
        <SideItem active icon={<ListTree size={18} />} label="Danh mục Sản phẩm" />
        <SideItem icon={<ImageIcon size={18} />} label="Thương hiệu" />
        <SectionLabel>QUẢN LÝ GIAO DỊCH</SectionLabel>
        <SideItem icon={<Home size={18} />} label="Đơn hàng" />
        <SideItem icon={<Tag size={18} />} label="Mã giảm giá" />
        <SectionLabel>NGƯỜI DÙNG</SectionLabel>
        <SideItem icon={<Users size={18} />} label="Danh sách Người dùng" />
        <SideItem icon={<UserCheck size={18} />} label="Lịch sử hoạt động" />
      </nav>

      <div className="mt-auto p-4">
        <button className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm hover:bg-slate-50">
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="px-4 mt-3 mb-1 text-[10px] font-semibold tracking-wider text-slate-400">
      {children}
    </div>
  );
}

function SideItem({ icon, label, active }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-700 hover:bg-slate-50"
      }`}
      type="button"
    >
      {icon} {label}
    </button>
  );
}
