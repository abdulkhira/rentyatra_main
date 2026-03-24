import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import boostService from '../../../services/boostService';

const MyBoost = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [boosts, setBoosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBoosts: 0,
    activeBoosts: 0,
    totalSpent: 0
  });
  const [showBoostDetailsModal, setShowBoostDetailsModal] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState(null);

  // CRITICAL: Refresh data on mount and when location changes (e.g., after payment)
  useEffect(() => {
    console.log('🔄 MyBoost: Component mounted or location changed, fetching data...');
    console.log('📍 Location state:', location.state);
    
    // If coming from payment success, refresh immediately
    if (location.state?.paymentSuccess) {
      console.log('✅ Payment success detected, refreshing boost data immediately...');
      fetchBoosts();
      fetchStats();
    } else {
      // Normal refresh
      fetchBoosts();
      fetchStats();
    }
  }, [location.pathname, location.state]); // Refresh when route or state changes

  // Also refresh when component mounts
  useEffect(() => {
    fetchBoosts();
    fetchStats();
  }, []);

  // Add refresh function that can be called from other components
  const refreshBoostData = () => {
    fetchBoosts();
    fetchStats();
  };

  // Sync boost usage between systems
  const syncBoostUsage = async () => {
    try {
      console.log('🔄 Syncing boost usage...');
      await boostService.syncBoostUsage();
      console.log('✅ Sync completed, refreshing data...');
      refreshBoostData();
    } catch (error) {
      console.error('❌ Sync failed:', error);
    }
  };

  // Expose refresh function globally so it can be called from payment success
  useEffect(() => {
    window.refreshBoostData = refreshBoostData;
    // Also listen for custom event to refresh
    const handleRefresh = () => {
      console.log('🔄 MyBoost: Received refresh event, fetching data...');
      refreshBoostData();
    };
    window.addEventListener('boostPaymentSuccess', handleRefresh);
    
    return () => {
      window.removeEventListener('boostPaymentSuccess', handleRefresh);
      if (window.refreshBoostData === refreshBoostData) {
        delete window.refreshBoostData;
      }
    };
  }, []);

  const fetchBoosts = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching boost data from API...');
      const response = await boostService.getUserBoosts();
      console.log('📦 Boost API Response:', response);
      
      // Handle different response structures
      let boostData = [];
      if (response && Array.isArray(response)) {
        boostData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        boostData = response.data;
      } else if (response && response.boosts && Array.isArray(response.boosts)) {
        boostData = response.boosts;
      } else {
        boostData = [];
      }
      
      console.log('✅ Processed Boost Data:', boostData);
      console.log(`📊 Total boosts found: ${boostData.length}`);
      setBoosts(boostData);
    } catch (error) {
      console.error('❌ Error fetching boosts:', error);
      setBoosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await boostService.getBoostStats();
      setStats(response || { totalBoosts: 0, activeBoosts: 0, totalSpent: 0 });
    } catch (error) {
      console.error('Error fetching boost stats:', error);
      setStats({ totalBoosts: 0, activeBoosts: 0, totalSpent: 0 });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    
    try {
      const end = new Date(endDate);
      const now = new Date();
      
      if (isNaN(end.getTime())) {
        return 0;
      }
      
      const diff = end - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return Math.max(0, days); // Don't show negative days
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 0;
    }
  };

  const downloadReceipt = (boost) => {
    if (!boost) return;

    console.log('📄 Downloading receipt for boost:', boost);
    console.log('💳 Payment details:', boost.paymentDetails);
    console.log('🔍 Payment ID:', boost.paymentDetails?.razorpayPaymentId);
    console.log('🔍 Order ID:', boost.paymentDetails?.razorpayOrderId);

    // Create PDF content using HTML
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>RentYatra Boost Receipt</title>
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
            background: linear-gradient(135deg, #F59E0B, #D97706);
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
            color: #FEF3C7;
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
            color: #D97706;
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
          .footer {
            background: #F3F4F6;
            padding: 20px 30px;
            text-align: center;
            color: #6B7280;
            font-size: 14px;
          }
          .status-active {
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
            <p>Boost Receipt</p>
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
            </div>

            <div class="section">
              <h3>Boost Details</h3>
              <div class="info-row">
                <span class="info-label">Boost Package:</span>
                <span class="info-value">${boost.boostName || boost.packageName || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Price:</span>
                <span class="info-value">₹${boost.price || boost.totalAmount || 0}</span>
              </div>
               <div class="info-row">
                 <span class="info-label">Boost Count:</span>
                 <span class="info-value">${boost.boostCount || 0} boosts</span>
               </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value ${boost.status === 'active' ? 'status-active' : 'status-pending'}">${boost.status || 'Active'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Status:</span>
                <span class="info-value ${boost.paymentStatus === 'paid' ? 'status-active' : 'status-pending'}">${boost.paymentStatus || 'Paid'}</span>
              </div>
            </div>

            <div class="section">
              <h3>Boost Timeline</h3>
              <div class="info-row">
                <span class="info-label">Boost ID:</span>
                <span class="info-value">BST${String(boost._id || boost.id || '00000').slice(-5).padStart(5, '0')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Start Date:</span>
                <span class="info-value">${formatDate(boost.startDate || boost.validFrom)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">End Date:</span>
                <span class="info-value">${formatDate(boost.endDate || boost.validUntil)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Purchase Time:</span>
                <span class="info-value">${new Date(boost.createdAt || boost.startDate).toLocaleString('en-IN', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}</span>
              </div>
               ${boost.paymentId ? `
               <div class="info-row">
                 <span class="info-label">Payment ID:</span>
                 <span class="info-value">${boost.paymentId}</span>
               </div>
               ` : ''}
              ${(boost.paymentDetails?.razorpayOrderId || boost.orderId || boost.order_id) ? `
              <div class="info-row">
                <span class="info-label">Order ID:</span>
                <span class="info-value">${boost.paymentDetails?.razorpayOrderId || boost.orderId || boost.order_id}</span>
              </div>
              ` : ''}
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
    link.download = `RentYatra_Boost_Receipt_${boost.boostName?.replace(/\s+/g, '_') || 'Boost'}_${new Date().toISOString().split('T')[0]}.html`;
    
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

  // Get active boost (similar to active subscription)
  const activeBoost = boosts.find(boost => boost.status === 'active');
  
  console.log('🎯 All boosts:', boosts);
  console.log('⭐ Active boost found:', activeBoost ? {
    id: activeBoost.id,
    packageName: activeBoost.packageName,
    usedBoosts: activeBoost.usedBoosts,
    remainingBoosts: activeBoost.remainingBoosts,
    boostCount: activeBoost.boostCount,
    status: activeBoost.status
  } : 'No active boost found');

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
                My Boost
              </h1>
              <p className="text-xs text-gray-600">
                Manage your boost orders and track performance
              </p>
            </div>
          </div>
        </div>

        {/* Active Boost Card */}
        {activeBoost && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            {/* Boost Header with Gradient */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} strokeWidth={2.5} />
                    <span className="text-sm font-bold uppercase tracking-wide">
                      {activeBoost.boostName} Boost Active
                    </span>
                  </div>

                  <div className="space-y-1">
                    {activeBoost.endDate && formatDate(activeBoost.endDate) !== 'N/A' && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar size={12} />
                        <span className="text-orange-100">Valid until:</span>
                        <span className="font-bold">
                          {formatDate(activeBoost.endDate)}
                        </span>
                      </div>
                    )}
                    {activeBoost.endDate && getDaysRemaining(activeBoost.endDate) > 0 && (
                      <div className="text-base font-black">
                        {getDaysRemaining(activeBoost.endDate)} days remaining
                      </div>
                    )}
                  </div>
                </div>

                <Zap size={32} className="text-yellow-300 opacity-20" fill="currentColor" />
              </div>

              {/* Progress Bar */}
              {activeBoost.endDate && getDaysRemaining(activeBoost.endDate) > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div
                      className="bg-white rounded-full h-1.5 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((30 - getDaysRemaining(activeBoost.endDate)) / 30) * 100,
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
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full mx-auto mb-1">
                  <TrendingUp className="text-orange-600" size={14} />
                </div>
                <div className="text-sm font-black text-gray-900">
                  ₹{activeBoost.price}
                </div>
                <div className="text-[10px] text-gray-600 font-semibold">Price Paid</div>
              </div>

              <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-1">
                  <Zap className="text-blue-600" size={14} />
                </div>
                 <div className="text-sm font-black text-gray-900">
                   {activeBoost.usedBoosts || 0}/{activeBoost.boostCount || 0}
                 </div>
                <div className="text-[10px] text-gray-600 font-semibold">Boosts Used</div>
              </div>
            </div>

            {/* Boost Features */}
            <div className="p-3 border-t border-gray-200">
              <h3 className="text-xs font-bold text-gray-900 mb-2">
                Boost Features:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">Top placement in search results</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">Increased visibility</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">Priority in category listings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">Email notifications</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <Button
                onClick={() => {
                  setSelectedBoost(activeBoost);
                  setShowBoostDetailsModal(true);
                }}
                className="w-full py-1.5 text-xs bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-lg"
              >
                View Boost Details
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Boost Details Modal */}
      {showBoostDetailsModal && selectedBoost && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="bg-white w-full h-full flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedBoost.boostName || selectedBoost.packageName || 'Boost Package'}</h2>
                  <p className="text-white/90 text-sm">{selectedBoost.boostName || selectedBoost.packageName || 'Boost Package'}</p>
                </div>
                <button
                  onClick={() => setShowBoostDetailsModal(false)}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto pb-6">
              <div className="p-6 space-y-6">
              {/* Boost Overview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">Boost Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boost Package:</span>
                    <span className="font-semibold">{selectedBoost.boostName || selectedBoost.packageName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold">₹{selectedBoost.price || selectedBoost.totalAmount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boost Count:</span>
                    <span className="font-semibold">{selectedBoost.boostCount || selectedBoost.remainingBoosts || 0} boosts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-green-600 capitalize">{selectedBoost.status || 'Active'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className="font-semibold text-green-600 capitalize">{selectedBoost.paymentStatus || 'Paid'}</span>
                  </div>
                </div>
              </div>


              {/* Boost Timeline */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">Boost Timeline</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boost ID:</span>
                    <span className="font-semibold text-orange-600">BST{String(selectedBoost._id || selectedBoost.id || '00000').slice(-5).padStart(5, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-semibold">{formatDate(selectedBoost.startDate || selectedBoost.validFrom)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-semibold">{formatDate(selectedBoost.endDate || selectedBoost.validUntil)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purchase Date:</span>
                    <span className="font-semibold">{formatDate(selectedBoost.createdAt || selectedBoost.startDate)}</span>
                  </div>
                  {selectedBoost.paymentId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-semibold text-blue-600">{selectedBoost.paymentId}</span>
                    </div>
                  )}
                  {selectedBoost.paymentDetails?.razorpayOrderId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-semibold text-gray-600">{selectedBoost.paymentDetails.razorpayOrderId}</span>
                    </div>
                  )}
                </div>
              </div>

                  {/* Boost Features */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold text-gray-900 mb-3">Boost Features</h3>
                    <div className="space-y-2">
                      {(selectedBoost.features && selectedBoost.features.length > 0) ? (
                        selectedBoost.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">Top placement in search results</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">Increased visibility</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">Priority in category listings</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">Email notifications</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Download Receipt Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={() => {
                        downloadReceipt(selectedBoost);
                      }}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mb-12"
                    >
                      <Download size={16} />
                      Download Receipt
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default MyBoost;