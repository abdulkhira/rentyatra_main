import { Check, Sparkles } from 'lucide-react';
import Button from '../common/Button';

const PlanCard = ({ plan, onSelect, loading, isPopular, isMobile = false }) => {
  const { name, price, features, gradient, popular } = plan;

  return (
    <div
      className={`relative bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 ${
        popular || isPopular ? 'ring-2 md:ring-4 ring-blue-500 md:scale-105' : ''
      } ${isMobile ? 'h-full' : ''}`}
    >
      {/* Popular Badge */}
      {(popular || isPopular) && (
        <div className="absolute top-0 right-0 left-0 z-10">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 md:px-4 md:py-2 text-center flex items-center justify-center gap-1 md:gap-1.5">
            <Sparkles size={12} fill="currentColor" />
            <span>MOST POPULAR</span>
            <Sparkles size={12} fill="currentColor" />
          </div>
        </div>
      )}

      {/* Gradient Header */}
      <div className={`bg-gradient-to-br ${gradient} ${
        isMobile 
          ? `p-4 ${(popular || isPopular) ? 'pt-10' : 'pt-6'}` 
          : `p-4 md:p-5 ${(popular || isPopular) ? 'pt-10 md:pt-12' : 'pt-6 md:pt-8'}`
      } text-white`}>
        <h3 className={`${
          isMobile ? 'text-lg' : 'text-lg md:text-xl'
        } font-black uppercase tracking-wide mb-1 md:mb-2`}>
          {name}
        </h3>
        <div className="flex items-baseline gap-1 md:gap-2">
          <span className={`${
            isMobile ? 'text-3xl' : 'text-2xl md:text-3xl'
          } font-black`}>₹{price}</span>
          <span className={`${
            isMobile ? 'text-sm' : 'text-sm md:text-base'
          } opacity-90`}>one-time</span>
        </div>
      </div>

      {/* Features List */}
      <div className={`${
        isMobile ? 'p-4' : 'p-4 md:p-5'
      } bg-gray-50`}>
        <ul className={`${
          isMobile ? 'space-y-2 mb-4' : 'space-y-2 md:space-y-3 mb-4 md:mb-5'
        }`}>
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 md:gap-2.5">
              <div className="flex-shrink-0 mt-0.5">
                <div className={`${
                  isMobile ? 'w-5 h-5' : 'w-4 h-4 md:w-5 md:h-5'
                } rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <Check size={isMobile ? 12 : 10} className="text-white" strokeWidth={3} />
                </div>
              </div>
              <span className={`text-gray-700 ${
                isMobile ? 'text-xs' : 'text-xs md:text-sm'
              } leading-relaxed font-medium`}>
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* Select Button */}
        <Button
          onClick={() => onSelect(plan.id)}
          disabled={loading}
          className={`w-full ${
            isMobile ? 'py-2.5 text-sm' : 'py-2.5 md:py-3 text-sm'
          } font-bold rounded-lg bg-gradient-to-r ${gradient} hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-200 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Processing...' : 'Select Plan'}
        </Button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-16 md:w-20 h-16 md:h-20 bg-white opacity-10 rounded-full -mr-8 md:-mr-10 -mt-8 md:-mt-10"></div>
      <div className="absolute bottom-0 left-0 w-12 md:w-16 h-12 md:h-16 bg-white opacity-10 rounded-full -ml-6 md:-ml-8 -mb-6 md:-mb-8"></div>
    </div>
  );
};

export default PlanCard;

