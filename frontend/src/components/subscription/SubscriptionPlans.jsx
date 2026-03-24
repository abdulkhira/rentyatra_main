import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import PlanCard from './PlanCard';
import PlanSummaryModal from './PlanSummaryModal';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import razorpayService from '../../services/razorpayService';

const SubscriptionPlans = ({ onSelectPlan }) => {
  const { subscriptionPlans, subscribeToPlan, loading } = useSubscription();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Plans are automatically updated via SubscriptionContext when admin makes changes
  // No need for page reload - updates happen instantly via event listeners


  // OPTIMIZED: Preload Razorpay script when component mounts for faster payment initiation
  useEffect(() => {
    // Preload Razorpay script in background (non-blocking)
    if (!window.Razorpay) {
      console.log('📜 Preloading Razorpay script for faster payment...');
      razorpayService.loadRazorpayScript().catch(err => {
        // Silently fail - script will be loaded again when payment is initiated
        console.log('⚠️ Razorpay preload failed (will retry on payment):', err.message);
      });
    }
  }, []);

  const handleSelectPlan = async (planId) => {
    const plan = subscriptionPlans.find(p => p.id === planId);
    setSelectedPlan(plan);
    setShowSummaryModal(true);
  };

  const handlePayNow = async (plan) => {
    // Payment is now handled in PlanSummaryModal
    // This function is no longer needed but kept for compatibility
    setShowSummaryModal(false);
  };

  // Handle back button click - redirect to account page
  const handleBack = () => {
    // Navigate to account page
    navigate('/dashboard/account');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-6 md:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-4 md:mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-6 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-3 py-1.5 md:px-4 md:py-2 rounded-full mb-3 md:mb-4">
            <TrendingUp size={14} className="md:w-[18px] md:h-[18px]" />
            <span className="text-xs md:text-sm font-bold">SUBSCRIPTION PLANS</span>
          </div>
          
          <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 mb-3 md:mb-4 leading-tight px-2">
            Choose Your Perfect Plan
          </h1>
          
          <p className="text-sm md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
            Start renting out your items today and earn passive income. 
            <br className="hidden md:block" />
            Pick a plan that fits your needs perfectly.
          </p>
        </div>

        {/* Pricing Cards - Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="mb-8 md:mb-12">
          {/* Mobile: Horizontal Scroll */}
          <div className="md:hidden overflow-x-auto hide-scrollbar -mx-4 px-4">
            <div className="flex gap-4 pb-4">
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} style={{ width: '70vw', minWidth: '260px' }} className="flex-shrink-0">
                  <PlanCard
                    plan={plan}
                    onSelect={handleSelectPlan}
                    loading={loading && selectedPlan === plan.id}
                    isPopular={plan.popular}
                    isMobile={true}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Grid - Smaller cards, centered */}
          <div className="hidden md:flex md:justify-center">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 max-w-6xl">
              {subscriptionPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={handleSelectPlan}
                  loading={loading && selectedPlan === plan.id}
                  isPopular={plan.popular}
                  isMobile={false}
                />
              ))}
            </div>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-8 md:mt-12 text-center px-2">
          <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
            All plans include secure payments, Safety Use, and 24/7 Customer support
          </p>
          <p className="text-xs md:text-sm text-gray-500">
            GST Charges will apply • No hidden fees • Safe and Secure
          </p>
        </div>
      </div>

      {/* Plan Summary Modal */}
      <PlanSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        plan={selectedPlan}
        onPayNow={handlePayNow}
      />
    </div>
  );
};

export default SubscriptionPlans;

