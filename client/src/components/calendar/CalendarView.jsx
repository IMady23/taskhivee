import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Bell, Repeat, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Clock, MapPin, Users,
  Sparkles, Zap, Star, TrendingUp
} from 'lucide-react';
import { TasksContext } from '../../context/TasksContext';
import { AuthContext } from '../../context/AuthContext';
import {
  createEvent,
  subscribeToTeamEvents,
  updateEvent,
  deleteEvent,
  EVENT_TYPES,
  EVENT_COLORS,
  REMINDER_OPTIONS,
  createRecurringEvent
} from '../../services/eventService';
import { formatDate, isOverdue } from '../../utils/taskUtils';
import { toast } from 'react-hot-toast';
import './calendar.css';

const localizer = momentLocalizer(moment);

/**
 * CalendarView Component
 * Modern, polished calendar with smooth animations and optimized performance
 */
export default function CalendarView({ userRole, userId }) {
  const { tasks } = useContext(TasksContext);
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month');
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: EVENT_TYPES.MEETING,
    date: new Date(),
    reminderMinutes: 30,
    isRecurring: false,
    recurrence: {
      frequency: 'weekly',
      interval: 1,
      count: 4
    }
  });

  // Subscribe to events with optimized updates
  useEffect(() => {
    if (!user?.teamId) return;

    const unsubscribe = subscribeToTeamEvents(user.teamId, (teamEvents) => {
      setEvents(teamEvents);
    });

    return () => unsubscribe();
  }, [user?.teamId]);

  // Memoized calendar events with performance optimization
  const calendarEvents = useMemo(() => {
    const items = [];

    // Add tasks with due dates
    if (tasks) {
      tasks.forEach(task => {
        if (task.dueDate) {
          const dueDate = task.dueDate.seconds
            ? new Date(task.dueDate.seconds * 1000)
            : (task.dueDate ? new Date(task.dueDate) : null);

          if (!dueDate || isNaN(dueDate.getTime())) return;

          items.push({
            id: `task-${task.id}`,
            title: task.title,
            start: dueDate,
            end: dueDate,
            type: 'task',
            resource: task,
            color: isOverdue(task) ? '#EF4444' : '#3B82F6',
            priority: task.priority
          });
        }
      });
    }

    // Add special events
    events.forEach(event => {
      items.push({
        id: `event-${event.id}`,
        title: event.title,
        start: event.date,
        end: event.date,
        type: 'event',
        resource: event,
        color: EVENT_COLORS[event.type] || '#6B7280',
        eventType: event.type
      });
    });

    return items;
  }, [tasks, events]);

  // Stats for dashboard
  const stats = useMemo(() => {
    const today = new Date();
    const upcomingTasks = tasks?.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = t.dueDate.seconds ? new Date(t.dueDate.seconds * 1000) : (t.dueDate ? new Date(t.dueDate) : null);
      return dueDate && dueDate > today && dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    }).length || 0;

    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate > today && eventDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    }).length || 0;

    const overdueTasks = tasks?.filter(t => isOverdue(t)).length || 0;

    return { upcomingTasks, upcomingEvents, overdueTasks };
  }, [tasks, events]);

  // Handle date selection with animation
  const handleSelectSlot = useCallback(({ start }) => {
    setSelectedDate(start);
    setEventForm(prev => ({ ...prev, date: start }));
    setSelectedEvent(null);
    setShowEventModal(true);
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event) => {
    if (event.type === 'event') {
      setSelectedEvent(event.resource);
      setEventForm({
        title: event.resource.title,
        description: event.resource.description || '',
        type: event.resource.type,
        date: event.resource.date,
        reminderMinutes: event.resource.reminderMinutes || 30,
        isRecurring: event.resource.isRecurring || false,
        recurrence: event.resource.recurrence || {
          frequency: 'weekly',
          interval: 1,
          count: 4
        }
      });
      setShowEventModal(true);
    }
  }, []);

  // Handle event creation/update
  const handleSaveEvent = async () => {
    try {
      if (!eventForm.title.trim()) {
        toast.error('Event title is required');
        return;
      }

      const loadingToast = toast.loading(selectedEvent ? 'Updating event...' : 'Creating event...');

      if (selectedEvent) {
        await updateEvent(selectedEvent.id, eventForm);
        toast.success('Event updated!', { id: loadingToast });
      } else {
        if (eventForm.isRecurring) {
          await createRecurringEvent(eventForm, user.teamId, user.uid, eventForm.recurrence);
          toast.success(`Created ${eventForm.recurrence.count} recurring events!`, { id: loadingToast });
        } else {
          await createEvent(eventForm, user.teamId, user.uid);
          toast.success('Event created!', { id: loadingToast });
        }
      }

      setShowEventModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const loadingToast = toast.loading('Deleting event...');
        await deleteEvent(selectedEvent.id);
        toast.success('Event deleted!', { id: loadingToast });
        setShowEventModal(false);
        resetForm();
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
      }
    }
  };

  // Reset form
  const resetForm = useCallback(() => {
    setEventForm({
      title: '',
      description: '',
      type: EVENT_TYPES.MEETING,
      date: new Date(),
      reminderMinutes: 30,
      isRecurring: false,
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        count: 4
      }
    });
    setSelectedEvent(null);
    setSelectedDate(null);
  }, []);

  // Custom event style with gradient
  const eventStyleGetter = useCallback((event) => {
    const isPriority = event.priority === 'High' || event.priority === 'Urgent';
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '6px',
        opacity: 0.95,
        color: 'white',
        border: isPriority ? '2px solid rgba(255, 255, 255, 0.5)' : '0px',
        display: 'block',
        fontSize: '12px',
        padding: '3px 6px',
        fontWeight: isPriority ? '600' : '500',
        boxShadow: isPriority ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease'
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col calendar-container">
      {/* Enhanced Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <CalendarIcon size={32} className="text-blue-500" />
              </motion.div>
              Calendar
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Manage your tasks, events, and deadlines
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedDate(new Date());
              setEventForm(prev => ({ ...prev, date: new Date() }));
              setShowEventModal(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30"
          >
            <Plus size={20} />
            <span className="font-medium">Add Event</span>
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Upcoming Tasks</p>
                <p className="text-2xl font-bold text-blue-500">{stats.upcomingTasks}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <TrendingUp size={24} className="text-blue-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Upcoming Events</p>
                <p className="text-2xl font-bold text-purple-500">{stats.upcomingEvents}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Sparkles size={24} className="text-purple-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Overdue Tasks</p>
                <p className="text-2xl font-bold text-red-500">{stats.overdueTasks}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <Zap size={24} className="text-red-500" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Calendar with smooth animations */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--border-color)] shadow-xl calendar-wrapper"
      >
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventStyleGetter}
          style={{ height: '100%' }}
          views={['month', 'week', 'day', 'agenda']}
          popup
          showMultiDayTimes
        />
      </motion.div>

      {/* Enhanced Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-lg w-full border border-[var(--border-color)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg"
                  >
                    <CalendarIcon size={24} className="text-blue-500" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                    {selectedEvent ? 'Edit Event' : 'Create Event'}
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowEventModal(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                >
                  <X size={24} />
                </motion.button>
              </div>

              {/* Form */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter event title"
                  />
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Add event description"
                    rows={3}
                  />
                </motion.div>

                {/* Type */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Event Type
                  </label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {Object.entries(EVENT_TYPES).map(([key, value]) => (
                      <option key={value} value={value}>
                        {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* Date & Time */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <Clock size={16} />
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={moment(eventForm.date).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setEventForm(prev => ({ ...prev, date: new Date(e.target.value) }))}
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </motion.div>

                {/* Reminder */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <Bell size={16} />
                    Reminder
                  </label>
                  <select
                    value={eventForm.reminderMinutes}
                    onChange={(e) => setEventForm(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value={0}>No reminder</option>
                    {REMINDER_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* Recurring */}
                {!selectedEvent && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-primary)] transition-colors">
                      <input
                        type="checkbox"
                        checked={eventForm.isRecurring}
                        onChange={(e) => setEventForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                        className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Repeat size={16} />
                        Recurring Event
                      </span>
                    </label>

                    <AnimatePresence>
                      {eventForm.isRecurring && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-3 pl-4 border-l-2 border-blue-500/30"
                        >
                          <select
                            value={eventForm.recurrence.frequency}
                            onChange={(e) => setEventForm(prev => ({
                              ...prev,
                              recurrence: { ...prev.recurrence, frequency: e.target.value }
                            }))}
                            className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>

                          <input
                            type="number"
                            min="1"
                            max="52"
                            value={eventForm.recurrence.count}
                            onChange={(e) => setEventForm(prev => ({
                              ...prev,
                              recurrence: { ...prev.recurrence, count: parseInt(e.target.value) }
                            }))}
                            className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Number of occurrences"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 flex gap-3"
              >
                {selectedEvent && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteEvent}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-lg shadow-red-500/30"
                  >
                    Delete
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-5 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-primary)] transition-colors font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEvent}
                  className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-lg shadow-blue-500/30"
                >
                  {selectedEvent ? 'Update' : 'Create'}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
