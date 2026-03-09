/**
 * Activity Logger Service
 * Captures and stores team activity events for timeline visualization
 */
import { db } from "../config/firebase.js";

class ActivityLogger {
  /**
   * Log an activity event
   * @param {Object} event - Event data
   * @returns {Promise<string>} Document ID
   */
  async logEvent(event) {
    try {
      const {
        teamId,
        userId,
        userName,
        eventType,
        entityType,
        entityId,
        entityName,
        metadata = {},
      } = event;

      // Validate required fields
      if (!teamId || !userId || !eventType || !entityType || !entityId) {
        console.warn("Missing required fields for activity log:", event);
        return null;
      }

      const activityEvent = {
        teamId,
        userId,
        userName: userName || "Unknown User",
        eventType,
        entityType,
        entityId,
        entityName: entityName || "Unknown",
        metadata,
        timestamp: new Date(),
      };

      const docRef = await db.collection("activity_events").add(activityEvent);
      return docRef.id;
    } catch (error) {
      // Activity logging should not block main operations
      console.error("Error logging activity event:", error);
      return null;
    }
  }

  /**
   * Get events with pagination and filtering
   * @param {string} teamId - The team ID
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Events and pagination info
   */
  async getEvents(teamId, filters = {}, pagination = {}) {
    try {
      let query = db
        .collection("activity_events")
        .where("teamId", "==", teamId)
        .orderBy("timestamp", "desc");

      // Apply filters
      if (filters.eventType) {
        query = query.where("eventType", "==", filters.eventType);
      }

      if (filters.userId) {
        query = query.where("userId", "==", filters.userId);
      }

      if (filters.startDate) {
        query = query.where("timestamp", ">=", new Date(filters.startDate));
      }

      if (filters.endDate) {
        query = query.where("timestamp", "<=", new Date(filters.endDate));
      }

      // Apply pagination
      const limit = pagination.limit || 50;
      query = query.limit(limit + 1); // Fetch one extra to check if there are more

      if (pagination.cursor) {
        const cursorDoc = await db
          .collection("activity_events")
          .doc(pagination.cursor)
          .get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      const snapshot = await query.get();

      const events = [];
      let hasMore = false;

      snapshot.forEach((doc, index) => {
        if (index < limit) {
          events.push({
            id: doc.id,
            ...doc.data(),
          });
        } else {
          hasMore = true;
        }
      });

      const nextCursor = events.length > 0 ? events[events.length - 1].id : null;

      return {
        events,
        hasMore,
        nextCursor,
      };
    } catch (error) {
      console.error("Error getting activity events:", error);
      throw error;
    }
  }

  /**
   * Get available filter options for a team
   * @param {string} teamId - The team ID
   * @returns {Promise<Object>} Available filters
   */
  async getFilterOptions(teamId) {
    try {
      // Get unique event types
      const eventsSnapshot = await db
        .collection("activity_events")
        .where("teamId", "==", teamId)
        .limit(1000)
        .get();

      const eventTypes = new Set();
      const users = new Map();

      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        eventTypes.add(data.eventType);
        if (data.userId && data.userName) {
          users.set(data.userId, data.userName);
        }
      });

      return {
        eventTypes: Array.from(eventTypes),
        users: Array.from(users.entries()).map(([id, name]) => ({ id, name })),
      };
    } catch (error) {
      console.error("Error getting filter options:", error);
      throw error;
    }
  }

  /**
   * Format event for display
   * @param {Object} event - Event data
   * @returns {string} Formatted description
   */
  formatEventDescription(event) {
    const time = new Date(event.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const descriptions = {
      task_assigned: `${event.userName} was assigned task: ${event.entityName}`,
      task_updated: `${event.userName} updated task: ${event.entityName}`,
      task_reassigned: `Task ${event.entityName} was reassigned`,
      task_completed: `${event.userName} completed task: ${event.entityName}`,
      bug_created: `${event.userName} reported bug: ${event.entityName}`,
      bug_resolved: `${event.userName} resolved bug: ${event.entityName}`,
      member_added: `${event.entityName} joined the team`,
      member_removed: `${event.entityName} left the team`,
    };

    const description =
      descriptions[event.eventType] || `${event.eventType} on ${event.entityName}`;

    return `${time} – ${description}`;
  }

  /**
   * Get event icon
   * @param {string} eventType - Event type
   * @returns {string} Emoji icon
   */
  getEventIcon(eventType) {
    const icons = {
      task_assigned: "📋",
      task_updated: "✏️",
      task_reassigned: "🔄",
      task_completed: "✅",
      bug_created: "🐛",
      bug_resolved: "✨",
      member_added: "👋",
      member_removed: "👋",
    };

    return icons[eventType] || "📌";
  }
}

export default new ActivityLogger();
