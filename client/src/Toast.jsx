// client/src/Toast.jsx
import React, { useEffect } from "react";

export default function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const color =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-indigo-600";

  return (
    <div
      className={`fixed bottom-5 right-5 ${color} text-white px-4 py-2 rounded-md shadow-lg transition-all duration-500`}
    >
      {message}
    </div>
  );
}
