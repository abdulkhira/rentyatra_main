import { useRef, useEffect } from 'react';

const OTPInput = ({ length = 6, value, onChange, disabled = false }) => {
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index, newValue) => {
    // Only allow numbers
    if (newValue && !/^\d+$/.test(newValue)) return;

    const newOTP = [...value];
    newOTP[index] = newValue.slice(-1); // Only take last character
    onChange(newOTP);

    // Auto-focus next input
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // If current input is empty, focus previous input
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOTP = [...value];
        newOTP[index] = '';
        onChange(newOTP);
      }
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted data is valid (only numbers and correct length)
    if (/^\d+$/.test(pastedData) && pastedData.length === length) {
      onChange(pastedData.split(''));
      // Focus last input
      inputRefs.current[length - 1]?.focus();
    }
  };

  const handleFocus = (index) => {
    // Select the content on focus for easy replacement
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex gap-1.5 md:gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={`
            w-10 h-11 md:w-14 md:h-16 
            text-center text-xl md:text-3xl font-bold 
            border-2 rounded-lg md:rounded-xl
            transition-all duration-200
            focus:outline-none focus:ring-2 md:focus:ring-4
            ${
              value[index]
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 bg-white text-gray-900'
            }
            ${
              disabled
                ? 'opacity-50 cursor-not-allowed bg-gray-100'
                : 'hover:border-indigo-400 focus:border-indigo-600 focus:ring-indigo-200'
            }
          `}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;

