import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Heart, Shield, Users, Leaf, Star, Target, Zap, ChevronRight } from 'lucide-react';
import Card from '../../components/common/Card';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f0f0f5] font-sans pb-20">

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-[1000px] mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/account')}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <Info size={20} className="text-[#fc8019]" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">About Us</h1>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Learn more about RentYatra</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[800px] mx-auto px-4 py-8">

        {/* Hero Section */}
        <div className="text-center mb-10 pt-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            About RentYatra
          </h1>
          <div className="inline-flex items-center justify-center px-4 py-1.5 bg-orange-50 border border-orange-100 rounded-full">
            <p className="text-sm md:text-base text-[#fc8019] font-bold tracking-wide uppercase">
              Your Journey of Smart Rentals!
            </p>
          </div>
        </div>

        <div className="space-y-6">

          {/* Vision Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-red-100">
                <Heart size={28} className="text-red-500 fill-red-500/20" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-3 tracking-tight">Our Vision</h2>
                <p className="text-gray-600 leading-relaxed font-medium">
                  At RentYatra, we believe that owning is optional, but experiencing is essential.
                  Our platform connects people who have unused products with those who need them
                  temporarily — creating a smart, sustainable, and affordable way to access almost
                  anything without buying it.
                </p>
              </div>
            </div>
          </div>

          {/* What We Offer Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100">
                <Target size={28} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-3 tracking-tight">What We Offer</h2>
                <p className="text-gray-600 leading-relaxed font-medium">
                  From electronics, furniture, and vehicles to event essentials and travel gear,
                  RentYatra helps you rent, lend, or share products easily and securely. Whether
                  you're an owner looking to earn extra income or a renter searching for budget-friendly
                  options, RentYatra is here to make your rental experience smooth and trustworthy.
                </p>
              </div>
            </div>
          </div>

          {/* Mission Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-green-100">
                <Leaf size={28} className="text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-3 tracking-tight">Our Mission</h2>
                <p className="text-gray-600 leading-relaxed font-medium">
                  We aim to reduce waste, promote reusability, and build a community that values
                  sharing over ownership. With a user-friendly interface, verified users, secure
                  payments, and transparent policies, RentYatra ensures every transaction is safe
                  and satisfying.
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid Header */}
          <div className="pt-8 pb-2 text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Why Choose RentYatra?</h2>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="text-center p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
                <Shield size={24} className="text-[#fc8019]" />
              </div>
              <h3 className="font-extrabold text-gray-900 mb-2 tracking-tight text-lg">Secure & Safe</h3>
              <p className="text-sm text-gray-500 font-medium">Verified users and secure payment processing</p>
            </div>

            <div className="text-center p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
                <Users size={24} className="text-[#fc8019]" />
              </div>
              <h3 className="font-extrabold text-gray-900 mb-2 tracking-tight text-lg">Community Driven</h3>
              <p className="text-sm text-gray-500 font-medium">Building a collaborative sharing economy together</p>
            </div>

            <div className="text-center p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
                <Star size={24} className="text-[#fc8019]" />
              </div>
              <h3 className="font-extrabold text-gray-900 mb-2 tracking-tight text-lg">Quality Assured</h3>
              <p className="text-sm text-gray-500 font-medium">Transparent policies and strict quality control</p>
            </div>
          </div>

          {/* Swiggy Style Call to Action Banner */}
          <div className="mt-8 bg-gradient-to-r from-[#fc8019] to-[#ffc107] rounded-3xl p-8 md:p-10 text-center text-white shadow-lg relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-sm">
                  <Zap size={32} className="text-white fill-white/50" />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight">Join the Movement</h2>
              <p className="text-white/90 leading-relaxed font-medium max-w-lg mx-auto mb-6 text-sm md:text-base">
                Experience convenience and sustainability combined. Every rental is a step toward a greener, smarter tomorrow.
              </p>
              <div className="inline-block bg-white text-[#fc8019] px-6 py-3 rounded-xl font-extrabold tracking-tight shadow-sm hover:scale-105 transition-transform cursor-default">
                The Journey Begins Here
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AboutUs;