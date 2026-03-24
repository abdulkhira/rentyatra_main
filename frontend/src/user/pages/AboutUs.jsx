import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Heart, Shield, Users, Leaf, Star, Target, Zap } from 'lucide-react';
import Card from '../../components/common/Card';

const AboutUs = () => {
  const navigate = useNavigate();

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
                <Info size={20} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">About Us</h1>
                <p className="text-sm text-gray-600">Learn more about RentYatra</p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              About RentYatra
            </h1>
            <p className="text-lg text-blue-600 font-semibold mb-6">
              Your Journey of Smart Rentals!
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <section className="mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Our Vision</h2>
                    <p className="text-gray-700 leading-relaxed">
                      At RentYatra, we believe that owning is optional, but experiencing is essential. 
                      Our platform connects people who have unused products with those who need them 
                      temporarily — creating a smart, sustainable, and affordable way to access almost 
                      anything without buying it.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* What We Offer */}
            <section className="mb-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target size={24} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">What We Offer</h2>
                  <p className="text-gray-700 leading-relaxed">
                    From electronics, furniture, and vehicles to event essentials and travel gear, 
                    RentYatra helps you rent, lend, or share products easily and securely. Whether 
                    you're an owner looking to earn extra income or a renter searching for budget-friendly 
                    options, RentYatra is here to make your rental experience smooth and trustworthy.
                  </p>
                </div>
              </div>
            </section>

            {/* Our Mission */}
            <section className="mb-8">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Leaf size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
                    <p className="text-gray-700 leading-relaxed">
                      We aim to reduce waste, promote reusability, and build a community that values 
                      sharing over ownership. With a user-friendly interface, verified users, secure 
                      payments, and transparent policies, RentYatra ensures every transaction is safe 
                      and satisfying.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <section className="mb-8">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Zap size={32} className="text-purple-600" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Join the Movement</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Join the RentYatra movement — where convenience meets sustainability, and every rental 
                  is a step toward a greener tomorrow.
                </p>
                <p className="text-lg font-bold text-purple-600">
                  RentYatra – The Journey of Rentals Begins Here.
                </p>
              </div>
            </section>

            {/* Features Grid */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Why Choose RentYatra?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield size={24} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Secure & Safe</h3>
                  <p className="text-sm text-gray-600">Verified users and secure payment processing</p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={24} className="text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Community Driven</h3>
                  <p className="text-sm text-gray-600">Building a sharing economy together</p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star size={24} className="text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Quality Assured</h3>
                  <p className="text-sm text-gray-600">Transparent policies and quality control</p>
                </div>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AboutUs;
