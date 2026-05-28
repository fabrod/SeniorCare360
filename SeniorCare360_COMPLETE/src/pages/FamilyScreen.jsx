import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EMPTY_FORM = { name: "", member_relationship: "", email: "", phone: "", can_view_medications: true, can_view_vitals: true, can_receive_sos: true };

export default function FamilyScreen() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.FamilyMember.filter({ created_by_id: user.id }, "-created_date");
      setMembers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!form.name.trim()) { alert("Please enter your family member's name."); return; }
    if (!form.email.trim() && !form.phone.trim()) { alert("Please enter an email or phone number."); return; }
    setSaving(true);
    const newMember = await base44.entities.FamilyMember.create({ ...form, invite_accepted: false });
    setMembers(prev => [...prev, newMember]);
    setShowModal(false);
    setForm(EMPTY_FORM);
    setSaving(false);
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Remove ${m.name} from your circle?`)) return;
    await base44.entities.FamilyMember.delete(m.id);
    setMembers(prev => prev.filter(x => x.id !== m.id));
  };

  const toggle = (key) => setForm(f => ({ ...f, [key]: !f[key] }));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      <div className="text-white px-5 pt-12 pb-5 flex items-end justify-between" style={{ backgroundColor: "#1976a8" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="p-1"><ArrowLeft size={22} color="white" /></button>
          <div>
            <h1 className="text-xl font-bold">👨‍👩‍👧 Family Circle</h1>
            <p className="text-blue-200 text-xs mt-0.5">{members.length} trusted contact{members.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
          <Plus size={22} color="white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-gray-500 mb-4">Add trusted people who can help monitor medications, vitals, and emergency alerts.</p>

        {loading && <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>}

        {!loading && members.length === 0 && (
          <div className="text-center py-16">
            <p className="font-bold text-gray-400 text-lg">No family members yet</p>
            <p className="text-gray-400 text-sm mt-1">Tap + to invite someone you trust</p>
          </div>
        )}

        {members.map(m => (
          <div key={m.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 mb-3 shadow-sm">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg" style={{ backgroundColor: "#9c27b0" }}>
              {m.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800">{m.name}</p>
              {m.member_relationship && <p className="text-xs text-gray-500">{m.member_relationship}</p>}
              {m.email && <p className="text-xs text-gray-500">{m.email}</p>}
              {m.phone && <p className="text-xs text-gray-500">{m.phone}</p>}
              <span className={`text-xs font-semibold mt-1 inline-block ${m.invite_accepted ? "text-green-600" : "text-orange-500"}`}>
                {m.invite_accepted ? "Connected" : "Invite pending"}
              </span>
            </div>
            <button onClick={() => handleDelete(m)} className="p-2"><Trash2 size={18} color="#e53935" /></button>
          </div>
        ))}

        <button onClick={() => navigate("/emergency")} className="w-full flex items-center justify-between bg-white rounded-2xl p-4 mt-2 shadow-sm">
          <span className="font-semibold text-gray-800">Manage Emergency Contacts</span>
          <ChevronRight size={18} className="text-gray-400" />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col max-w-md mx-auto">
          <div className="bg-white flex-1 overflow-y-auto mt-16 rounded-t-3xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Invite Family Member</h2>
              <button onClick={() => setShowModal(false)}><X size={22} className="text-gray-500" /></button>
            </div>
            <div className="p-5 pb-12">
              {[["Full Name *", "name", "text"], ["Relationship", "member_relationship", "text"], ["Email", "email", "email"], ["Phone", "phone", "tel"]].map(([label, field, type]) => (
                <div key={field} className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <input type={type} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder={label} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                </div>
              ))}
              {[["can_view_medications", "Can view medications"], ["can_view_vitals", "Can view health vitals"], ["can_receive_sos", "Can receive SOS alerts"]].map(([key, label]) => (
                <button key={key} onClick={() => toggle(key)} className="flex items-center gap-3 w-full p-3 rounded-xl mb-2" style={{ backgroundColor: form[key] ? "#e3f2fd" : "#f5f5f5" }}>
                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center" style={{ borderColor: form[key] ? "#1976a8" : "#9e9e9e", backgroundColor: form[key] ? "#1976a8" : "transparent" }}>
                    {form[key] && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-sm text-gray-700">{label}</span>
                </button>
              ))}
              <button onClick={handleInvite} disabled={saving}
                className="w-full py-4 rounded-xl text-white font-bold text-base mt-4 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#9c27b0" }}>
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}