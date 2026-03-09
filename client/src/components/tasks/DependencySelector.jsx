/**
 * Dependency Selector Component
 * Multi-select dropdown for choosing dependent tasks
 */
import { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const DependencySelector = ({ taskId, teamId, currentDependencies = [], onUpdate }) => {
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedDeps, setSelectedDeps] = useState(currentDependencies);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchAvailableTasks();
  }, [teamId, taskId]);

  const fetchAvailableTasks = async () => {
    try {
      setLoading(true);
      const tasksQuery = query(
        collection(db, "tasks"),
        where("teamId", "==", teamId)
      );
      const snapshot = await getDocs(tasksQuery);

      const tasks = [];
      snapshot.forEach((doc) => {
        // Exclude current task and already completed tasks
        if (doc.id !== taskId && doc.data().status !== "completed") {
          tasks.push({
            id: doc.id,
            title: doc.data().title,
            status: doc.data().status,
          });
        }
      });

      setAvailableTasks(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDependency = (depId) => {
    setSelectedDeps((prev) => {
      if (prev.includes(depId)) {
        return prev.filter((id) => id !== depId);
      } else {
        return [...prev, depId];
      }
    });
  };

  const handleSave = () => {
    onUpdate(selectedDeps);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedDeps(currentDependencies);
    setIsOpen(false);
  };

  const getSelectedTaskNames = () => {
    return availableTasks
      .filter((task) => selectedDeps.includes(task.id))
      .map((task) => task.title)
      .join(", ");
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Task Dependencies
      </label>

      {/* Display selected dependencies */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selectedDeps.length === 0 ? (
          <span className="text-gray-400">Select dependencies...</span>
        ) : (
          <span className="text-gray-900 dark:text-gray-100">
            {selectedDeps.length} {selectedDeps.length === 1 ? "dependency" : "dependencies"} selected
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading tasks...</div>
          ) : availableTasks.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No available tasks</div>
          ) : (
            <>
              <div className="p-2">
                {availableTasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDeps.includes(task.id)}
                      onChange={() => toggleDependency(task.id)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {task.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Status: {task.status}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Action buttons */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Show selected task names */}
      {selectedDeps.length > 0 && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Selected: {getSelectedTaskNames()}
        </div>
      )}
    </div>
  );
};

export default DependencySelector;
