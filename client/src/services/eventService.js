/**
 * Event Service
 * Handles special events, reminders, and calendar management
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Event Types
 */
export const EVENT_TYPES = {
  MEETING: 'meeting',
  DEADLINE: 'deadline',
  MILESTONE: 'milestone',
  REMINDER: 'reminder',
  HOLIDAY: 'holiday',
  BIRTHDAY: 'birthday',
  OTHER: 'other'
};

/**
 * Event Colors
 */
export const EVENT_COLORS = {
  meeting: '#3B82F6',      // Blue
  deadline: '#EF4444',     // Red
  milestone: '#10B981',    // Green
  reminder: '#F59E0B',     // Orange
  holiday: '#8B5CF6',      // Purple
  birthday: '#EC4899',     // Pink
  other: '#6B7280'         // Gray
};

/**
 * Reminder Times (in minutes before event)
 */
export const REMINDER_OPTIONS = [
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
  { label: '1 week before', value: 10080 }
];

/**
 * Create a new event
 */
export const createEvent = async (eventData, teamId, userId) => {
  try {
    const event = {
      ...eventData,
      teamId,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Convert date to Firestore Timestamp
      date: Timestamp.fromDate(new Date(eventData.date)),
      // Set reminder time if specified
      reminderTime: eventData.reminderMinutes 
        ? Timestamp.fromDate(
            new Date(new Date(eventData.date).getTime() - eventData.reminderMinutes * 60000)
          )
        : null,
      reminderSent: false
    };

    const docRef = await addDoc(collection(db, 'events'), event);
    
    return {
      id: docRef.id,
      ...event,
      date: event.date.toDate(),
      reminderTime: event.reminderTime?.toDate()
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Get all events for a team
 */
export const getTeamEvents = async (teamId) => {
  try {
    const q = query(
      collection(db, 'events'),
      where('teamId', '==', teamId)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      reminderTime: doc.data().reminderTime?.toDate()
    }));
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
};

/**
 * Get events by date range
 */
export const getEventsByDateRange = async (teamId, startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'events'),
      where('teamId', '==', teamId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      reminderTime: doc.data().reminderTime?.toDate()
    }));
  } catch (error) {
    console.error('Error getting events by date range:', error);
    throw error;
  }
};

/**
 * Subscribe to team events (real-time)
 */
export const subscribeToTeamEvents = (teamId, callback) => {
  const q = query(
    collection(db, 'events'),
    where('teamId', '==', teamId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      reminderTime: doc.data().reminderTime?.toDate()
    }));
    
    callback(events);
  });
};

/**
 * Update an event
 */
export const updateEvent = async (eventId, updates) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    // Convert date if provided
    if (updates.date) {
      updateData.date = Timestamp.fromDate(new Date(updates.date));
    }
    
    // Recalculate reminder time if date or reminderMinutes changed
    if (updates.date && updates.reminderMinutes) {
      updateData.reminderTime = Timestamp.fromDate(
        new Date(new Date(updates.date).getTime() - updates.reminderMinutes * 60000)
      );
      updateData.reminderSent = false;
    }
    
    await updateDoc(eventRef, updateData);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Mark reminder as sent
 */
export const markReminderSent = async (eventId) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      reminderSent: true,
      reminderSentAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking reminder as sent:', error);
    throw error;
  }
};

/**
 * Get pending reminders (reminders that should be sent now)
 */
export const getPendingReminders = async (teamId) => {
  try {
    const now = new Date();
    
    const q = query(
      collection(db, 'events'),
      where('teamId', '==', teamId),
      where('reminderSent', '==', false),
      where('reminderTime', '<=', Timestamp.fromDate(now))
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      reminderTime: doc.data().reminderTime?.toDate()
    }));
  } catch (error) {
    console.error('Error getting pending reminders:', error);
    throw error;
  }
};

/**
 * Check for upcoming events (next 24 hours)
 */
export const getUpcomingEvents = async (teamId, hoursAhead = 24) => {
  try {
    const now = new Date();
    const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    
    const q = query(
      collection(db, 'events'),
      where('teamId', '==', teamId),
      where('date', '>=', Timestamp.fromDate(now)),
      where('date', '<=', Timestamp.fromDate(future))
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      reminderTime: doc.data().reminderTime?.toDate()
    }));
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    throw error;
  }
};

/**
 * Create recurring events
 */
export const createRecurringEvent = async (eventData, teamId, userId, recurrence) => {
  try {
    const events = [];
    const startDate = new Date(eventData.date);
    
    // Generate events based on recurrence pattern
    for (let i = 0; i < recurrence.count; i++) {
      const eventDate = new Date(startDate);
      
      switch (recurrence.frequency) {
        case 'daily':
          eventDate.setDate(startDate.getDate() + i * recurrence.interval);
          break;
        case 'weekly':
          eventDate.setDate(startDate.getDate() + i * 7 * recurrence.interval);
          break;
        case 'monthly':
          eventDate.setMonth(startDate.getMonth() + i * recurrence.interval);
          break;
        case 'yearly':
          eventDate.setFullYear(startDate.getFullYear() + i * recurrence.interval);
          break;
      }
      
      const event = await createEvent(
        {
          ...eventData,
          date: eventDate,
          isRecurring: true,
          recurrenceId: `${teamId}_${startDate.getTime()}`,
          recurrenceIndex: i
        },
        teamId,
        userId
      );
      
      events.push(event);
    }
    
    return events;
  } catch (error) {
    console.error('Error creating recurring events:', error);
    throw error;
  }
};
