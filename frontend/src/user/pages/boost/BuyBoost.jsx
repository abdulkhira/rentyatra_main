import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Star, 
  Clock, 
  CheckCircle, 
  ArrowLeft,
  Crown,
  Rocket,
  X,
  Package
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import boostService from '../../../services/boostService';
import boostPaymentService from '../../../services/boostPaymentService';
import { useBoost } from '../../../contexts/BoostContext';

const BuyBoost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addBoostCredits, updateBoostCredits } = useBoost();
  
  const [selectedBoost, setSelectedBoost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRentals, setUserRentals] = useState([]);
  const [selectedRental, setSelectedRental] = useState(null);
  const [showRentalSelector, setShowRentalSelector] = useState(false);
  const [boostPackages, setBoostPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  // Map icon strings to actual components
  const iconMap = {
    'Zap': Zap,
    'Rocket': Rocket,
    'Crown': Crown
  };

  // Fetch boost packages and user's rental listings
  useEffect(() => {
    let broadcastChannel = null;
    let pollingInterval = null;
    let lastUpdateTime = 0;

    const fetchData = async (source = 'initial') => {
      try {
        // Only update if enough time has passed (prevent rapid updates)
        const now = Date.now();
        if (now - lastUpdateTime < 500 && source !== 'initial') {
          return; // Skip if updated less than 500ms ago
        }
        lastUpdateTime = now;

        if (process.env.NODE_ENV === 'development' && source !== 'initial') {
          console.log('🔄 Refreshing boost packages from:', source);
        }

        // Fetch boost packages
        const packages = await boostService.getBoostPackages();
        setBoostPackages(packages);
        setPackagesLoading(false);

        // Fetch user's rental listings (only on initial load or manual refresh)
        if (source === 'initial' || source === 'manual') {
          const token = localStorage.getItem('token');
          if (!token) {
            console.log('No authentication token found');
            return;
          }

          const response = await fetch('/api/rental-requests/my-requests', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          if (data.success) {
            // The API returns data.requests array
            setUserRentals(data.data.requests.filter(rental => rental.status === 'approved'));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set empty array if there's an error to prevent UI issues
        if (source === 'initial') {
          setUserRentals([]);
          setPackagesLoading(false);
        }
      }
    };

    if (user) {
      fetchData('initial');
    }

    // Method 1: Custom event for same-tab updates
    const handleBoostPackagesUpdate = (e) => {
      fetchData('custom-event');
    };
    window.addEventListener('boostPackagesUpdated', handleBoostPackagesUpdate);

    // Method 2: BroadcastChannel for cross-tab communication
    try {
      broadcastChannel = new BroadcastChannel('boost-packages-updates');
      broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'boostPackagesUpdated') {
          fetchData('broadcast-channel');
        }
      };
    } catch (broadcastError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('BroadcastChannel not supported, using fallback methods');
      }
    }

    // Method 3: Storage event for cross-tab communication (fallback)
    const handleStorageChange = (e) => {
      if (e.key === 'boostPackagesUpdatedData' || e.key === 'boostPackagesUpdated') {
        fetchData('storage-event');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Method 4: Polling as additional fallback (check every 3 seconds)
    pollingInterval = setInterval(() => {
      // Check localStorage for updates
      const updateFlag = localStorage.getItem('boostPackagesUpdatedData');
      if (updateFlag) {
        try {
          const updateData = JSON.parse(updateFlag);
          const updateTime = updateData.timestamp || 0;
          // Only update if update is recent (within last 10 seconds)
          if (Date.now() - updateTime < 10000) {
            fetchData('polling');
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }, 3000); // Check every 3 seconds

    // Cleanup
    return () => {
      window.removeEventListener('boostPackagesUpdated', handleBoostPackagesUpdate);
      window.removeEventListener('storage', handleStorageChange);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [user]);

  const handleBoostPurchase = async (boostPackage) => {
    if (!user) {
      alert('Please login to purchase boost packages');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Log package data for debugging
      console.log('📦 Boost package data:', boostPackage);

      // Extract package fields (handle both _id and id)
      const packageId = boostPackage.id || boostPackage._id || boostPackage.packageId;
      const packageName = boostPackage.name || boostPackage.packageName;
      const boostCount = boostPackage.boostCount || boostPackage.boost_count || 1;
      const price = boostPackage.price || boostPackage.amount || 0;

      if (!packageId || !packageName || !boostCount || !price) {
        console.error('❌ Invalid package data:', { packageId, packageName, boostCount, price });
        alert('Invalid package data. Please try again.');
        return;
      }

      // Calculate total with GST
      const gstAmount = Math.round(price * 0.18);
      const totalAmount = price + gstAmount;

      console.log('💳 Processing payment for:', {
        packageId,
        packageName,
        boostCount,
        price,
        totalAmount
      });

      // Process payment
      await boostPaymentService.processBoostPayment(
        {
          id: packageId,
          name: packageName,
          boostCount: boostCount,
          price: price,
          onSuccess: async (result) => {
            console.log('✅ Boost payment successful:', result);
            
            // Add boost credits to context
            if (result.boostCount) {
              addBoostCredits(result.boostCount, 'purchased');
            }

            // Sync with API
            try {
              const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
              const token = localStorage.getItem('token');
              const response = await fetch(`${apiUrl}/boost/credits`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.boostCredits && updateBoostCredits) {
                  updateBoostCredits(data.boostCredits);
                }
              }
            } catch (syncError) {
              console.warn('⚠️ Could not sync boost credits:', syncError);
            }

            // Show success message
            alert(`Payment successful! ${result.boostCount} boosts added to your account.`);
            
            // Navigate to My Boost page
            navigate('/my-boost', { 
              state: { 
                paymentSuccess: true, 
                boostCount: result.boostCount 
              } 
            });
          },
          onError: (error) => {
            console.error('❌ Boost payment error:', error);
            
            if (error.message === 'PAYMENT_CANCELLED') {
              return; // User cancelled, don't show error
            }

            let errorMessage = 'Payment failed. Please try again.';
            if (error.message) {
              if (error.message.includes('timeout')) {
                errorMessage = 'Payment verification timed out. Please check your account status.';
              } else if (error.message.includes('verification')) {
                errorMessage = 'Payment verification failed. Please try again.';
              } else {
                errorMessage = error.message;
              }
            }
            
            alert(errorMessage);
          }
        },
        {
          userId: user.id || user._id,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          phone: user.phone || user.mobile
        }
      );
    } catch (error) {
      console.error('❌ Boost purchase error:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      yellow: 'from-yellow-400 to-orange-500',
      orange: 'from-orange-400 to-red-500',
      purple: 'from-purple-400 to-pink-500'
    };
    return colors[color] || colors.yellow;
  };

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                className="mr-4 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Buy Boost</h1>
                <p className="text-sm text-gray-600">Increase your rental visibility</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Boost Packages - Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="mb-8 md:mb-12">
          {packagesLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Mobile: Horizontal Scroll */}
              <div className="md:hidden overflow-x-auto hide-scrollbar -mx-4 px-4">
                <div className="flex gap-4 pb-4">
                  {boostPackages.map((boost) => {
                const IconComponent = iconMap[boost.icon] || Zap;
                const isSelected = selectedBoost?.id === boost.id;
                
                return (
                  <div key={boost.id} style={{ width: '85vw', minWidth: '320px' }} className="flex-shrink-0">
                    <Card 
                      className={`relative p-6 cursor-pointer transition-all duration-300 ${
                        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'
                      } ${boost.popular ? 'border-2 border-orange-500' : ''}`}
                      onClick={() => setSelectedBoost(boost)}
                    >
                      {boost.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold mt-3">
                            Most Popular
                          </div>
                        </div>
                      )}
                      
                      <div className="text-center mt-2">
                        <div className={`w-14 h-14 bg-gradient-to-r ${getColorClasses(boost.color)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                          <IconComponent className="w-7 h-7 text-white" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{boost.name}</h3>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">₹{boost.price}</span>
                        </div>
                        
                        <ul className="space-y-2 mb-6">
                          {boost.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-gray-700 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBoostPurchase(boost);
                          }}
                          disabled={false}
                          className="w-full py-3 font-bold text-base bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                        >
                          <Zap className="w-5 h-5 mr-2" />
                          Buy Now
                        </Button>
                      </div>
                    </Card>
                  </div>
                );
                  })}
                </div>
              </div>

              {/* Desktop: Grid */}
              <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
                {boostPackages.map((boost) => {
              const IconComponent = iconMap[boost.icon] || Zap;
              const isSelected = selectedBoost?.id === boost.id;
              
              return (
                <Card 
                  key={boost.id}
                  className={`relative p-8 cursor-pointer transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'
                  } ${boost.popular ? 'border-2 border-orange-500' : ''}`}
                  onClick={() => setSelectedBoost(boost)}
                >
                  {boost.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold mt-6">
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mt-3">
                    <div className={`w-16 h-16 bg-gradient-to-r ${getColorClasses(boost.color)} rounded-full flex items-center justify-center mx-auto mb-6`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{boost.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">₹{boost.price}</span>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {boost.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-700 text-base">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBoostPurchase(boost);
                      }}
                      disabled={true}
                      className="w-full py-4 font-bold text-lg bg-gray-400 cursor-not-allowed text-white opacity-60"
                    >
                      <Zap className="w-6 h-6 mr-2" />
                      Buy Now (Disabled)
                    </Button>
                  </div>
                </Card>
              );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rental Selector Modal */}
      {showRentalSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Select Rental to Boost</h3>
                <Button
                  onClick={() => setShowRentalSelector(false)}
                  variant="ghost"
                  className="p-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {userRentals.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-gray-900 mb-2">No Approved Rentals</h4>
                  <p className="text-gray-600 mb-6">You need to have approved rental listings to boost them.</p>
                  <Button onClick={() => navigate('/post-ad')}>
                    Create Rental Listing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userRentals.map((rental) => (
                    <div
                      key={rental._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRental?._id === rental._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedRental(rental)}
                    >
                      <div className="flex items-center space-x-4">
                        {rental.images && rental.images.length > 0 && (
                          <img
                            src={rental.images[0].url}
                            alt={rental.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{rental.title}</h4>
                          <p className="text-gray-600 text-sm">{rental.description}</p>
                          <div className="flex items-center mt-2">
                            <span className="text-lg font-bold text-green-600">
                              ₹{rental.price?.amount || rental.price?.pricePerDay}/day
                            </span>
                            <span className="ml-4 text-sm text-gray-500">
                              {rental.location?.city || rental.location?.address}
                            </span>
                          </div>
                        </div>
                        {selectedRental?._id === rental._id && (
                          <CheckCircle className="w-6 h-6 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex space-x-4 pt-4">
                    <Button
                      onClick={() => {
                        setShowRentalSelector(false);
                        if (selectedRental) {
                          handleBoostPurchase(selectedBoost);
                        }
                      }}
                      disabled={!selectedRental}
                      className="flex-1"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Boost Selected Rental
                    </Button>
                    <Button
                      onClick={() => setShowRentalSelector(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyBoost;
