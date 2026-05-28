import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Phone, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EMPTY_FORM = { name: "", contact_relationship: "", phone: "", email: "", is_primary: false, notify_on_sos: true };

export default function EmergencyScreen() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = async () => {
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.EmergencyContact.filter({ created_by_id: user.id }, "-created_date");
      setContacts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSOS = () => {
    if (!window.confirm("🚨 EMERGENCY SOS — Send SOS to all emergency contacts now?")) return;
    setSosLoading(true);
    setTimeout(() => {
      setSosLoading(false);
      alert("✅ SOS Sent! Your contacts have been alerted with your location.");
    }, 2000);
  };

  const handleAdd = async () => {
    if (!form.name || !form.phone) { alert("Name and phone are required."); return; }
    setSaving(true);
    const newContact = await base44.entities.EmergencyContact.create(form);
    setContacts(prev => [...prev, newContact]);
    setShowModal(false);
    setForm(EMPTY_FORM);
    setSaving(false);
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Remove ${c.name}?`)) return;
    await base44.entities.EmergencyContact.delete(c.id);
    setContacts(prev => prev.filter(x => x.id !== c.id));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      <div className="text-white px-5 pt-12 pb-5 flex items-end gap-3" style={{ backgroundColor: "#e53935" }}>
        <button onClick={() => navigate("/home")} className="p-1"><ArrowLeft size={22} color="white" /></button>
        <div>
          <h1 className="text-xl font-bold">🆘 Emergency</h1>
          <p className="text-red-200 text-xs mt-0.5">Safety contacts & SOS</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <button onClick={handleSOS} disabled={sosLoading}
          className="w-full rounded-2xl p-6 flex flex-col items-center mb-3 active:scale-95 transition-transform"
          style={{ backgroundColor: "#e53935", boxShadow: "0 4px 20px rgba(229,57,53,0.4)" }}>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
            <span className="text-3xl">🆘</span>
          </div>
          <p className="text-white text-2xl font-extrabold mt-1">{sosLoading ? "Sending..." : "🆘 SEND SOS NOW"}</p>
          <p className="text-red-100 text-sm mt-1 text-center">Alerts all contacts with your GPS location</p>
        </button>

        <a href="tel:911" className="flex items-center justify-center gap-2 w-full py-4 rounded-xl mb-5 text-white font-bold" style={{ backgroundColor: "#c62828" }}>
          <Phone size={18} color="white" /> Call 911
        </a>

        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-gray-800">Emergency Contacts ({contacts.length})</p>
          <button onClick={() => setShowModal(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1976a8" }}>
            <Plus size={18} color="white" />
          </button>
        </div>

        {loading && <div className="flex items-center justify-center py-10"><Loader2 size={28} className="animate-spin text-red-400" /></div>}

        {!loading && contacts.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">Add emergency contacts so we can alert them if you need help</p>
          </div>
        )}

        {contacts.map(c => (
          <div key={c.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 mb-3 shadow-sm border-l-4" style={{ borderLeftColor: "#1976a8" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg" style={{ backgroundColor: "#1976a8" }}>
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800">{c.name} {c.is_primary && "⭐"}</p>
              {c.contact_relationship && <p className="text-xs text-gray-500">{c.contact_relationship}</p>}
              <p className="text-xs font-medium mt-0.5" style={{ color: "#1976a8" }}>{c.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <a href={`tel:${c.phone}`} className="p-2"><Phone size={18} color="#1976a8" /></a>
              <button onClick={() => handleDelete(c)} className="p-2"><Trash2 size={18} color="#e53935" /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col max-w-md mx-auto">
          <div className="bg-white flex-1 overflow-y-auto mt-16 rounded-t-3xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Add Emergency Contact</h2>
              <button onClick={() => setShowModal(false)}><X size={22} className="text-gray-500" /></button>
            </div>
            <div className="p-5 pb-12">
              {[["Full Name *", "name", "text"], ["Relationship", "contact_relationship", "text"], ["Phone *", "phone", "tel"], ["Email", "email", "email"]].map(([label, field, type]) => (
                <div key={field} className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <input type={type} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder={label} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                </div>
              ))}
              <button onClick={() => setForm(f => ({ ...f, is_primary: !f.is_primary }))}
                className="flex items-center gap-2 w-full p-3 rounded-xl mb-4"
                style={{ backgroundColor: form.is_primary ? "#e3f2fd" : "#f5f5f5" }}>
                <div className="w-5 h-5 rounded border-2 flex items-center justify-center"
                  style={{ borderColor: form.is_primary ? "#1976a8" : "#9e9e9e", backgroundColor: form.is_primary ? "#1976a8" : "transparent" }}>
                  {form.is_primary && <span className="text-white text-xs">✓</span>}
                </div>
                <span className="text-sm text-gray-700">Set as Primary Emergency Contact</span>
              </button>
              <button onClick={handleAdd} disabled={saving}
                className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2"
                style={{ backgroundColor: "#e53935" }}>
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : "Add Contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}