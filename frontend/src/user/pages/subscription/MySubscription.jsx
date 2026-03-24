import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Crown,
  Calendar,
  TrendingUp,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  X,
  Download
} from 'lucide-react';
import Button from '../../../components/common/Button';

const MySubscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    userSubscription,
    subscriptionPlans,
    hasActiveSubscription,
    getRemainingListings,
    loadUserSubscription,
    loading
  } = useSubscription();

  const [showPlanDetailsModal, setShowPlanDetailsModal] = useState(false);

  // Load user subscription when component mounts
  useEffect(() => {
    if (user?.id || user?._id) {
      const userId = user.id || user._id;
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('MySubscription - Loading subscription for userId:', userId);
      }
      loadUserSubscription(userId);
    }
  }, [user, loadUserSubscription]);

  // Auto-refresh subscription data every 30 seconds
  useEffect(() => {
    if (!user?.id && !user?._id) return;
    
    const interval = setInterval(() => {
      const userId = user.id || user._id;
      loadUserSubscription(userId);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, loadUserSubscription]);


  // Stats from subscription data
  const stats = {
    totalListings: userSubscription?.currentListings || 0
  };

  // Find current plan - moved before downloadReceipt to avoid undefined reference
  const currentPlan = subscriptionPlans.find(
    p => p.id === userSubscription?.planId
  ) || null;

  // Helper functions - defined before downloadReceipt
  const getDaysRemaining = () => {
    if (!userSubscription) return 0;
    const endDate = new Date(userSubscription.endDate);
    const now = new Date();
    const diff = endDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Download receipt function
  const downloadReceipt = () => {
    if (!userSubscription || !currentPlan) {
      alert('Subscription data not available. Please try again later.');
      return;
    }

    // Create PDF content using HTML
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>RentYatra Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #3B82F6, #1D4ED8);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            color: #000000;
            text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
          }
          .header p {
            margin: 5px 0 0 0;
            font-size: 16px;
            color: #87CEEB;
            font-weight: 500;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
          }
          .content {
            padding: 30px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section h3 {
            color: #1D4ED8;
            font-size: 18px;
            margin-bottom: 15px;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
          }
          .info-label {
            font-weight: 600;
            color: #374151;
          }
          .info-value {
            color: #6B7280;
          }
          .features-list {
            list-style: none;
            padding: 0;
          }
          .features-list li {
            padding: 5px 0;
            color: #059669;
            position: relative;
            padding-left: 20px;
          }
          .features-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #059669;
            font-weight: bold;
          }
          .footer {
            background: #F3F4F6;
            padding: 20px 30px;
            text-align: center;
            color: #6B7280;
            font-size: 14px;
          }
          .status-paid {
            color: #059669;
            font-weight: bold;
          }
          .status-pending {
            color: #D97706;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>RentYatra</h1>
            <p>Subscription Receipt</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h3>User Details</h3>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${user?.name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${user?.phone || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${user?.email || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">${user?.address ? (typeof user.address === 'string' ? user.address : (user.address.street ? `${user.address.street}, ${user.address.city}, ${user.address.state}, ${user.address.pincode}` : JSON.stringify(user.address))) : 'N/A'}</span>
              </div>
            </div>

            <div class="section">
              <h3>Plan Details</h3>
              <div class="info-row">
                <span class="info-label">Plan Name:</span>
                <span class="info-value">${currentPlan.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Price:</span>
                <span class="info-value">₹${currentPlan.price}</span>
              </div>
              <div class="info-row">
                <span class="info-label">GST (18%):</span>
                <span class="info-value">₹${Math.round(currentPlan.price * 0.18)}</span>
              </div>
              <div class="info-row" style="border-top: 1px solid #E5E7EB; padding-top: 8px; font-weight: bold;">
                <span class="info-label">Total Amount:</span>
                <span class="info-value">₹${Math.round(currentPlan.price * 1.18)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Duration:</span>
                <span class="info-value">${currentPlan.duration} days</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Status:</span>
                <span class="info-value ${userSubscription.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">${userSubscription.paymentStatus}</span>
              </div>
            </div>

            <div class="section">
              <h3>Subscription Details</h3>
              <div class="info-row">
                <span class="info-label">Subscription ID:</span>
                <span class="info-value">RNTY${String(userSubscription._id || userSubscription.id || '00000').slice(-5).padStart(5, '0')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Start Date:</span>
                <span class="info-value">${formatDate(userSubscription.startDate)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">End Date:</span>
                <span class="info-value">${formatDate(userSubscription.endDate)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Purchase Time:</span>
                <span class="info-value">${userSubscription.startDate ? new Date(userSubscription.startDate).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Subscription End Time:</span>
                <span class="info-value">${userSubscription.endDate ? new Date(userSubscription.endDate).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Days Remaining:</span>
                <span class="info-value">${getDaysRemaining()} days</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment ID:</span>
                <span class="info-value">${userSubscription.paymentId || 'N/A'}</span>
              </div>
            </div>

            <div class="section">
              <h3>Plan Features</h3>
              <ul class="features-list">
                ${currentPlan.features && currentPlan.features.length > 0 ? currentPlan.features.map(feature => `<li>${feature}</li>`).join('') : '<li>No features available</li>'}
              </ul>
            </div>

            <div class="section">
              <h3>Plan Limits</h3>
              <div class="info-row">
                <span class="info-label">Max Listings:</span>
                <span class="info-value">${currentPlan.maxListings === -1 ? 'Unlimited' : currentPlan.maxListings}</span>
              </div>
            </div>

          </div>

          <div class="footer">
            <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
            <p><strong>Thank you for choosing RentYatra!</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create and download PDF
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RentYatra_Receipt_${currentPlan.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    
    // For PDF generation, we'll use browser's print to PDF functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print dialog
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
    
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/dashboard/account')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-1">
                My Subscription
              </h1>
              <p className="text-xs text-gray-600">
                Manage your subscription and view payment history
              </p>
            </div>
            {hasActiveSubscription() && (
              <Button
                onClick={() => navigate('/subscription')}
                className="hidden md:flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-3 py-1.5 text-xs rounded-lg shadow-lg"
              >
                <ArrowRight size={14} />
                <span>Upgrade Plan</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active Subscription Card */}
        {hasActiveSubscription() && userSubscription ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            {/* Plan Header with Gradient */}
            <div className={`bg-gradient-to-br ${currentPlan?.gradient || 'from-blue-500 to-indigo-600'} p-4 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} strokeWidth={2.5} />
                    <span className="text-sm font-bold uppercase tracking-wide">
                      {userSubscription?.planName || 'Plan'} Plan Active
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar size={12} />
                      <span className="text-blue-100">Valid until:</span>
                      <span className="font-bold">
                        {userSubscription?.endDate ? formatDate(userSubscription.endDate) : 'N/A'}
                      </span>
                    </div>
                    <div className="text-base font-black">
                      {getDaysRemaining()} days remaining
                    </div>
                  </div>
                </div>

                <Crown size={32} className="text-yellow-300 opacity-20" fill="currentColor" />
              </div>

              {/* Progress Bar */}
              {currentPlan?.duration && (
                <div className="mt-3">
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div
                      className="bg-white rounded-full h-1.5 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((currentPlan.duration - getDaysRemaining()) /
                            currentPlan.duration) *
                            100,
                          100
                        )}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50">
              <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-1">
                  <TrendingUp className="text-blue-600" size={14} />
                </div>
                <div className="text-sm font-black text-gray-900">
                  {getRemainingListings()}/{currentPlan?.maxListings === -1 ? '∞' : (currentPlan?.maxListings || 0)}
                </div>
                <div className="text-[10px] text-gray-600 font-semibold">Post-Ads</div>
              </div>

            </div>

            {/* Plan Features */}
            <div className="p-3 border-t border-gray-200">
              <h3 className="text-xs font-bold text-gray-900 mb-2">
                Plan Features:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {currentPlan?.features && currentPlan.features.length > 0 ? (
                  currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-xs">{feature}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 text-xs">No features available</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <Button
                onClick={() => setShowPlanDetailsModal(true)}
                className="w-full py-1.5 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-lg"
              >
                View Plan Details
              </Button>
            </div>
          </div>
        ) : null}

      </div>

      {/* Plan Details Modal */}
      {showPlanDetailsModal && currentPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPlanDetailsModal(false)}
          ></div>
          <div className="relative bg-white w-full h-full overflow-y-auto">
            {/* Modal Header */}
            <div className={`bg-gradient-to-br ${currentPlan.gradient} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{currentPlan.name}</h2>
                  <p className="text-white/90 text-sm">Your Active Plan</p>
                </div>
              <button
                  onClick={() => setShowPlanDetailsModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
              >
                  <X size={24} />
              </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              {/* Plan Overview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">Plan Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan Name:</span>
                    <span className="font-semibold">{currentPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold">₹{currentPlan.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold">{currentPlan.duration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-green-600">Active</span>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              {userSubscription && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 mb-3">Subscription Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subscription ID:</span>
                      <span className="font-semibold text-blue-600">RNTY{String(userSubscription._id || userSubscription.id || '00000').slice(-5).padStart(5, '0')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-semibold">{formatDate(userSubscription.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-semibold">{formatDate(userSubscription.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Remaining:</span>
                      <span className="font-semibold text-blue-600">{getDaysRemaining()} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className="font-semibold text-green-600 capitalize">{userSubscription.paymentStatus}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Features */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">Plan Features</h3>
                <div className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plan Limits */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">Plan Limits</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Max Listings:</span>
                    <span className="font-semibold">
                      {currentPlan.maxListings === -1 ? 'Unlimited' : currentPlan.maxListings}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Max Photos per Listing:</span>
                    <span className="font-semibold">{currentPlan.maxPhotos}</span>
                  </div>
                </div>
              </div>

              {/* Current Usage */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">Current Usage</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Listings Used:</span>
                    <span className="font-semibold">
                      {userSubscription?.currentListings || 0}/{currentPlan.maxListings === -1 ? '∞' : currentPlan.maxListings}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 max-w-4xl mx-auto">
              <div className="mb-18">
                <Button
                  onClick={() => {
                    downloadReceipt();
                  }}
                  className="w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MySubscription;

