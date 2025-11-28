import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const toastTypes = {
  success: {
    icon: <CheckCircle className="text-green-500" size={24} />,
    style: 'bg-white border-l-4 border-green-500',
  },
  error: {
    icon: <XCircle className="text-red-500" size={24} />,
    style: 'bg-white border-l-4 border-red-500',
  },
};

export default function Toast({ message, type = 'success', show, onHide }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(show);

    if (show) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000); // Auto-hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    // Give time for the exit animation before fully hiding
    setTimeout(() => {
        if(onHide) onHide();
    }, 500); // This duration should match the transition duration
  };

  const config = toastTypes[type];

  return (
    <div
      className={`fixed top-5 right-5 z-50 transition-transform duration-500 ease-in-out
                  ${isVisible ? 'translate-x-0' : 'translate-x-[150%]'}`}
    >
      <div
        className={`flex items-center p-4 rounded-lg shadow-lg w-80 ${config.style}`}
      >
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="ml-3 text-sm font-medium text-gray-700 flex-grow">
          {message}
        </div>
        <button
          onClick={handleClose}
          className="ml-4 -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8"
        >
          <span className="sr-only">Close</span>
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
