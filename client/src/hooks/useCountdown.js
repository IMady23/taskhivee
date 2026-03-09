import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for live countdown timer logic
 * @param {Date|Object|string} targetDate - The deadline date
 * @returns {Object} { days, hours, minutes, seconds, isOverdue, totalSeconds, formattedOverdue }
 */
export const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState(null);

  const calculateTimeLeft = useCallback(() => {
    if (!targetDate) return null;

    let date;
    // Handle Firestore Timestamp
    if (targetDate.seconds) {
      date = new Date(targetDate.seconds * 1000);
    } else {
      date = new Date(targetDate);
    }

    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const difference = date.getTime() - now.getTime();
    
    const isOverdue = difference <= 0;
    const absDiff = Math.abs(difference);

    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

    const totalSeconds = difference / 1000;

    // "Overdue by X days Y hours"
    let formattedOverdue = '';
    if (isOverdue) {
      if (days > 0) {
        formattedOverdue = `Overdue by ${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
      } else if (hours > 0) {
        formattedOverdue = `Overdue by ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      } else {
        formattedOverdue = `Overdue by ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      }
    }

    return {
      days: days.toString().padStart(2, '0'),
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      isOverdue,
      totalSeconds,
      formattedOverdue
    };
  }, [targetDate]);

  useEffect(() => {
    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return timeLeft;
};

export default useCountdown;
