/**
 * Focus Mode Manager Service
 * Client-side service for managing focus mode state
 */

class FocusModeManager {
  constructor() {
    this.STORAGE_KEY = "taskhive_focus_mode";
    this.state = this.loadState();
  }

  /**
   * Load focus mode state from localStorage
   */
  loadState() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading focus mode state:", error);
    }

    return {
      isActive: false,
      currentTask: null,
      startTime: null,
      focusModeEnabled: false,
    };
  }

  /**
   * Save focus mode state to localStorage
   */
  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error("Error saving focus mode state:", error);
    }
  }

  /**
   * Enter focus mode with a specific task
   * @param {Object} task - Task object
   */
  enterFocusMode(task) {
    this.state = {
      isActive: true,
      currentTask: task,
      startTime: new Date().toISOString(),
      focusModeEnabled: true,
    };
    this.saveState();
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent("focusModeChanged", { detail: this.state }));
  }

  /**
   * Exit focus mode
   */
  exitFocusMode() {
    this.state = {
      ...this.state,
      isActive: false,
      currentTask: null,
      startTime: null,
    };
    this.saveState();
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent("focusModeChanged", { detail: this.state }));
  }

  /**
   * Get current focus mode state
   * @returns {Object} Current state
   */
  getFocusModeState() {
    return {
      ...this.state,
      elapsedTime: this.getElapsedTime(),
    };
  }

  /**
   * Get elapsed time in focus mode
   * @returns {number} Elapsed time in milliseconds
   */
  getElapsedTime() {
    if (!this.state.isActive || !this.state.startTime) {
      return 0;
    }

    const start = new Date(this.state.startTime);
    const now = new Date();
    return now - start;
  }

  /**
   * Format elapsed time as string
   * @returns {string} Formatted time (HH:MM:SS)
   */
  getFormattedElapsedTime() {
    const elapsed = this.getElapsedTime();
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const h = hours.toString().padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");

    return `${h}:${m}:${s}`;
  }

  /**
   * Save focus mode preference
   * @param {boolean} enabled - Whether focus mode is enabled
   */
  saveFocusModePreference(enabled) {
    this.state.focusModeEnabled = enabled;
    this.saveState();
  }

  /**
   * Check if focus mode is active
   * @returns {boolean}
   */
  isActive() {
    return this.state.isActive;
  }

  /**
   * Get current task
   * @returns {Object|null}
   */
  getCurrentTask() {
    return this.state.currentTask;
  }
}

// Export singleton instance
export default new FocusModeManager();
