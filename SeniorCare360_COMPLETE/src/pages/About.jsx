export default function About() {
  return (
    <div className="min-h-screen bg-gray-100 max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-blue-800 mb-6">About SeniorCare360</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-4 text-gray-700 leading-relaxed text-sm">
        <p>
          SeniorCare360 is a comprehensive mobile health management platform built specifically for seniors and older adults who want to take control of their healthcare journey from the comfort of their home.
        </p>
        <p>
          Our app brings together everything a senior needs in one easy-to-use place: managing prescription medications, tracking health vitals like blood pressure and blood glucose, scheduling doctor appointments, and requesting prescription home deliveries — all with just a few taps.
        </p>
        <p>
          SeniorCare360 is designed with simplicity and accessibility at its core. Large text, high-contrast colors, and an intuitive layout make it easy for seniors to navigate confidently, even with limited tech experience.
        </p>
        <p>
          Families and caregivers are also a central part of our platform. With the Family Circle feature, trusted contacts can stay informed about a loved one's health and respond quickly in emergencies using our one-tap SOS alert system.
        </p>
        <p>
          We also connect seniors to government programs and benefits they may qualify for — including Medicare Part D, Medicaid, SNAP, and local senior services — helping them save money and access the care they deserve.
        </p>
        <p>
          SeniorCare360 is developed by a dedicated team passionate about improving healthcare access and quality of life for the senior community. Our mission is simple: to give every senior the tools, support, and confidence they need to live healthier, safer, and more connected lives.
        </p>
      </div>

      <a href="/" className="inline-block text-blue-700 font-semibold text-sm">← Back to Home</a>
    </div>
  );
}