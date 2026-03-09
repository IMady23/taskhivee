import React from 'react';

export default function ConfirmModal({ title = 'Confirm', message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-md w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-700">{message}</p>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onCancel} className="px-3 py-2 rounded border">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-2 bg-red-600 text-white rounded">Delete</button>
        </div>
      </div>
    </div>
  );
}
