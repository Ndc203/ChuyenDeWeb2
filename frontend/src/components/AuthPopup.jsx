import React from 'react';

const AuthPopup = ({ onClose, onLoginClick, onRegisterClick }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          {/* Placeholder for Icon */}
          {/* User should replace this with an actual image of the cartoon character */}
          <div className="mx-auto mb-2 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-3xl">👋</span>
          </div>
          <h2 className="text-2xl font-bold text-red-600">Smember</h2>
        </div>

        {/* Content */}
        <p className="text-center text-gray-700 mb-6">
          Vui lòng đăng nhập tài khoản Smember để xem ưu đãi và thanh toán dễ dàng hơn.
        </p>

        {/* Buttons */}
        <div className="flex flex-col space-y-4">
          <button
            onClick={onRegisterClick}
            className="w-full py-2 px-4 border border-red-600 text-red-600 font-semibold rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Đăng ký
          </button>
          <button
            onClick={onLoginClick}
            className="w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPopup;