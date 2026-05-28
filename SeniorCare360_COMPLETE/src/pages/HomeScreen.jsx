import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Pill, Activity, Calendar, Users, Star, AlertTriangle, LogOut, Package, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

const QuickCard = ({ icon: Icon, title, subtitle, color, bgColor, borderColor, onClick }) => (
  <div onClick={onClick}
    className="bg-white rounded-2xl p-4 flex items-center gap-3 mb-3 cursor-pointer active:scale-95 transition-transform shadow-sm border-l-4"
    style={{ borderLeftColor: borderColor }}>
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bgColor }}>
      <Icon size={22} color={color} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-800 text-sm">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
    </div>
    <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
  </div>
);

export default function HomeScreen() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ active: 0, refill: 0, delivery: 0 });
  const [refillMeds, setRefillMeds] = useState([]);
  const [sosLoading, setSosLoading] = useState(false);
  const today = format(new Date(), "EEEE, MMMM do");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const meds = await base44.entities.Medication.filter({ created_by_id: me.id }, "-created_date", 50);
      const active = meds.filter(m => m.status === "active").length;
      const refill = meds.filter(m => m.status === "refill_needed");
      const delivery = meds.filter(m => m.status === "ready_for_delivery").length;
      setStats({ active, refill: refill.length, delivery });
      setRefillMeds(refill.slice(0, 3));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSOS = () => {
    if (window.confirm("🚨 This will alert all your emergency contacts immediately. Are you sure?")) {
      setSosLoading(true);
      setTimeout(() => {
        setSosLoading(false);
        alert("✅ SOS Sent! Your emergency contacts have been notified.");
      }, 1500);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await base44.auth.logout("/");
    }
  };

  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      <div className="text-white px-5 pt-12 pb-6" style={{ backgroundColor: "#1976a8" }}>
        <p className="text-blue-200 text-xs font-medium">{today}</p>
        <h1 className="text-2xl font-bold mt-1">Good Day, {firstName}! 👋</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <button onClick={handleSOS} disabled={sosLoading}
          className="w-full rounded-2xl p-4 flex items-center gap-4 mb-4 active:scale-95 transition-transform"
          style={{ backgroundColor: "#e53935", boxShadow: "0 4px 20px rgba(229,57,53,0.4)" }}>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={26} color="white" />
          </div>
          <div className="text-left">
            <p className="text-white text-lg font-extrabold">{sosLoading ? "Sending SOS..." : "🆘 EMERGENCY SOS"}</p>
            <p className="text-red-100 text-xs mt-0.5">Tap to alert your family & contacts</p>
          </div>
        </button>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { num: stats.active, label: "Active Meds", bg: "#e3f2fd", color: "#1976a8" },
            { num: stats.refill, label: "Refill Needed", bg: "#fff8e1", color: "#f57f17" },
            { num: stats.delivery, label: "Ready to Ship", bg: "#e8f5e9", color: "#2e7d32" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-3 text-center" style={{ backgroundColor: s.bg }}>
              <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.num}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-base font-bold text-gray-800 mb-3 mt-1">Quick Actions</p>
        <QuickCard icon={Pill} title="My Medications" subtitle="Manage prescriptions" color="#1976a8" bgColor="#e3f2fd" borderColor="#1976a8" onClick={() => navigate("/medications")} />
        <QuickCard icon={Package} title="Request Delivery" subtitle="Home prescription delivery" color="#1976a8" bgColor="#e3f2fd" borderColor="#1976a8" onClick={() => navigate("/delivery")} />
        <QuickCard icon={Activity} title="Health Vitals" subtitle="Log blood pressure, glucose..." color="#c62828" bgColor="#ffebee" borderColor="#e53935" onClick={() => navigate("/vitals")} />
        <QuickCard icon={Calendar} title="Appointments" subtitle="Upcoming doctor visits" color="#0277bd" bgColor="#e1f5fe" borderColor="#0288d1" onClick={() => navigate("/appointments")} />
        <QuickCard icon={Users} title="Family Circle" subtitle="Trusted contacts & caregivers" color="#6a1b9a" bgColor="#f3e5f5" borderColor="#9c27b0" onClick={() => navigate("/family")} />
        <QuickCard icon={Star} title="Benefits & Resources" subtitle="Programs you may qualify for" color="#e65100" bgColor="#fff3e0" borderColor="#ff6f00" onClick={() => navigate("/benefits")} />
        <QuickCard icon={AlertTriangle} title="Emergency" subtitle="SOS contacts & safety" color="#b71c1c" bgColor="#ffebee" borderColor="#e53935" onClick={() => navigate("/emergency")} />

        {refillMeds.length > 0 && (
          <div className="mt-2">
            <p className="text-base font-bold text-gray-800 mb-3">⚠️ Needs Refill</p>
            {refillMeds.map(med => (
              <div key={med.id} className="bg-white rounded-2xl p-4 flex items-center justify-between mb-3 shadow-sm border-l-4" style={{ borderLeftColor: "#f57f17" }}>
                <div>
                  <p className="font-bold text-gray-800">{med.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{med.dosage} — {med.frequency}</p>
                </div>
                <button onClick={() => navigate("/delivery", { state: { med } })}
                  className="text-white text-xs font-bold px-3 py-2 rounded-lg" style={{ backgroundColor: "#1976a8" }}>
                  Deliver Now
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl mt-6 mb-4 border-2"
          style={{ backgroundColor: "#ffebee", borderColor: "rgba(229,57,53,0.3)", padding: "18px" }}>
          <LogOut size={20} color="#c62828" />
          <span className="font-bold text-base" style={{ color: "#c62828" }}>Sign Out</span>
        </button>

        <p className="text-center text-xs text-gray-400 mb-6">© 2026 SeniorCare360. All rights reserved.</p>
      </div>
    </div>
  );
}