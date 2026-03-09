import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * OTP Verification Modal Component
 * Handles OTP input and verification
 */
export default function OTPVerification({
  isOpen,
  email,
  userId,
  onVerifyOTP,
  onResendOTP,
  loading,
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      await onVerifyOTP(userId, otpCode);
    } catch (err) {
      setError(err.message || 'Verification failed');
    }
  };

  const handleResend = async () => {
    try {
      await onResendOTP(userId);
      setResendCountdown(60);
      setError('');
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md mx-4"
      >
        <h2 className="text-2xl font-bold text-center mb-2 text-blue-600">
          Verify Your Email
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          We've sent a 6-digit code to <br />
          <strong>{email}</strong>
        </p>

        {/* OTP Input Boxes */}
        <div className="flex gap-2 justify-center mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-2xl font-bold border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none transition"
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition mb-4"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        {/* Resend OTP */}
        <div className="text-center">
          <p className="text-sm text-gray-600">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resendCountdown > 0 || loading}
            className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold text-sm mt-2"
          >
            {resendCountdown > 0
              ? `Resend in ${resendCountdown}s`
              : 'Resend OTP'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
