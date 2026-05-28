import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Phone, Globe, Star } from "lucide-react";

const BENEFITS = [
  { id: 1, name: "Medicare Part D", category: "Prescription Coverage", description: "Covers prescription drug costs. You may be eligible for Extra Help to reduce your costs.", phone: "1-800-MEDICARE", website: "https://medicare.gov" },
  { id: 2, name: "Low Income Subsidy (LIS)", category: "Prescription Coverage", description: "Also called Extra Help. Helps pay Part D premiums, deductibles, and copayments.", phone: "1-800-772-1213", website: "https://ssa.gov" },
  { id: 3, name: "Medicaid", category: "Health Coverage", description: "State and federal program providing health coverage to eligible low-income adults.", phone: "1-877-254-1055", website: "https://medicaid.gov" },
  { id: 4, name: "PACE Program", category: "Health Coverage", description: "Program of All-inclusive Care for the Elderly. Comprehensive health services for seniors.", phone: "1-877-267-2323", website: "https://medicare.gov/pace" },
  { id: 5, name: "Meals on Wheels", category: "Food & Nutrition", description: "Home-delivered nutritious meals for seniors who have difficulty shopping or cooking.", phone: "1-888-998-6325", website: "https://mealsonwheelsamerica.org" },
  { id: 6, name: "SNAP Benefits", category: "Food & Nutrition", description: "Supplemental Nutrition Assistance Program helps pay for food for those with low income.", phone: "1-800-221-5689", website: "https://fns.usda.gov/snap" },
  { id: 7, name: "Area Agency on Aging", category: "Local Services", description: "Connects seniors to local services: transportation, home care, caregiver support.", phone: "1-800-677-1116", website: "https://eldercare.acl.gov" },
  { id: 8, name: "Senior Medicare Patrol", category: "Local Services", description: "Helps seniors detect and report Medicare fraud, errors, and abuse.", phone: "1-877-808-2468", website: "https://smpresource.org" },
];

export default function BenefitsScreen() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const categories = [...new Set(BENEFITS.map(b => b.category))];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      <div className="text-white px-5 pt-12 pb-5" style={{ backgroundColor: "#e65100" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="p-1"><ArrowLeft size={22} color="white" /></button>
          <div>
            <h1 className="text-xl font-bold">⭐ Benefits & Resources</h1>
            <p className="text-orange-200 text-xs mt-0.5">Programs you may qualify for</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {categories.map(cat => (
          <div key={cat}>
            <p className="font-bold text-gray-800 text-base mt-4 mb-2">{cat}</p>
            {BENEFITS.filter(b => b.category === cat).map(b => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 mb-3 shadow-sm text-left"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fff3e0" }}>
                  <Star size={20} color="#e65100" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{b.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{b.description}</p>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col max-w-md mx-auto">
          <div className="bg-white flex-1 overflow-y-auto mt-16 rounded-t-3xl">
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex-1">{selected.name}</h2>
              <button onClick={() => setSelected(null)}><X size={22} className="text-gray-500" /></button>
            </div>
            <div className="p-5 pb-12">
              <div className="inline-block rounded-full px-3 py-1 mb-4" style={{ backgroundColor: "#fff3e0" }}>
                <span className="text-xs font-semibold text-orange-700">{selected.category}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">{selected.description}</p>
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold mb-3"
                  style={{ backgroundColor: "#1976a8" }}
                >
                  <Phone size={18} color="white" />
                  Call {selected.phone}
                </a>
              )}
              {selected.website && (
                <a
                  href={selected.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold border-2"
                  style={{ color: "#1976a8", borderColor: "#1976a8", backgroundColor: "#e3f2fd" }}
                >
                  <Globe size={18} />
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}