/**
 * AccountabilityService
 * 
 * Provides soft accountability indicators for overdue tasks.
 * Uses gentle, non-judgmental messaging to encourage task completion.
 */

class AccountabilityService {
  /**
   * Check if a task is overdue
   * @param {Object} task - Task object with deadline
   * @returns {boolean} - True if task is overdue
   */
  static isOverdue(task) {
    if (!task.deadline) {
      return false;
    }

    const now = new Date();
    const deadline = new Date(task.deadline);
    
    // Task is overdue if deadline has passed and task is not completed
    return deadline < now && task.status !== 'Done';
  }

  /**
   * Get accountability message for overdue tasks
   * @returns {string} - Gentle accountability message
   */
  static getAccountabilityMessage() {
    return 'This task needs attention.';
  }

  /**
   * Get all overdue tasks for a member
   * @param {Array} tasks - Array of task objects
   * @param {string} memberId - Member ID to filter by
   * @returns {Array} - Array of overdue tasks
   */
  static getOverdueTasks(tasks, memberId = null) {
    let filteredTasks = tasks;

    // Filter by member if provided
    if (memberId) {
      filteredTasks = tasks.filter(task => 
        task.assignedTo && task.assignedTo.toString() === memberId.toString()
      );
    }

    // Return only overdue tasks
    return filteredTasks.filter(task => this.isOverdue(task));
  }

  /**
   * Get overdue task count for a member
   * @param {Array} tasks - Array of task objects
   * @param {string} memberId - Member ID
   * @returns {number} - Count of overdue tasks
   */
  static getOverdueCount(tasks, memberId) {
    return this.getOverdueTasks(tasks, memberId).length;
  }

  /**
   * Check if task should show accountability indicator
   * @param {Object} task - Task object
   * @returns {boolean} - True if indicator should be shown
   */
  static shouldShowIndicator(task) {
    return this.isOverdue(task);
  }
}

module.exports = AccountabilityService;
