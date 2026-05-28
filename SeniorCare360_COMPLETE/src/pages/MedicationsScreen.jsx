import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pill, Truck, Trash2, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  active: { bg: "#e8f5e9", text: "#2e7d32", border: "#2e7d32" },
  discontinued: { bg: "#f5f5f5", text: "#757575", border: "#9e9e9e" },
  refill_needed: { bg: "#fff8e1", text: "#f57f17", border: "#f57f17" },
  ready_for_pickup: { bg: "#e3f2fd", text: "#0277bd", border: "#0288d1" },
  ready_for_delivery: { bg: "#e3f2fd", text: "#1976a8", border: "#1976a8" },
};

const STATUS_LABELS = {
  active: "✅ Active",
  discontinued: "🚫 Discontinued",
  refill_needed: "⚠️ Needs Refill",
  ready_for_pickup: "🏪 Ready for Pickup",
  ready_for_delivery: "🚚 Ready to Deliver",
};

const EMPTY_FORM = { name: "", generic_name: "", dosage: "", frequency: "", prescriber: "", pharmacy_name: "", pharmacy_rx_number: "", refills_remaining: "0", instructions: "" };

export default function MedicationsScreen() {
  const navigate = useNavigate();
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { loadMeds(); }, []);

  const loadMeds = async () => {
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.Medication.filter({ created_by_id: user.id }, "-created_date");
      setMeds(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (med) => {
    if (!window.confirm(`Remove ${med.name} from your list?`)) return;
    await base44.entities.Medication.delete(med.id);
    setMeds(prev => prev.filter(m => m.id !== med.id));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("Please enter the medication name."); return; }
    setSaving(true);
    const newMed = await base44.entities.Medication.create({
      ...form,
      refills_remaining: parseInt(form.refills_remaining) || 0,
      status: "active"
    });
    setMeds(prev => [newMed, ...prev]);
    setShowModal(false);
    setForm(EMPTY_FORM);
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      <div className="text-white px-5 pt-12 pb-5 flex items-end justify-between" style={{ backgroundColor: "#1976a8" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="p-1"><ArrowLeft size={22} color="white" /></button>
          <div>
            <h1 className="text-xl font-bold">💊 My Medications</h1>
            <p className="text-blue-200 text-xs mt-0.5">{meds.length} prescription{meds.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
          <Plus size={22} color="white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        )}

        {!loading && meds.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <Pill size={48} className="text-gray-300 mb-3" />
            <p className="font-bold text-gray-400 text-lg">No medications yet</p>
            <p className="text-gray-400 text-sm mt-1">Tap + to add your prescriptions</p>
          </div>
        )}

        {meds.map(med => {
          const sc = STATUS_COLORS[med.status] || STATUS_COLORS.active;
          return (
            <div key={med.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#e3f2fd" }}>
                  <Pill size={22} color="#1976a8" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800">{med.name}</p>
                  {med.generic_name && <p className="text-xs text-gray-500 mt-0.5">{med.generic_name}</p>}
                </div>
                <button onClick={() => handleDelete(med)} className="p-1">
                  <Trash2 size={18} color="#e53935" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5 mb-3">
                {med.dosage && <p className="text-xs text-gray-500">⚖️ {med.dosage}</p>}
                {med.frequency && <p className="text-xs text-gray-500">⏰ {med.frequency}</p>}
                {med.pharmacy_name && <p className="text-xs text-gray-500">🏪 {med.pharmacy_name}</p>}
                <p className="text-xs text-gray-500">🔄 Refills remaining: {med.refills_remaining ?? 0}</p>
              </div>
              <div className="inline-block rounded-full px-3 py-1 mb-3 border" style={{ backgroundColor: sc.bg, borderColor: sc.border }}>
                <span className="text-xs font-semibold" style={{ color: sc.text }}>{STATUS_LABELS[med.status] || med.status}</span>
              </div>
              <button
                onClick={() => navigate("/delivery", { state: { med } })}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm"
                style={{ backgroundColor: "#1976a8" }}
              >
                <Truck size={16} color="white" />
                🚚 Deliver to My Home
              </button>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col max-w-md mx-auto">
          <div className="bg-white flex-1 overflow-y-auto mt-16 rounded-t-3xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Add Medication</h2>
              <button onClick={() => setShowModal(false)}><X size={22} className="text-gray-500" /></button>
            </div>
            <div className="p-5 pb-12">
              {[
                ["Medication Name *", "name", "e.g. Lisinopril"],
                ["Generic Name", "generic_name", "e.g. lisinopril"],
                ["Dosage", "dosage", "e.g. 10mg"],
                ["Frequency", "frequency", "e.g. Once daily in the morning"],
                ["Prescribing Doctor", "prescriber", "Dr. Smith"],
                ["Pharmacy Name", "pharmacy_name", "CVS Pharmacy"],
                ["Rx Number", "pharmacy_rx_number", "RX123456"],
                ["Refills Remaining", "refills_remaining", "3"],
                ["Special Instructions", "instructions", "Take with food"],
              ].map(([label, field, ph]) => (
                <div key={field} className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder={ph}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    type={field === "refills_remaining" ? "number" : "text"}
                  />
                </div>
              ))}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 rounded-xl text-white font-bold text-base mt-2 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1976a8" }}
              >
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : "Save Medication"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}