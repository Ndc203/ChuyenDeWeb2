import React from 'react';
import { useNavigate } from 'react-router-dom';

const AuthPromptModal = ({ isOpen, onClose, onSwitchToLogin, onSwitchToRegister }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLoginClick = () => {
    onSwitchToLogin();
    onClose();
  };

  const handleRegisterClick = () => {
    onSwitchToRegister();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
        >
          &times;
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-red-600">Smember</h2>
        </div>

        {/* Icon - Placeholder for now */}
        <div className="flex justify-center mb-4">
          {/* Replace with actual image later */}
          <img src="https://via.placeholder.com/80x80?text=👋" alt="Chào mừng" className="w-20 h-20" />
        </div>

        {/* Content */}
        <p className="text-center text-gray-700 mb-6">
          Vui lòng đăng nhập tài khoản Smember để xem ưu đãi và thanh toán dễ dàng hơn.
        </p>

        {/* Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleRegisterClick}
            className="w-full py-2 px-4 border border-red-600 text-red-600 font-semibold rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Đăng ký
          </button>
          <button
            onClick={handleLoginClick}
            className="w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPromptModal;