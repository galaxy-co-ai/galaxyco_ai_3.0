'use client';

import { useState, useEffect } from 'react';

export type TimeOfDay = 'morning' | 'midday' | 'evening';

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'midday';
  return 'evening';
}

/**
 * Returns the current time-of-day period and a CSS class for ambient styling.
 * Updates every 30 minutes.
 */
export function useTimeOfDay() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    timeOfDay,
    ambientClass: timeOfDay === 'midday' ? '' : `neptune-ambient--${timeOfDay}`,
  };
}
