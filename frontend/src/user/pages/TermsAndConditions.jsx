import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Users,
  Shield,
  CreditCard,
  AlertTriangle,
  Scale,
  Lock,
  UserX,
  RefreshCw,
  Gavel,
  Truck,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const TermsAndConditions = () => {
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
                <FileText size={20} className="text-[#fc8019]" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Terms & Conditions</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">User Agreement</p>
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
            <Gavel size={36} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Terms of Service
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

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">

          {/* Section 1: Introduction */}
          <section className="mb-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={20} className="text-[#fc8019]" />
              </div>
              1. Introduction
            </h2>
            <div className="ml-2 md:ml-12 text-gray-600 font-medium leading-relaxed space-y-4">
              <p>
                Welcome to RentYatra ("we," "our," "us"). By accessing or using our mobile application,
                website, or related services ("Platform"), you agree to comply with these Terms and Conditions.
                Please read them carefully before using our services.
              </p>
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-start gap-3">
                <AlertTriangle size={18} className="text-[#fc8019] shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-orange-900">
                  If you do not agree with these Terms, you should not use the RentYatra Platform.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Definitions */}
          <section className="mb-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <Users size={20} className="text-[#fc8019]" />
              </div>
              2. Definitions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-2 md:ml-12">
              {[
                { label: "User", text: "Any individual or business who accesses or uses the Platform." },
                { label: "Lender", text: "A user who lists their product(s) for rent." },
                { label: "Renter", text: "A user who rents or books a product listed on RentYatra." },
                { label: "Listing", text: "Any item, product, or equipment uploaded for rental." }
              ].map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-extrabold text-[#fc8019] uppercase tracking-wider block mb-1">{item.label}</span>
                  <p className="text-sm text-gray-700 font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 & 4: Eligibility & Accounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-2 md:ml-12 mb-10">
            <section className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                <Shield size={18} className="text-blue-500" />
                3. Eligibility
              </h2>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                You must be at least 18 years old and capable of entering into a legally binding agreement
                to use RentYatra. By registering, you confirm your info is accurate.
              </p>
            </section>

            <section className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                <Lock size={18} className="text-purple-500" />
                4. User Accounts
              </h2>
              <ul className="space-y-2">
                {["Valid mobile/email required", "Confidentiality is your responsibility", "Termination for fraud"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <Check size={12} className="text-green-500" /> {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Section 5: Products */}
          <section className="mb-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={20} className="text-[#fc8019]" />
              </div>
              5. Listing and Renting
            </h2>
            <ul className="space-y-3 ml-2 md:ml-12">
              {[
                "Lenders must provide accurate descriptions and images.",
                "Renters must check product details before booking.",
                "RentYatra is not responsible for damages, loss, or quality.",
                "Disputes must be resolved directly between users."
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

          {/* Section 8: Shipping */}
          <section className="mb-10 bg-gray-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <h2 className="text-xl font-extrabold mb-6 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Truck size={20} className="text-[#fc8019]" />
              </div>
              8. Shipping & Delivery
            </h2>
            <div className="space-y-4 text-sm text-gray-300 font-medium leading-relaxed">
              <p>
                Orders are shipped within 0-7 days subject to Courier Company norms. RentYatra guarantees handover to postal authorities within this timeframe.
              </p>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[#fc8019] font-bold mb-2">Need Support?</p>
                <p className="text-white">8160152223 • rentrayatra111@gmail.com</p>
              </div>
            </div>
          </section>

          {/* Section 10: Liability */}
          <section className="mb-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <Scale size={20} className="text-[#fc8019]" />
              </div>
              10. Limitation of Liability
            </h2>
            <div className="ml-2 md:ml-12">
              <p className="text-gray-600 font-bold mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                RentYatra acts only as a digital marketplace. We do not own, inspect, or guarantee listed items.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-400"></div> No liability for theft</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-400"></div> No liability for injury</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-400"></div> No liability for loss</div>
              </div>
            </div>
          </section>

          {/* Final Section: Governing Law */}
          <section className="pt-8 border-t border-gray-100">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
                  <Gavel size={24} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">15. Governing Law</h3>
                  <p className="text-sm text-gray-500 font-medium">Jurisdiction: Ahmedabad, Gujarat</p>
                </div>
              </div>
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-xs font-extrabold tracking-tight border border-green-100 flex items-center gap-2">
                <ShieldCheck size={14} />
                Governed by the laws of India
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

const Check = ({ size, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default TermsAndConditions;