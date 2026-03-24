import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            onClick={() => navigate('/dashboard/account')}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors bg-transparent"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
          <div className="flex items-center gap-2">
            <HelpCircle size={24} className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">FAQs</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
              <HelpCircle size={32} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqData.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpanded(index)}
                  className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {expandedItems.has(index) ? (
                    <ChevronUp size={20} className="text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedItems.has(index) && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FAQs;
