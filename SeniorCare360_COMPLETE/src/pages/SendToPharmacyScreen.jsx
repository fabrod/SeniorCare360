import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Store, Upload, CheckCircle, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PHARMACIES = [
  { name: "CVS Pharmacy", phone: "1-800-746-7287" },
  { name: "Walgreens", phone: "1-800-925-4733" },
  { name: "Rite Aid", phone: "1-800-748-3243" },
  { name: "Walmart Pharmacy", phone: "1-800-2-REFILL" },
  { name: "Costco Pharmacy", phone: "1-800-955-2292" },
];

export default function SendToPharmacyScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedMed = location.state?.med;

  const [meds, setMeds] = useState([]);
  const [selectedMed, setSelectedMed] = useState(passedMed || null);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [customPharmacy, setCustomPharmacy] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [pickupOrSend, setPickupOrSend] = useState("pickup"); // "pickup" | "send"
  const [notes, setNotes] = useState("");
  const [prescriptionUrl, setPrescriptionUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!passedMed) loadMeds();
  }, []);

  const loadMeds = async () => {
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.Medication.filter({ created_by_id: user.id, status: "active" }, "-created_date");
      setMeds(data);
      if (data.length > 0) setSelectedMed(data[0]);
    } catch (e) { console.error(e); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPrescriptionUrl(file_url);
    } catch (err) {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMed) { alert("Please select a medication."); return; }
    const pharmacy = useCustom ? customPharmacy.trim() : selectedPharmacy?.name;
    if (!pharmacy) { alert("Please select or enter a pharmacy."); return; }
    setLoading(true);
    const instructions = [
      `Type: ${pickupOrSend === "pickup" ? "In-store Pickup" : "Send to Pharmacy for Processing"}`,
      pharmacy ? `Pharmacy: ${pharmacy}` : "",
      prescriptionUrl ? `Prescription image attached` : "",
      notes ? `Notes: ${notes}` : "",
    ].filter(Boolean).join(" | ");

    await base44.entities.DeliveryRequest.create({
      medication_name: selectedMed.name,
      medication_id: selectedMed.id,
      delivery_address: `Pharmacy: ${pharmacy}`,
      special_instructions: instructions,
      status: "pending",
      estimated_arrival: pickupOrSend === "pickup" ? "Ready in 1–2 hours" : "1–2 business days",
      description: prescriptionUrl ? `Prescription image: ${prescriptionUrl}` : "",
    });
    setLoading(false);
    setDone(true);
  };

  const pharmacy = useCustom ? customPharmacy : selectedPharmacy?.name;

  if (done) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center">
        <CheckCircle size={72} color="#2e7d32" className="mb-4" />
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
          {pickupOrSend === "pickup" ? "Pickup Requested! 🏪" : "Sent to Pharmacy! 📤"}
        </h2>
        <p className="text-gray-500 mb-8">
          {pickupOrSend === "pickup"
            ? "Your prescription will be ready for pickup soon."
            : "Your prescription has been sent to the pharmacy for processing."}
        </p>
        <div className="bg-white rounded-2xl p-5 w-full shadow-sm text-left mb-6 space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Medication</p>
            <p className="font-semibold text-gray-800 mt-1">{selectedMed?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Pharmacy</p>
            <p className="font-semibold text-gray-800 mt-1">{pharmacy}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Ready</p>
            <p className="font-semibold text-gray-800 mt-1">
              {pickupOrSend === "pickup" ? "1–2 hours" : "1–2 business days"}
            </p>
          </div>
        </div>
        <button onClick={() => navigate("/medications")} className="w-full py-4 rounded-xl text-white font-bold" style={{ backgroundColor: "#1976a8" }}>
          ← Back to Medications
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      <div className="text-white px-5 pt-12 pb-5 flex items-end gap-3" style={{ backgroundColor: "#1976a8" }}>
        <button onClick={() => navigate("/medications")} className="p-1"><ArrowLeft size={22} color="white" /></button>
        <h1 className="text-xl font-bold">🏪 Send to Pharmacy</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-10">

        {/* Medication */}
        {passedMed ? (
          <div className="bg-white rounded-2xl p-4 flex items-center gap-4 mb-5 shadow-sm">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#e3f2fd" }}>
              <span className="text-2xl">💊</span>
            </div>
            <div>
              <p className="font-bold text-gray-800">{passedMed.name}</p>
              {passedMed.dosage && <p className="text-sm text-gray-500 mt-0.5">{passedMed.dosage}</p>}
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <p className="font-bold text-gray-800 mb-2">💊 Select Medication</p>
            {meds.length === 0 ? (
              <p className="text-sm text-gray-400">No active medications. Add medications first.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {meds.map(m => (
                  <button key={m.id} onClick={() => setSelectedMed(m)}
                    className="p-3 rounded-xl border-2 text-left"
                    style={{ borderColor: selectedMed?.id === m.id ? "#1976a8" : "#e0e0e0", backgroundColor: selectedMed?.id === m.id ? "#e3f2fd" : "white" }}>
                    <p className="font-semibold text-gray-800">{m.name}</p>
                    {m.dosage && <p className="text-xs text-gray-500">{m.dosage}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Request Type */}
        <p className="font-bold text-gray-800 mb-2">📋 What would you like to do?</p>
        <div className="flex gap-3 mb-5">
          {[["pickup", "🏪 Pickup In-Store"], ["send", "📤 Send for Processing"]].map(([val, label]) => (
            <button key={val} onClick={() => setPickupOrSend(val)}
              className="flex-1 py-3 rounded-xl border-2 text-sm font-semibold text-center"
              style={{ borderColor: pickupOrSend === val ? "#1976a8" : "#e0e0e0", backgroundColor: pickupOrSend === val ? "#e3f2fd" : "white", color: pickupOrSend === val ? "#1976a8" : "#555" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Pharmacy Selection */}
        <p className="font-bold text-gray-800 mb-2">🏥 Select Pharmacy</p>
        <div className="flex flex-col gap-2 mb-3">
          {PHARMACIES.map(ph => (
            <button key={ph.name} onClick={() => { setSelectedPharmacy(ph); setUseCustom(false); }}
              className="p-3 rounded-xl border-2 text-left"
              style={{ borderColor: !useCustom && selectedPharmacy?.name === ph.name ? "#1976a8" : "#e0e0e0", backgroundColor: !useCustom && selectedPharmacy?.name === ph.name ? "#e3f2fd" : "white" }}>
              <p className="font-semibold text-gray-800 text-sm">{ph.name}</p>
              <p className="text-xs text-gray-400">{ph.phone}</p>
            </button>
          ))}
          <button onClick={() => setUseCustom(true)}
            className="p-3 rounded-xl border-2 text-left"
            style={{ borderColor: useCustom ? "#1976a8" : "#e0e0e0", backgroundColor: useCustom ? "#e3f2fd" : "white" }}>
            <p className="font-semibold text-gray-800 text-sm">✏️ Other / My Pharmacy</p>
          </button>
        </div>

        {useCustom && (
          <input className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-blue-500 mb-4"
            placeholder="Enter pharmacy name or address" value={customPharmacy} onChange={e => setCustomPharmacy(e.target.value)} />
        )}

        {/* Upload Prescription */}
        <p className="font-bold text-gray-800 mb-2 mt-2">📷 Attach Prescription (optional)</p>
        <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl p-5 mb-4 cursor-pointer bg-white hover:border-blue-400 transition-colors">
          {uploading ? (
            <><Loader2 size={28} className="animate-spin text-blue-400 mb-2" /><p className="text-sm text-gray-500">Uploading...</p></>
          ) : prescriptionUrl ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <img src={prescriptionUrl} alt="Prescription" className="max-h-32 rounded-xl object-contain" />
              <button type="button" onClick={(e) => { e.preventDefault(); setPrescriptionUrl(null); }} className="text-xs text-red-500 flex items-center gap-1"><X size={12} /> Remove</button>
            </div>
          ) : (
            <><Upload size={28} className="text-gray-400 mb-2" /><p className="text-sm text-gray-500">Tap to upload a photo of your prescription</p><p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF</p></>
          )}
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} />
        </label>

        {/* Notes */}
        <p className="font-bold text-gray-800 mb-2">📝 Additional Notes (optional)</p>
        <textarea className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-blue-500 mb-5 resize-none"
          rows={3} placeholder="e.g. Please call when ready, generic is okay" value={notes} onChange={e => setNotes(e.target.value)} />

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-5 rounded-2xl text-white font-extrabold text-base flex items-center justify-center gap-2"
          style={{ backgroundColor: "#1976a8", boxShadow: "0 4px 16px rgba(25,118,168,0.4)" }}>
          {loading ? <><Loader2 size={20} className="animate-spin" /> Sending...</> : <><Store size={20} color="white" /> {pickupOrSend === "pickup" ? "Request Pickup" : "Send to Pharmacy"}</>}
        </button>
      </div>
    </div>
  );
}