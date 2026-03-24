import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Users, Shield, CreditCard, AlertTriangle, Scale, Lock, UserX, RefreshCw, Gavel, Truck } from 'lucide-react';
import Card from '../../components/common/Card';

const TermsAndConditions = () => {
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
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FileText size={20} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Terms & Conditions</h1>
                <p className="text-sm text-gray-600">Rentyatra Terms and Conditions</p>
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
              RentYatra – Terms and Conditions
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

          {/* Section 1: Introduction */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to RentYatra ("we," "our," "us"). By accessing or using our mobile application, 
              website, or related services ("Platform"), you agree to comply with these Terms and Conditions. 
              Please read them carefully before using our services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              If you do not agree with these Terms, you should not use the RentYatra Platform.
            </p>
          </section>

          {/* Section 2: Definitions */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-green-600" />
              2. Definitions
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-700">
                  <strong>User:</strong> Any individual or business who accesses or uses the RentYatra Platform.
                </p>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Lender:</strong> A user who lists their product(s) for rent.
                </p>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Renter:</strong> A user who rents or books a product listed on RentYatra.
                </p>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Listing:</strong> Any item, product, or equipment uploaded on RentYatra for rental.
                </p>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Transaction:</strong> A rental agreement or exchange between Lender and Renter facilitated by RentYatra.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Eligibility */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-purple-600" />
              3. Eligibility
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You must be at least 18 years old and capable of entering into a legally binding agreement 
              to use RentYatra. By registering, you confirm that the information you provide is accurate and complete.
            </p>
          </section>

          {/* Section 4: User Accounts */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-indigo-600" />
              4. User Accounts
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Users must create an account using a valid mobile number or email.</li>
              <li>You are responsible for maintaining the confidentiality of your login details.</li>
              <li>You agree not to share your account or use others' accounts without permission.</li>
              <li>RentYatra reserves the right to suspend or terminate accounts for suspicious activity, fraud, or policy violation.</li>
            </ul>
          </section>

          {/* Section 5: Listing and Renting Products */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-orange-600" />
              5. Listing and Renting Products
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Lenders must provide accurate descriptions, prices, and images of their products.</li>
              <li>Renters must check product details before booking.</li>
              <li>RentYatra is not responsible for damages, loss, or quality of items.</li>
              <li>Both parties are responsible for verifying the condition of products before and after rental.</li>
              <li>Any dispute must be resolved directly between Lender and Renter, though RentYatra may assist if needed.</li>
            </ul>
          </section>

          {/* Section 6: Payments and Fees */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-green-600" />
              6. Payments and Fees
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>All payments must be made through the RentYatra payment system (if applicable).</li>
              <li>RentYatra may charge a small commission or service fee per transaction.</li>
              <li>RentYatra is not responsible for delays or failures in third-party payment gateways.</li>
              <li>Refunds are subject to the cancellation policy mentioned in each listing.</li>
            </ul>
          </section>

          {/* Section 7: Cancellation and Refund Policy */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw size={20} className="text-red-600" />
              7. Cancellation and Refund Policy
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Renters may cancel bookings based on the Lender's cancellation terms.</li>
              <li>Refunds (if applicable) will be processed within a reasonable period.</li>
              <li>RentYatra reserves the right to deduct applicable service fees.</li>
              <li>No returns are accepted once the rental period has commenced or the product has been delivered.</li>
            </ul>
          </section>

          {/* Section 8: Shipping & Delivery Policy */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Truck size={20} className="text-teal-600" />
              8. Shipping & Delivery Policy
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Last updated on Nov 4 2025</strong>
            </p>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                For International buyers, orders are shipped and delivered through registered international courier companies and/or International speed post only. For domestic buyers, orders are shipped through registered domestic courier companies and /or speed post only.
              </p>
              <p>
                Orders are shipped within 0-7 days or as per the delivery date agreed at the time of order confirmation and delivering of the shipment subject to Courier Company / post office norms. KARAN KISHORBHAI KHOYANI is not liable for any delay in delivery by the courier company / postal authorities and only guarantees to hand over the consignment to the courier company or postal authorities within 0-7 days from the date of the order and payment or as per the delivery date agreed at the time of order confirmation.
              </p>
              <p>
                Delivery of all orders will be to the address provided by the buyer. Delivery of our services will be confirmed on your mail ID as specified during registration.
              </p>
              <p>
                For any issues in utilizing our services you may contact our helpdesk on <strong>8160152223</strong> or <strong>rentrayatra111@gmail.com</strong>.
              </p>
            </div>
          </section>

          {/* Section 9: User Responsibilities */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-yellow-600" />
              9. User Responsibilities
            </h2>
            <p className="text-gray-700 mb-4">You agree:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Not to post illegal, stolen, or restricted items.</li>
              <li>Not to misuse, copy, or manipulate other users' content.</li>
              <li>To return rented items in the same condition as received.</li>
              <li>To follow all laws and regulations during transactions.</li>
            </ul>
          </section>

          {/* Section 10: Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Scale size={20} className="text-gray-600" />
              10. Limitation of Liability
            </h2>
            <p className="text-gray-700 mb-4">
              RentYatra acts only as a digital marketplace connecting lenders and renters. 
              We do not own, inspect, or guarantee the quality, safety, or legality of listed items.
            </p>
            <p className="text-gray-700 mb-4">RentYatra shall not be liable for:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Product damage, loss, or theft,</li>
              <li>Personal injury or disputes between users,</li>
              <li>Any indirect, incidental, or consequential damages.</li>
            </ul>
          </section>

          {/* Section 11: Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock size={20} className="text-blue-600" />
              11. Intellectual Property
            </h2>
            <p className="text-gray-700">
              All content, logos, designs, and trademarks on RentYatra are owned by RentYatra or its licensors. 
              Users cannot copy, reproduce, or distribute them without written consent.
            </p>
          </section>

          {/* Section 12: Privacy */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-purple-600" />
              12. Privacy
            </h2>
            <p className="text-gray-700">
              We value your privacy. Please refer to our Privacy Policy to understand how we collect, 
              use, and protect your personal information.
            </p>
          </section>

          {/* Section 13: Termination */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserX size={20} className="text-red-600" />
              13. Termination
            </h2>
            <p className="text-gray-700 mb-4">
              RentYatra may suspend or terminate access to any user without notice if:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>There is a policy or legal violation, or</li>
              <li>Fraudulent or abusive activity is detected.</li>
            </ul>
          </section>

          {/* Section 14: Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw size={20} className="text-indigo-600" />
              14. Changes to Terms
            </h2>
            <p className="text-gray-700">
              RentYatra may update these Terms and Conditions at any time. Continued use of the Platform 
              after changes means you accept the revised Terms.
            </p>
          </section>

          {/* Section 15: Governing Law */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Gavel size={20} className="text-gray-600" />
              15. Governing Law
            </h2>
            <p className="text-gray-700">
              These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive 
              jurisdiction of the courts in [Ahmedabad, Gujarat].
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions;
