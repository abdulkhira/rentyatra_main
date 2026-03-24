import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, FileText, Mail, Phone, MapPin } from 'lucide-react';
import Card from '../../components/common/Card';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const currentDate = new Date();
  const effectiveDate = currentDate.toLocaleDateString('en-GB');
  const lastUpdated = currentDate.toLocaleDateString('en-GB');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard/account')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield size={20} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="text-sm text-gray-600">Rentyatra Privacy Policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="p-6 md:p-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Privacy Policy for Rentyatra
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span>Effective Date: {effectiveDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span>Last Updated: {lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <p className="text-gray-700 leading-relaxed">
              Welcome to Rentyatra ("we", "our", "us"). Your privacy is important to us. 
              This Privacy Policy explains how we collect, use, share, and protect your 
              personal information when you use our mobile application, website, and 
              related services (collectively, "Platform").
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              By accessing or using Rentyatra, you agree to the terms of this Privacy Policy.
            </p>
          </div>

          {/* Section 1: Information We Collect */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database size={20} className="text-blue-600" />
              1. Information We Collect
            </h2>
            <p className="text-gray-700 mb-4">
              We collect information to provide and improve our rental services:
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">a. Personal Information</h3>
                <p className="text-gray-700 mb-2">When you sign up or use our platform, we may collect:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Mobile number</li>
                  <li>Aadhar card front and back side image</li>
                  <li>Address and location details</li>
                  <li>Identity verification details (e.g., Aadhaar, PAN, or government ID if required)</li>
                  <li>Profile photo</li>
                  <li>Bank or payment details (processed securely through third-party payment gateways)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">b. Non-Personal Information</h3>
                <p className="text-gray-700 mb-2">We may also collect:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Device details (model, OS, app version)</li>
                  <li>IP address, browser type, and location</li>
                  <li>Usage data (pages visited, search history, clicks, etc.)</li>
                  <li>Cookies and similar technologies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2: How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye size={20} className="text-green-600" />
              2. How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">Your data helps us to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Create and manage your Rentyatra account</li>
              <li>Enable renting, listing, and product sharing between users</li>
              <li>Verify identity and prevent fraud or misuse</li>
              <li>Facilitate payments and refunds securely</li>
              <li>Provide customer support and service updates</li>
              <li>Improve our platform's design and functionality</li>
              <li>Send relevant offers, alerts, or promotional communications</li>
              <li>Comply with applicable legal requirements</li>
            </ul>
          </section>

          {/* Section 3: Sharing of Information */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-purple-600" />
              3. Sharing of Information
            </h2>
            <p className="text-gray-700 mb-4">
              <strong>We do not sell your data to anyone.</strong>
            </p>
            <p className="text-gray-700 mb-4">We may share information with:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Service providers (payment processors, logistics, verification services)</li>
              <li>Business partners (for offers, if you consent)</li>
              <li>Law enforcement or authorities (when legally required)</li>
            </ul>
            <p className="text-gray-700 mt-4">
              All third parties are bound by data protection agreements and confidentiality obligations.
            </p>
          </section>

          {/* Section 4: Data Security */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock size={20} className="text-red-600" />
              4. Data Security
            </h2>
            <p className="text-gray-700 mb-4">We take strong security measures to protect your data, including:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>End-to-end encryption</li>
              <li>Secure payment processing (PCI-DSS compliant)</li>
              <li>Two-step authentication (if enabled)</li>
              <li>Regular audits and vulnerability checks</li>
            </ul>
            <p className="text-gray-700 mt-4">
              However, no online system is completely secure. We encourage users to maintain 
              strong passwords and protect their login information.
            </p>
          </section>

          {/* Section 5: Your Rights */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-indigo-600" />
              5. Your Rights
            </h2>
            <p className="text-gray-700 mb-4">
              As a user under the Digital Personal Data Protection Act, 2023, you have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Access your personal data</li>
              <li>Request corrections or deletion</li>
              <li>Withdraw consent for data processing</li>
              <li>Lodge a complaint with the Data Protection Board of India (if applicable)</li>
            </ul>
            <p className="text-gray-700 mt-4">
              You can exercise these rights by contacting us at support@rentyatra.com.
            </p>
          </section>

          {/* Section 6: Cookies Policy */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Cookies Policy</h2>
            <p className="text-gray-700 mb-4">Rentyatra uses cookies and similar technologies to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Enhance your experience</li>
              <li>Remember your preferences</li>
              <li>Analyze traffic and performance</li>
            </ul>
            <p className="text-gray-700 mt-4">
              You can disable cookies in your browser settings, but some features may not work as intended.
            </p>
          </section>

          {/* Section 7: Data Retention */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-4">We retain your information only as long as:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Your account is active</li>
              <li>Required by law</li>
              <li>Needed to resolve disputes or prevent misuse</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Once no longer needed, your data is securely deleted or anonymized.
            </p>
          </section>

          {/* Section 8: Third-Party Links */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Third-Party Links</h2>
            <p className="text-gray-700">
              Our platform may contain links to third-party websites or services. 
              Rentyatra is not responsible for the content or privacy practices of these external sites.
            </p>
          </section>

          {/* Section 9: Policy Updates */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Policy Updates</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. Any major changes will be 
              notified via app alerts or email. The latest version will always be available on our website/app.
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
