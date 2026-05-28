import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Phone, Heart, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/home";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-10 pb-8 px-4 max-w-md mx-auto" style={{ backgroundColor: "#e8f0f7" }}>
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#1976a8", boxShadow: "0 6px 20px rgba(25,118,168,0.3)" }}>
          <Heart size={40} color="white" fill="white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1976a8" }}>SeniorCare360</h1>
        <p className="text-sm text-gray-500 mt-1">Your Trusted Health Companion</p>
      </div>

      {/* Card */}
      <div className="w-full bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Welcome Back!</h2>
        <p className="text-sm text-gray-500 mb-6">Please sign in to continue</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <span>📧</span> Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
              style={{ borderColor: "#e0e0e0", backgroundColor: "#fafafa" }}
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <span>🔒</span> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                style={{ borderColor: "#e0e0e0", backgroundColor: "#fafafa" }}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="flex justify-end mt-1">
              <Link to="/forgot-password" className="text-xs font-medium" style={{ color: "#1976a8" }}>Forgot password?</Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-white font-bold text-base mt-1 transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#1976a8", boxShadow: "0 4px 16px rgba(25,118,168,0.35)" }}
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-700 mt-5">
          New here?{" "}
          <Link to="/register" className="font-bold" style={{ color: "#1976a8" }}>Create an Account</Link>
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2" style={{ color: "#1976a8" }}>
        <Phone size={16} />
        <span className="text-sm font-medium">Need Help? Call 1-800-736-4671</span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <Link to="/about" className="hover:underline">About</Link>
        <span>·</span>
        <Link to="/contact" className="hover:underline">Contact</Link>
      </div>
    </div>
  );
}