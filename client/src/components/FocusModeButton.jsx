import React from 'react';
import FocusModeManager from '../services/FocusModeManager';

const FocusModeButton = ({ taskId, onEnterFocusMode }) => {
  const handleToggleFocusMode = () => {
    const isInFocusMode = FocusModeManager.getFocusModeState();
    
    if (isInFocusMode) {
      FocusModeManager.exitFocusMode();
      // Reload or navigate back to normal view
      window.location.reload();
    } else {
      FocusModeManager.enterFocusMode(taskId);
      if (onEnterFocusMode) {
        onEnterFocusMode(taskId);
      }
    }
  };

  const isInFocusMode = FocusModeManager.getFocusModeState();

  return (
    <button
      onClick={handleToggleFocusMode}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
      title={isInFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
    >
      <span className="text-xl">🎯</span>
      <span className="font-medium">
        {isInFocusMode ? 'Exit Focus' : 'Focus Mode'}
      </span>
    </button>
  );
};

export default FocusModeButton;
