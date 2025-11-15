import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit,
  Lock,
  Users,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  Shield,
  Activity,
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "../layout/AdminSidebar";

const api = {
  getOwnProfile: () => axios.get("http://localhost:8000/api/user"),
  getUserById: (id) => axios.get(`http://localhost:8000/api/users/${id}`),
  updateProfile: (data) => axios.put("http://localhost:8000/api/me/update", data),
  changePassword: (data) => axios.post("http://localhost:8000/api/me/change-password", data),
};

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const { id: userId } = useParams();

  const [user, setUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  const translateGender = (gender) => {
    const map = { male: "Nam", female: "Nu", other: "Khac" };
    return map[gender] || "Chua cap nhat";
  };

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/login");
          return;
        }
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = userId ? await api.getUserById(userId) : await api.getOwnProfile();
        setUser(response.data);
        setIsOwnProfile(!userId);
      } catch (err) {
        setError("Khong the tai thong tin nguoi dung.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, navigate]);

  const RoleBadge = ({ role }) => {
    if (!role) return null;
    const styles = {
      super_admin: "bg-rose-100 text-rose-700",
      admin: "bg-purple-100 text-purple-700",
      operator: "bg-amber-100 text-amber-700",
      customer: "bg-blue-100 text-blue-700",
    };
    const style = styles[role] || "bg-gray-100 text-gray-700";
    const label = role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${style}`}>{label}</span>;
  };

  const StatusBadge = ({ status }) => {
    if (!status) return null;
    const active = status === "active";
    const style = active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
    const dot = active ? "bg-green-600" : "bg-red-600";
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`}></span>
        {active ? "Hoat dong" : "Bi cam"}
      </span>
    );
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><p>Dang tai...</p></div>;
  if (error) return <div className="flex h-screen items-center justify-center text-red-500"><p>{error}</p></div>;
  if (!user) return null;

  const profile = user.profile || {};
  const displayName = profile.full_name || user.full_name || user.username;
  const displayPhone = profile.phone || "Chua cap nhat";
  const displayAddress = profile.address || "Chua cap nhat";
  const displayDob = profile.date_of_birth || "Chua cap nhat";
  const displayGender = translateGender(profile.gender);
  const displayAbout = profile.about_me || "Chua co gioi thieu.";

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <AdminSidebar />
      <main className="flex-1 w-full min-w-0">
        <div className="w-full px-6 md:px-10 py-6">
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Ho so nguoi dung</h1>
                <div className="text-sm text-slate-500 mt-1">
                  <Link to="/admin/users" className="hover:text-indigo-600">
                    Quan ly nguoi dung
                  </Link>{" "}
                  &raquo; <span className="font-medium">{displayName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm bg-white border border-slate-300 rounded-md px-3 py-2 hover:bg-slate-50">
                  <ArrowLeft size={16} /> Quay lai
                </button>
                <Link to="/admin/users" className="flex items-center gap-2 text-sm bg-white border border-slate-300 rounded-md px-3 py-2 hover:bg-slate-50">
                  <Users size={16} /> DS nguoi dung
                </Link>
                {isOwnProfile && (
                  <>
                    <button onClick={() => setPasswordModalOpen(true)} className="flex items-center gap-2 text-sm bg-white border border-slate-300 rounded-md px-3 py-2 hover:bg-slate-50">
                      <Lock size={16} /> Doi mat khau
                    </button>
                    <button onClick={() => setEditModalOpen(true)} className="flex items-center gap-2 text-sm bg-indigo-600 text-white rounded-md px-3 py-2 hover:bg-indigo-700">
                      <Edit size={16} /> Chinh sua
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
              <div className="inline-block rounded-full border-4 border-white shadow">
                <img src="https://i.pravatar.cc/160?img=32" alt="avatar" className="h-28 w-28 rounded-full object-cover" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-4">{displayName}</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
              </div>
              <div className="mt-4 space-y-2 text-left">
                <InfoRow icon={<Mail size={14} />} label="Email" value={user.email} href={`mailto:${user.email}`} />
                <InfoRow icon={<Phone size={14} />} label="So dien thoai" value={displayPhone} />
                <InfoRow
                  icon={<Calendar size={14} />}
                  label="Ngay tham gia"
                  value={user.created_at ? new Date(user.created_at).toLocaleDateString() : "---"}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="border-b flex items-center gap-6 px-6">
                <TabButton name="overview" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Activity size={16} />}>
                  Tong quan
                </TabButton>
                <TabButton name="activity" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Shield size={16} />}>
                  Hoat dong
                </TabButton>
                <TabButton name="permissions" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Users size={16} />}>
                  Phan quyen
                </TabButton>
              </div>

              {activeTab === "overview" && (
                <section className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900">Thong tin chi tiet</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow icon={<User size={14} />} label="Ho va ten" value={displayName} />
                    <InfoRow icon={<Calendar size={14} />} label="Ngay sinh" value={displayDob} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <InfoRow icon={<MapPin size={14} />} label="Dia chi" value={displayAddress} />
                    <InfoRow icon={<Users size={14} />} label="Gioi tinh" value={displayGender} />
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-slate-900">Gioi thieu ban than</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{displayAbout}</p>
                  </div>
                </section>
              )}

              {activeTab === "activity" && (
                <div className="p-6 text-sm text-slate-500">Chua co du lieu hoat dong.</div>
              )}
              {activeTab === "permissions" && (
                <div className="p-6 text-sm text-slate-500">Chua thiet lap phan quyen chi tiet.</div>
              )}
            </div>
          </div>
        </div>
      </main>

      {isEditModalOpen && <EditProfileModal user={user} setUser={setUser} closeModal={() => setEditModalOpen(false)} />}
      {isPasswordModalOpen && <ChangePasswordModal closeModal={() => setPasswordModalOpen(false)} />}
    </div>
  );
};

const TabButton = ({ name, activeTab, setActiveTab, children, icon }) => (
  <button
    onClick={() => setActiveTab(name)}
    className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 text-sm font-medium ${
      activeTab === name
        ? "border-b-2 border-indigo-500 text-indigo-600"
        : "border-b-2 border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
    }`}
  >
    {icon} {children}
  </button>
);

const InfoRow = ({ icon, label, value, href }) => (
  <div className="flex items-start py-2">
    <div className="flex-shrink-0 w-6 text-slate-400 pt-0.5">{icon}</div>
    <div className="flex-1">
      <p className="text-xs text-slate-500">{label}</p>
      {href ? (
        <a href={href} className="text-sm font-medium text-indigo-600 hover:underline">
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium text-slate-800">{value}</p>
      )}
    </div>
  </div>
);

const EditProfileModal = ({ user, setUser, closeModal }) => {
  const profile = user?.profile || {};
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    phone: profile.phone || "",
    address: profile.address || "",
    date_of_birth: profile.date_of_birth || "",
    gender: profile.gender || "",
    department: profile.department || "",
    about_me: profile.about_me || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await api.updateProfile(formData);
      setUser(response.data.user);
      setSuccess(response.data.message);
      setTimeout(() => closeModal(), 1200);
    } catch (err) {
      setError("Cap nhat that bai. Vui long thu lai.");
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Chinh sua thong tin</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Ho va ten" className="p-2 border rounded" />
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="So dien thoai" className="p-2 border rounded" />
            <input name="address" value={formData.address} onChange={handleChange} placeholder="Dia chi" className="p-2 border rounded" />
            <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="p-2 border rounded" />
            <select name="gender" value={formData.gender} onChange={handleChange} className="p-2 border rounded">
              <option value="">Chon gioi tinh</option>
              <option value="male">Nam</option>
              <option value="female">Nu</option>
              <option value="other">Khac</option>
            </select>
            <input name="department" value={formData.department} onChange={handleChange} placeholder="Phong ban" className="p-2 border rounded" />
          </div>
          <textarea
            name="about_me"
            value={formData.about_me}
            onChange={handleChange}
            placeholder="Gioi thieu ban than"
            className="w-full p-2 border rounded mt-4"
            rows="3"
          ></textarea>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
          <div className="flex justify-end space-x-2 mt-6">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">
              Huy
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              Luu thay doi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChangePasswordModal = ({ closeModal }) => {
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (formData.new_password !== formData.new_password_confirmation) {
      setError("Mat khau moi khong khop.");
      return;
    }
    try {
      const response = await api.changePassword(formData);
      setSuccess(response.data.message);
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Doi mat khau that bai.");
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Doi mat khau</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            name="current_password"
            value={formData.current_password}
            onChange={handleChange}
            placeholder="Mat khau hien tai"
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            placeholder="Mat khau moi"
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            name="new_password_confirmation"
            value={formData.new_password_confirmation}
            onChange={handleChange}
            placeholder="Nhap lai mat khau moi"
            className="w-full p-2 border rounded"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">
              Huy
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              Cap nhat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfilePage;
