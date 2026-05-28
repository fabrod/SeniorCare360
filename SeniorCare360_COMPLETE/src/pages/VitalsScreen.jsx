import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const VITAL_TYPES = [
  { key: "blood_pressure", label: "Blood Pressure", unit: "mmHg", color: "#e53935", hasSecondary: true, primaryLabel: "Systolic", secondaryLabel: "Diastolic" },
  { key: "glucose", label: "Blood Glucose", unit: "mg/dL", color: "#0288d1", hasSecondary: false },
  { key: "heart_rate", label: "Heart Rate", unit: "bpm", color: "#e53935", hasSecondary: false },
  { key: "weight", label: "Weight", unit: "lbs", color: "#1976a8", hasSecondary: false },
  { key: "oxygen_saturation", label: "Oxygen (SpO2)", unit: "%", color: "#2e7d32", hasSecondary: false },
  { key: "temperature", label: "Temperature", unit: "°F", color: "#f57f17", hasSecondary: false },
];

export default function VitalsScreen() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(VITAL_TYPES[0]);
  const [allVitals, setAllVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [primaryVal, setPrimaryVal] = useState("");
  const [secondaryVal, setSecondaryVal] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadVitals(); }, []);

  const loadVitals = async () => {
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.Vital.filter({ created_by_id: user.id }, "recorded_at", 100);
      setAllVitals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentVitals = allVitals
    .filter(v => v.vital_type === selectedType.key)
    .sort((a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date))
    .map(v => ({
      ...v,
      date: format(new Date(v.recorded_at || v.created_date), "MMM d"),
    }));

  const latest = currentVitals[currentVitals.length - 1];

  const handleLog = async () => {
    if (!primaryVal) { alert(`Enter ${selectedType.primaryLabel || "value"}`); return; }
    setSaving(true);
    const entry = await base44.entities.Vital.create({
      vital_type: selectedType.key,
      value_primary: parseFloat(primaryVal),
      value_secondary: secondaryVal ? parseFloat(secondaryVal) : undefined,
      unit: selectedType.unit,
      notes,
      recorded_at: new Date().toISOString(),
    });
    setAllVitals(prev => [...prev, entry]);
    setShowModal(false);
    setPrimaryVal(""); setSecondaryVal(""); setNotes("");
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      <div className="text-white px-5 pt-12 pb-5" style={{ backgroundColor: "#e53935" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="p-1"><ArrowLeft size={22} color="white" /></button>
          <div>
            <h1 className="text-xl font-bold">❤️ Health Vitals</h1>
            <p className="text-red-200 text-xs mt-0.5">Track your health readings</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-2 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {VITAL_TYPES.map(vt => (
              <button key={vt.key} onClick={() => setSelectedType(vt)}
                className="px-3 py-2 rounded-full text-xs font-semibold border-2 whitespace-nowrap transition-all"
                style={selectedType.key === vt.key
                  ? { backgroundColor: vt.color, borderColor: vt.color, color: "white" }
                  : { backgroundColor: "white", borderColor: "#e0e0e0", color: "#333" }}
              >{vt.label}</button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-red-400" /></div>
          ) : (
            <>
              {latest ? (
                <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm border-t-4" style={{ borderTopColor: selectedType.color }}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Latest Reading</p>
                  <p className="font-extrabold text-5xl" style={{ color: selectedType.color }}>
                    {latest.value_primary}
                    {selectedType.hasSecondary && latest.value_secondary ? `/${latest.value_secondary}` : ""}
                    <span className="text-xl font-semibold text-gray-400 ml-1">{selectedType.unit}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">{latest.date}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 mb-3 shadow-sm text-center">
                  <p className="text-gray-400">No {selectedType.label} readings yet</p>
                </div>
              )}

              {currentVitals.length > 1 && (
                <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                  <p className="font-bold text-gray-800 mb-3">{selectedType.label} Trend</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={currentVitals}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip formatter={(v) => [`${v} ${selectedType.unit}`]} />
                      <Line type="monotone" dataKey="value_primary" stroke={selectedType.color} strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <p className="font-bold text-gray-800 mb-3 mt-1">Recent Readings</p>
              {[...currentVitals].reverse().slice(0, 10).map((v, i) => (
                <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 mb-2 shadow-sm">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedType.color }} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">
                      {v.value_primary}{selectedType.hasSecondary && v.value_secondary ? `/${v.value_secondary}` : ""} {selectedType.unit}
                    </p>
                    {v.notes && <p className="text-xs text-gray-400 mt-0.5">{v.notes}</p>}
                  </div>
                  <p className="text-xs text-gray-400">{v.date}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <button onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-1/2 translate-x-20 w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
        style={{ backgroundColor: selectedType.color }}>
        <Plus size={26} color="white" />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col max-w-md mx-auto">
          <div className="bg-white flex-1 overflow-y-auto mt-16 rounded-t-3xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Log {selectedType.label}</h2>
              <button onClick={() => setShowModal(false)}><X size={22} className="text-gray-500" /></button>
            </div>
            <div className="p-5 pb-12">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{selectedType.primaryLabel || "Value"} ({selectedType.unit})</label>
              <input className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-blue-500 mb-4"
                type="number" value={primaryVal} onChange={e => setPrimaryVal(e.target.value)} placeholder="Enter value" />
              {selectedType.hasSecondary && (
                <>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{selectedType.secondaryLabel} (mmHg)</label>
                  <input className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-blue-500 mb-4"
                    type="number" value={secondaryVal} onChange={e => setSecondaryVal(e.target.value)} placeholder="Enter value" />
                </>
              )}
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
              <input className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-blue-500 mb-6"
                value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
              <button onClick={handleLog} disabled={saving}
                className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2"
                style={{ backgroundColor: selectedType.color }}>
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : "Save Reading"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}