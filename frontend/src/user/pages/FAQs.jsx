import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, HelpCircle, ChevronDown, MessageCircleQuestion } from 'lucide-react';
import Card from '../../components/common/Card';

const FAQs = () => {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const faqData = [
    {
      question: "What is RentYatra?",
      answer: "RentYatra is an online rental platform that connects people who want to rent unused products with those who need them temporarily. It's a smart way to save money and make extra income by sharing everyday items."
    },
    {
      question: "How does RentYatra work?",
      answer: "You can list your unused items for rent or browse available products. Once you find what you need, request a rental, make the payment, and coordinate pickup or delivery with the owner."
    },
    {
      question: "What kind of products can I rent on RentYatra?",
      answer: "You can rent a wide range of categories — electronics, furniture, vehicles, home appliances, fashion accessories, event equipment, and more."
    },
    {
      question: "Is there any registration fee?",
      answer: "No, registering and creating an account on RentYatra is completely free."
    },
    {
      question: "How do I report a problem or dispute?",
      answer: "Go to the \"Help & Support\" section in the app and raise a problem with details. Our team will review and resolve it promptly."
    }
  ];

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
                <HelpCircle size={20} className="text-[#fc8019]" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">FAQs</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Help & Support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[800px] mx-auto px-4 py-8">

        {/* Header Section */}
        <div className="text-center mb-8 pt-4">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full flex items-center justify-center shadow-sm">
            <MessageCircleQuestion size={36} className="text-white" />
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500 font-medium max-w-md mx-auto">
            Got questions? We've got answers. Browse our most common queries below to find what you're looking for.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqData.map((faq, index) => {
            const isExpanded = expandedItems.has(index);

            return (
              <div
                key={index}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-[#fc8019]/30 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md'
                  }`}
              >
                <button
                  onClick={() => toggleExpanded(index)}
                  className="w-full px-5 py-5 text-left flex items-center justify-between transition-colors bg-white hover:bg-gray-50/50"
                >
                  <span className={`font-extrabold pr-4 tracking-tight text-base sm:text-lg transition-colors ${isExpanded ? 'text-[#fc8019]' : 'text-gray-900'
                    }`}>
                    {faq.question}
                  </span>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${isExpanded ? 'bg-orange-50' : 'bg-gray-50'
                    }`}>
                    <ChevronDown
                      size={20}
                      className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#fc8019]' : 'text-gray-400'
                        }`}
                    />
                  </div>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out origin-top ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                  <div className="px-5 pb-6 pt-1 border-t border-gray-50">
                    <p className="text-gray-500 font-medium text-sm sm:text-base leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Still need help banner */}
        <div className="mt-10 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 text-center">
          <h3 className="text-lg font-extrabold text-gray-900 mb-2 tracking-tight">Still need help?</h3>
          <p className="text-gray-500 font-medium text-sm mb-5">
            Can't find the answer you're looking for? Please chat to our friendly team.
          </p>
          <button
            onClick={() => navigate('/support-ticket')}
            className="bg-[#fc8019] hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl shadow-sm transition-colors"
          >
            Contact Support
          </button>
        </div>

      </div>
    </div>
  );
};

export default FAQs;