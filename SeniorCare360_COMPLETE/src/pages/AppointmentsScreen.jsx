import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Trash2, Check, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { base44 } from "@/api/base44Client";

const EMPTY_FORM = { doctor_name: "", specialty: "", clinic_name: "", address: "", phone: "", notes: "" };

export default function AppointmentsScreen() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [apptDate, setApptDate] = useState(() => {
    const d = addDays(new Date(), 1);
    d.setHours(10, 0, 0, 0);
    return d;
  });

  useEffect(() => { loadAppointments(); }, []);

  const loadAppointments = async () => {
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.Appointment.filter({ created_by_id: user.id }, "appointment_date", 50);
      setAppointments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.doctor_name.trim()) { alert("Please enter the doctor's name."); return; }
    setSaving(true);
    const newAppt = await base44.entities.Appointment.create({ ...form, appointment_date: apptDate.toISOString(), is_completed: false });
    setAppointments(prev => [...prev, newAppt]);
    setShowModal(false);
    setForm(EMPTY_FORM);
    setSaving(false);
  };

  const handleComplete = async (id) => {
    await base44.entities.Appointment.update(id, { is_completed: true });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, is_completed: true } : a));
  };

  const handleDelete = async (appt) => {
    if (!window.confirm(`Remove appointment with ${appt.doctor_name}?`)) return;
    await base44.entities.Appointment.delete(appt.id);
    setAppointments(prev => prev.filter(a => a.id !== appt.id));
  };

  const displayed = appointments.filter(a => showAll || !a.is_completed);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      <div className="text-white px-5 pt-12 pb-5 flex items-end justify-between" style={{ backgroundColor: "#1976a8" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="p-1"><ArrowLeft size={22} color="white" /></button>
          <div>
            <h1 className="text-xl font-bold">📅 My Appointments</h1>
            <p className="text-blue-200 text-xs mt-0.5">{appointments.length} total</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
          <Plus size={22} color="white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>}

        {!loading && appointments.length === 0 && (
          <div className="text-center py-20">
            <p className="font-bold text-gray-400 text-lg">No appointments yet</p>
            <p className="text-gray-400 text-sm mt-1">Tap + to schedule your first doctor visit</p>
          </div>
        )}

        {!loading && appointments.length > 0 && (
          <button onClick={() => setShowAll(v => !v)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-sm font-medium text-gray-600 mb-4 shadow-sm">
            {showAll ? "Show Upcoming Only" : "Show All (including completed)"}
          </button>
        )}

        {displayed.map(a => (
          <div key={a.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-bold text-gray-800">{a.doctor_name}</p>
                {a.specialty && <p className="text-xs text-blue-600 font-medium mt-0.5">{a.specialty}</p>}
                {a.clinic_name && <p className="text-xs text-gray-500 mt-1">🏥 {a.clinic_name}</p>}
              </div>
              <button onClick={() => handleDelete(a)} className="p-1 ml-2"><Trash2 size={16} color="#e53935" /></button>
            </div>
            <p className="text-xs text-gray-600 mt-2">📅 {format(new Date(a.appointment_date), "EEEE, MMMM d, yyyy")}</p>
            <p className="text-xs text-gray-600 mt-0.5">🕐 {format(new Date(a.appointment_date), "h:mm a")}</p>
            {a.notes && <p className="text-xs text-gray-500 mt-1">📝 {a.notes}</p>}
            <div className="mt-3">
              {!a.is_completed ? (
                <button onClick={() => handleComplete(a.id)} className="px-4 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1" style={{ backgroundColor: "#2e7d32" }}>
                  <Check size={14} /> Mark Done
                </button>
              ) : (
                <span className="text-xs font-semibold text-green-600">✅ Completed</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col max-w-md mx-auto">
          <div className="bg-white flex-1 overflow-y-auto mt-16 rounded-t-3xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Add Appointment</h2>
              <button onClick={() => setShowModal(false)}><X size={22} className="text-gray-500" /></button>
            </div>
            <div className="p-5 pb-12">
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Date & Time</label>
              <input type="datetime-local"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-blue-500 mb-4"
                value={format(apptDate, "yyyy-MM-dd'T'HH:mm")}
                onChange={e => setApptDate(new Date(e.target.value))} />
              {[
                ["Doctor Name *", "doctor_name", "Dr. Sarah Johnson"],
                ["Specialty", "specialty", "Cardiology"],
                ["Clinic / Hospital", "clinic_name", "Orlando Health"],
                ["Address", "address", "123 Medical Blvd"],
                ["Phone", "phone", "(407) 555-0100"],
                ["Notes", "notes", "Bring medication list"],
              ].map(([label, field, ph]) => (
                <div key={field} className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <input className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder={ph} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                </div>
              ))}
              <button onClick={handleAdd} disabled={saving}
                className="w-full py-4 rounded-xl text-white font-bold text-base mt-2 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1976a8" }}>
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : "📅 Save Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}