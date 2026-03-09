/**
 * Activity Timeline Page Component
 * Full page with vertical timeline and filters
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import ActivityEventCard from "../components/ActivityEventCard";
import api from "../services/api";

const ActivityTimelinePage = () => {
  const { teamId } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const { currentUser } = useAuth();

  // Filters
  const [filters, setFilters] = useState({
    eventType: "",
    userId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (teamId) {
      fetchEvents();
    }
  }, [teamId, filters]);

  const fetchEvents = async (cursor = null) => {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();

      const params = new URLSearchParams();
      if (filters.eventType) params.append("eventType", filters.eventType);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (cursor) params.append("cursor", cursor);

      const response = await api.get(
        `/teams/${teamId}/activity-timeline?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (cursor) {
        setEvents((prev) => [...prev, ...response.data.events]);
      } else {
        setEvents(response.data.events);
      }

      setHasMore(response.data.hasMore);
      setNextCursor(response.data.nextCursor);
    } catch (error) {
      console.error("Error fetching activity timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && nextCursor) {
      fetchEvents(nextCursor);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Activity Timeline
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track all team activities in chronological order
          </p>
        </div>

        {/* Timeline */}
        <div className="p-6">
          {loading && events.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              No activity recorded yet
            </div>
          ) : (
            <>
              <div className="relative space-y-2">
                {events.map((event) => (
                  <ActivityEventCard key={event.id} event={event} />
                ))}
              </div>

              {/* Load more button */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityTimelinePage;
