/**
 * Focus Mode View Component
 * Minimal UI showing only current task, timer, notes, and exit button
 */
import { useState, useEffect } from "react";
import FocusModeManager from "../services/FocusModeManager";

const FocusModeView = ({ onExit }) => {
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [task, setTask] = useState(null);

  useEffect(() => {
    const state = FocusModeManager.getFocusModeState();
    setTask(state.currentTask);

    // Update timer every second
    const interval = setInterval(() => {
      setElapsedTime(FocusModeManager.getFormattedElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleExit = () => {
    FocusModeManager.exitFocusMode();
    if (onExit) {
      onExit();
    }
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No task selected</p>
          <button
            onClick={handleExit}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Exit Focus Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      {/* Exit button - top right */}
      <div className="fixed top-4 right-4">
        <button
          onClick={handleExit}
          className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-shadow flex items-center space-x-2"
        >
          <span>←</span>
          <span>Exit Focus Mode</span>
        </button>
      </div>

      {/* Main content - centered */}
      <div className="max-w-3xl mx-auto pt-16">
        {/* Timer */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {elapsedTime}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Time in focus mode
          </div>
        </div>

        {/* Task card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-6">
          {/* Task title */}
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-3xl">🎯</span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {task.title}
            </h1>
          </div>

          {/* Task description */}
          {task.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Task metadata */}
          <div className="flex flex-wrap gap-3 mb-6">
            {task.priority && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                Priority: {task.priority}
              </span>
            )}
            {task.dueDate && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.status && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm">
                Status: {task.status}
              </span>
            )}
          </div>

          {/* Notes section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Notes
            </h2>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add your notes here..."
            ></textarea>
          </div>
        </div>

        {/* Motivational message */}
        <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
          Stay focused. You've got this! 💪
        </div>
      </div>
    </div>
  );
};

export default FocusModeView;
