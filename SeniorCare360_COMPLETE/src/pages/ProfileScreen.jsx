import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Check, LogOut, ChevronRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const Field = ({ label, value, editing, field, form, onChange }) => (
  <div className="flex items-center py-3.5 px-4 border-b border-gray-50 last:border-0 min-h-14">
    <span className="w-32 text-xs font-semibold text-gray-400 flex-shrink-0">{label}</span>
    {editing ? (
      <input className="flex-1 text-sm text-gray-800 border-b-2 border-blue-500 focus:outline-none py-1 bg-transparent"
        value={form[field] || ""} onChange={e => onChange(field, e.target.value)} />
    ) : (
      <span className="flex-1 text-sm text-gray-800">{value || "—"}</span>
    )}
  </div>
);

const PROFILE_FIELDS = {
  address_line1: "", address_line2: "", city: "", state: "", zip_code: "",
  medicare_id: "", medicaid_id: "", insurance_provider: "", insurance_member_id: "",
  phone: ""
};

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      setForm({ ...PROFILE_FIELDS, ...me });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const updates = {};
    Object.keys(PROFILE_FIELDS).forEach(k => { updates[k] = form[k]; });
    await base44.auth.updateMe(updates);
    setUser(prev => ({ ...prev, ...updates }));
    setEditing(false);
    setSaving(false);
    alert("✅ Profile updated successfully.");
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await base44.auth.logout("/");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Loader2 size={32} className="animate-spin text-blue-500" />
    </div>
  );

  const initials = (user?.full_name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      <div className="text-white px-5 pt-14 pb-8 flex flex-col items-center" style={{ backgroundColor: "#1976a8" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(255,255,255,0.25)", border: "3px solid white" }}>
          <span className="text-3xl font-extrabold text-white">{initials}</span>
        </div>
        <p className="text-xl font-bold">{user?.full_name || "My Profile"}</p>
        <p className="text-blue-200 text-sm mt-1">{user?.email}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <button onClick={editing ? handleSave : () => setEditing(true)} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold mb-2"
          style={{ backgroundColor: editing ? "#2e7d32" : "#1976a8" }}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : editing ? <Check size={18} color="white" /> : <Pencil size={18} color="white" />}
          {saving ? "Saving..." : editing ? "Save Changes" : "Edit Profile"}
        </button>
        {editing && (
          <button onClick={() => { setForm({ ...PROFILE_FIELDS, ...user }); setEditing(false); }}
            className="w-full border-2 border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-500 mb-4">
            Cancel
          </button>
        )}

        <p className="text-sm font-bold text-gray-700 mt-4 mb-2">👤 Personal Information</p>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-3">
          <Field label="Full Name" value={user?.full_name} field="full_name" editing={false} form={form} onChange={upd} />
          <Field label="Email" value={user?.email} field="email" editing={false} form={form} onChange={upd} />
          <Field label="Phone" value={user?.phone} field="phone" editing={editing} form={form} onChange={upd} />
        </div>

        <p className="text-sm font-bold text-gray-700 mb-1">🏠 Home Delivery Address</p>
        <p className="text-xs text-blue-600 font-medium mb-2">Prescriptions will be delivered to this address.</p>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-3">
          <Field label="Street" value={user?.address_line1} field="address_line1" editing={editing} form={form} onChange={upd} />
          <Field label="Apt / Unit" value={user?.address_line2} field="address_line2" editing={editing} form={form} onChange={upd} />
          <Field label="City" value={user?.city} field="city" editing={editing} form={form} onChange={upd} />
          <Field label="State" value={user?.state} field="state" editing={editing} form={form} onChange={upd} />
          <Field label="ZIP Code" value={user?.zip_code} field="zip_code" editing={editing} form={form} onChange={upd} />
        </div>

        <p className="text-sm font-bold text-gray-700 mb-2">🏥 Insurance & Benefits</p>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-3">
          <Field label="Medicare ID" value={user?.medicare_id} field="medicare_id" editing={editing} form={form} onChange={upd} />
          <Field label="Medicaid ID" value={user?.medicaid_id} field="medicaid_id" editing={editing} form={form} onChange={upd} />
          <Field label="Insurance" value={user?.insurance_provider} field="insurance_provider" editing={editing} form={form} onChange={upd} />
          <Field label="Member ID" value={user?.insurance_member_id} field="insurance_member_id" editing={editing} form={form} onChange={upd} />
        </div>

        <p className="text-sm font-bold text-gray-700 mb-2 mt-4">⚙️ More Options</p>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          {[["My Appointments", "/appointments"], ["Emergency Contacts", "/emergency"], ["Family Circle", "/family"]].map(([label, path]) => (
            <button key={path} onClick={() => navigate(path)} className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-gray-50 last:border-0">
              <span className="font-medium text-gray-800 text-sm">{label}</span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}
        </div>

        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl mb-6"
          style={{ backgroundColor: "#ffebee", border: "1.5px solid rgba(229,57,53,0.3)" }}>
          <LogOut size={18} color="#c62828" />
          <span className="font-bold text-base" style={{ color: "#c62828" }}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}