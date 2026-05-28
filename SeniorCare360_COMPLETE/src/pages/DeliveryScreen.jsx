import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Truck, Home, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DeliveryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedMed = location.state?.med;

  const [meds, setMeds] = useState([]);
  const [selectedMed, setSelectedMed] = useState(passedMed || null);
  const [useHome, setUseHome] = useState(true);
  const [customAddress, setCustomAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [userAddress, setUserAddress] = useState("123 Main Street, Orlando, FL 32801");

  useEffect(() => {
    if (!passedMed) {
      loadMeds();
    }
    loadUserAddress();
  }, []);

  const loadMeds = async () => {
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.Medication.filter({ created_by_id: user.id, status: "active" }, "-created_date");
      setMeds(data);
      if (data.length > 0) setSelectedMed(data[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUserAddress = async () => {
    try {
      const user = await base44.auth.me();
      if (user.address_line1) {
        setUserAddress(`${user.address_line1}${user.address_line2 ? ", " + user.address_line2 : ""}, ${user.city || ""}, ${user.state || ""} ${user.zip_code || ""}`.trim());
      }
    } catch (e) {}
  };

  const handleRequest = async () => {
    if (!selectedMed) { alert("Please select a medication."); return; }
    if (!useHome && !customAddress.trim()) { alert("Please enter a delivery address."); return; }
    setLoading(true);
    await base44.entities.DeliveryRequest.create({
      medication_name: selectedMed.name,
      medication_id: selectedMed.id,
      delivery_address: useHome ? userAddress : customAddress,
      special_instructions: notes,
      status: "pending",
      estimated_arrival: "2-3 business days",
    });
    setLoading(false);
    setDelivered(true);
  };

  if (delivered) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center">
        <CheckCircle size={72} color="#2e7d32" className="mb-4" />
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Delivery Requested! 🎉</h2>
        <p className="text-gray-500 mb-8">Your prescription is on its way home.</p>
        <div className="bg-white rounded-2xl p-5 w-full shadow-sm text-left mb-6">
          <div className="mb-3">
            <p className="text-xs text-gray-400 uppercase font-semibold">Medication</p>
            <p className="font-semibold text-gray-800 mt-1">{selectedMed?.name}</p>
          </div>
          <div className="mb-3">
            <p className="text-xs text-gray-400 uppercase font-semibold">Delivery Address</p>
            <p className="font-semibold text-gray-800 mt-1">{useHome ? userAddress : customAddress}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Estimated Arrival</p>
            <p className="font-semibold text-gray-800 mt-1">2–3 business days</p>
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
        <h1 className="text-xl font-bold">🚚 Request Delivery</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-8">
        {/* Medication Selection */}
        {passedMed ? (
          <div className="bg-white rounded-2xl p-4 flex items-center gap-4 mb-5 shadow-sm">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#e3f2fd" }}>
              <span className="text-2xl">💊</span>
            </div>
            <div>
              <p className="font-bold text-gray-800">{passedMed.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{passedMed.dosage}</p>
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <p className="font-bold text-gray-800 mb-2">💊 Select Medication</p>
            {meds.length === 0 ? (
              <p className="text-sm text-gray-400">No active medications found. Add medications first.</p>
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

        <p className="font-bold text-gray-800 mb-3">📍 Delivery Address</p>
        <button onClick={() => setUseHome(true)} className="w-full flex items-start gap-3 p-4 rounded-xl mb-3 border-2 text-left"
          style={{ borderColor: useHome ? "#1976a8" : "#e0e0e0", backgroundColor: useHome ? "#e3f2fd" : "white" }}>
          <Home size={20} color={useHome ? "#1976a8" : "#9e9e9e"} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-800 text-sm">🏠 My Home Address</p>
            <p className="text-xs text-gray-500 mt-0.5">{userAddress}</p>
          </div>
        </button>
        <button onClick={() => setUseHome(false)} className="w-full flex items-start gap-3 p-4 rounded-xl mb-3 border-2 text-left"
          style={{ borderColor: !useHome ? "#1976a8" : "#e0e0e0", backgroundColor: !useHome ? "#e3f2fd" : "white" }}>
          <MapPin size={20} color={!useHome ? "#1976a8" : "#9e9e9e"} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-800 text-sm">📝 Different Address</p>
            <p className="text-xs text-gray-500 mt-0.5">Enter a custom delivery address</p>
          </div>
        </button>

        {!useHome && (
          <textarea className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-blue-500 mb-4 resize-none"
            rows={3} placeholder="Enter delivery address" value={customAddress} onChange={e => setCustomAddress(e.target.value)} />
        )}

        <p className="font-bold text-gray-800 mb-2 mt-3">📝 Special Instructions (optional)</p>
        <textarea className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-blue-500 mb-4 resize-none"
          rows={3} placeholder="e.g. Leave at front door, ring doorbell" value={notes} onChange={e => setNotes(e.target.value)} />

        <div className="flex gap-3 items-start rounded-xl p-4 mb-6" style={{ backgroundColor: "#e3f2fd" }}>
          <Truck size={18} color="#1976a8" className="flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">Estimated delivery: 2–3 business days. You'll receive a notification when your prescription ships and when it arrives.</p>
        </div>

        <button onClick={handleRequest} disabled={loading}
          className="w-full py-5 rounded-2xl text-white font-extrabold text-base flex items-center justify-center gap-2"
          style={{ backgroundColor: "#1976a8", boxShadow: "0 4px 16px rgba(25,118,168,0.4)" }}>
          {loading ? <><Loader2 size={20} className="animate-spin" /> Requesting...</> : <><Truck size={20} color="white" /> Request Home Delivery</>}
        </button>
      </div>
    </div>
  );
}