import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ChevronRight,
  Database,
  Eye,
  Shield,
  Lock,
  FileText,
  Smartphone,
  Archive,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const currentDate = new Date();
  const effectiveDate = currentDate.toLocaleDateString('en-GB');
  const lastUpdated = currentDate.toLocaleDateString('en-GB');

  return (
    <div className="min-h-screen bg-[#f0f0f5] font-sans pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-[800px] mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/account')}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <ShieldCheck size={20} className="text-[#fc8019]" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Legal & Compliance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[800px] mx-auto px-4 py-8">

        {/* Hero Section */}
        <div className="text-center mb-10 pt-4">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full flex items-center justify-center shadow-sm">
            <ShieldCheck size={36} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
              <FileText size={14} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-600">Effective: {effectiveDate}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
              <RefreshCw size={14} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-600">Updated: {lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Policy Document Card */}
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">

          {/* Introduction */}
          <div className="mb-10 pb-8 border-b border-gray-100">
            <p className="text-gray-600 font-medium leading-relaxed mb-4">
              Welcome to RentYatra ("we", "our", "us"). Your privacy is important to us.
              This Privacy Policy explains how we collect, use, share, and protect your
              personal information when you use our mobile application, website, and
              related services (collectively, "Platform").
            </p>
            <p className="text-gray-600 font-medium leading-relaxed">
              By accessing or using RentYatra, you agree to the terms of this Privacy Policy.
            </p>
          </div>

          {/* Section 1: Information We Collect */}
          <section className="mb-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <Database size={20} className="text-[#fc8019]" />
              </div>
              1. Information We Collect
            </h2>
            <p className="text-gray-600 font-medium mb-5">
              We collect information to provide and improve our rental services:
            </p>

            <div className="space-y-6 ml-2 md:ml-12">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <h3 className="text-base font-extrabold text-gray-900 mb-3 tracking-tight">a. Personal Information</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">When you sign up or use our platform, we may collect:</p>
                <ul className="space-y-2.5">
                  {[
                    "Full name",
                    "Email address",
                    "Mobile number",
                    "Aadhar card front and back side image",
                    "Address and location details",
                    "Identity verification details (e.g., Aadhaar, PAN, or government ID if required)",
                    "Profile photo",
                    "Bank or payment details (processed securely through third-party payment gateways)"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#fc8019] mt-1.5 shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <h3 className="text-base font-extrabold text-gray-900 mb-3 tracking-tight">b. Non-Personal Information</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">We may also collect:</p>
                <ul className="space-y-2.5">
                  {[
                    "Device details (model, OS, app version)",
                    "IP address, browser type, and location",
                    "Usage data (pages visited, search history, clicks, etc.)",
                    "Cookies and similar technologies"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2: How We Use Your Information */}
          <section className="mb-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <Eye size={20} className="text-[#fc8019]" />
              </div>
              2. How We Use Your Information
            </h2>
            <p className="text-gray-600 font-medium mb-5 ml-2 md:ml-12">Your data helps us to:</p>
            <ul className="space-y-3 ml-2 md:ml-12">
              {[
                "Create and manage your RentYatra account",
                "Enable renting, listing, and product sharing between users",
                "Verify identity and prevent fraud or misuse",
                "Facilitate payments and refunds securely",
                "Provide customer support and service updates",
                "Improve our platform's design and functionality",
                "Send relevant offers, alerts, or promotional communications",
                "Comply with applicable legal requirements"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-700 font-medium">
                  <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5 border border-gray-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#fc8019]"></div>
                  </div>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3: Sharing of Information */}
          <section className="mb-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <Shield size={20} className="text-[#fc8019]" />
              </div>
              3. Sharing of Information
            </h2>
            <div className="ml-2 md:ml-12">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-extrabold tracking-tight mb-5 border border-green-100">
                <ShieldCheck size={16} />
                We do not sell your data to anyone.
              </div>
              <p className="text-gray-600 font-medium mb-4">We may share information with:</p>
              <ul className="space-y-3 mb-5">
                {[
                  "Service providers (payment processors, logistics, verification services)",
                  "Business partners (for offers, if you consent)",
                  "Law enforcement or authorities (when legally required)"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"></div>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
                All third parties are bound by data protection agreements and confidentiality obligations.
              </p>
            </div>
          </section>

          {/* Section 4: Data Security */}
          <section className="mb-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <Lock size={20} className="text-[#fc8019]" />
              </div>
              4. Data Security
            </h2>
            <div className="ml-2 md:ml-12">
              <p className="text-gray-600 font-medium mb-5">We take strong security measures to protect your data, including:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[
                  "End-to-end encryption",
                  "Secure payment processing (PCI-DSS compliant)",
                  "Two-step authentication (if enabled)",
                  "Regular audits and vulnerability checks"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <ShieldCheck size={12} className="text-green-500" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-gray-500 text-sm font-medium">
                However, no online system is completely secure. We encourage users to maintain
                strong passwords and protect their login information.
              </p>
            </div>
          </section>

          {/* Section 5: Your Rights */}
          <section className="mb-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={20} className="text-[#fc8019]" />
              </div>
              5. Your Rights
            </h2>
            <div className="ml-2 md:ml-12">
              <p className="text-gray-600 font-medium mb-5">
                As a user under the Digital Personal Data Protection Act, 2023, you have the right to:
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Access your personal data",
                  "Request corrections or deletion",
                  "Withdraw consent for data processing",
                  "Lodge a complaint with the Data Protection Board of India (if applicable)"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700 font-medium">
                    <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5 border border-gray-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#fc8019]"></div>
                    </div>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <p className="text-sm text-gray-800 font-medium">
                  You can exercise these rights by contacting us at <span className="font-bold text-[#fc8019]">support@rentyatra.com</span>.
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-2 md:ml-12">
            {/* Section 6: Cookies Policy */}
            <section className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                <Smartphone size={18} className="text-gray-400" />
                6. Cookies Policy
              </h2>
              <p className="text-sm text-gray-600 font-medium mb-4">RentYatra uses cookies and similar technologies to:</p>
              <ul className="space-y-2 mb-4">
                {["Enhance your experience", "Remember your preferences", "Analyze traffic and performance"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <div className="w-1 h-1 rounded-full bg-gray-400 shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 font-medium">
                You can disable cookies in your browser settings, but some features may not work as intended.
              </p>
            </section>

            {/* Section 7: Data Retention */}
            <section className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                <Archive size={18} className="text-gray-400" />
                7. Data Retention
              </h2>
              <p className="text-sm text-gray-600 font-medium mb-4">We retain your information only as long as:</p>
              <ul className="space-y-2 mb-4">
                {["Your account is active", "Required by law", "Needed to resolve disputes or prevent misuse"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <div className="w-1 h-1 rounded-full bg-gray-400 shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 font-medium">
                Once no longer needed, your data is securely deleted or anonymized.
              </p>
            </section>
          </div>

          <div className="mt-8 ml-2 md:ml-12 space-y-8">
            {/* Section 8: Third-Party Links */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight flex items-center gap-2">
                <ExternalLink size={18} className="text-[#fc8019]" />
                8. Third-Party Links
              </h2>
              <p className="text-gray-600 font-medium leading-relaxed">
                Our platform may contain links to third-party websites or services.
                RentYatra is not responsible for the content or privacy practices of these external sites.
              </p>
            </section>

            {/* Section 9: Policy Updates */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight flex items-center gap-2">
                <RefreshCw size={18} className="text-[#fc8019]" />
                9. Policy Updates
              </h2>
              <p className="text-gray-600 font-medium leading-relaxed">
                We may update this Privacy Policy from time to time. Any major changes will be
                notified via app alerts or email. The latest version will always be available on our website/app.
              </p>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;