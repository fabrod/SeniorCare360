import { useState } from "react";
import { Phone, Mail, MessageSquare } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-blue-800 mb-2">Contact Us</h1>
      <p className="text-gray-500 text-sm mb-8">We're here to help. Reach out anytime.</p>

      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 space-y-4">
        <a href="tel:18007364671" className="flex items-center gap-3 text-blue-700 font-medium text-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Phone size={18} color="#1976a8" />
          </div>
          1-800-736-4671
        </a>
        <a href="mailto:support@seniorcare360.com" className="flex items-center gap-3 text-blue-700 font-medium text-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Mail size={18} color="#1976a8" />
          </div>
          support@seniorcare360.com
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MessageSquare size={18} color="#1976a8" /> Send a Message
        </h2>
        {sent ? (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-bold text-green-700">Message sent!</p>
            <p className="text-sm text-gray-500 mt-1">We'll get back to you within 1 business day.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {[["Name", "name", "text", "Your name"], ["Email", "email", "email", "your@email.com"]].map(([label, field, type, ph]) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input type={type} placeholder={ph} required value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
              <textarea required rows={4} placeholder="How can we help?" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: "#1976a8" }}>
              Send Message
            </button>
          </form>
        )}
      </div>

      <a href="/" className="inline-block text-blue-700 font-semibold text-sm">← Back to Home</a>
    </div>
  );
}