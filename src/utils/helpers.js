// utils/helpers.js - Helper Functions

import { LEVEL_COLORS, ACCURACY_THRESHOLDS, MOTIVATIONAL_MESSAGES } from './constants';
import { logger } from '@/utils/logger';

// Format time in MM:SS format
export const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format time in human readable format
export const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// Get level color classes
export const getLevelColor = (level) => {
  return LEVEL_COLORS[level] || LEVEL_COLORS[1];
};

// Get accuracy color based on percentage
export const getAccuracyColor = (accuracy) => {
  if (accuracy >= ACCURACY_THRESHOLDS.STRENGTH) {
    return 'text-green-600';
  } else if (accuracy >= ACCURACY_THRESHOLDS.MODERATE) {
    return 'text-yellow-600';
  } else {
    return 'text-red-600';
  }
};

// Get accuracy status text
export const getAccuracyStatus = (accuracy) => {
  if (accuracy >= ACCURACY_THRESHOLDS.STRENGTH) {
    return 'Strong';
  } else if (accuracy >= ACCURACY_THRESHOLDS.MODERATE) {
    return 'Moderate';
  } else {
    return 'Needs Focus';
  }
};

// Calculate progress percentage for level progression
export const calculateLevelProgress = (questionsAttempted, accuracy, requirements) => {
  if (!requirements) return 0;
  
  const questionProgress = Math.min(questionsAttempted / requirements.questionsNeeded, 1) * 50;
  const accuracyProgress = Math.min(accuracy / requirements.accuracyRequired, 1) * 50;
  
  return Math.round(questionProgress + accuracyProgress);
};

// Get random motivational message
export const getMotivationalMessage = (type = 'ENCOURAGEMENT') => {
  const messages = MOTIVATIONAL_MESSAGES[type] || MOTIVATIONAL_MESSAGES.ENCOURAGEMENT;
  return messages[Math.floor(Math.random() * messages.length)];
};

// Generate contextual motivational message
export const getContextualMessage = (overallStats) => {
  if (!overallStats) return getMotivationalMessage('WELCOME');

  const { averageAccuracy, studyStreak, totalQuestions } = overallStats;

  if (studyStreak >= 7) {
    return getMotivationalMessage('HIGH_STREAK');
  } else if (averageAccuracy >= 0.85) {
    return getMotivationalMessage('HIGH_ACCURACY');
  } else if (totalQuestions >= 100) {
    return getMotivationalMessage('MILESTONE_REACHED');
  } else if (totalQuestions >= 10) {
    return getMotivationalMessage('ENCOURAGEMENT');
  } else {
    return getMotivationalMessage('WELCOME');
  }
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Format percentage with specified decimal places
export const formatPercentage = (value, decimals = 0) => {
  if (typeof value !== 'number') return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
};

// Calculate study streak
export const calculateStudyStreak = (lastStudyDate, currentDate = new Date()) => {
  if (!lastStudyDate) return 0;
  
  const last = new Date(lastStudyDate);
  const current = new Date(currentDate);
  const diffTime = Math.abs(current - last);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= 1 ? 1 : 0; // Simplified logic
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Sort array by property
export const sortBy = (array, property, direction = 'asc') => {
  return array.sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });
};

// Group array by property
export const groupBy = (array, property) => {
  return array.reduce((groups, item) => {
    const group = item[property];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

// Calculate average
export const calculateAverage = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((total, num) => total + num, 0);
  return sum / numbers.length;
};

// Get date range for charts
export const getDateRange = (days = 7) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  return dates;
};

// Format date for display
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'long':
      return d.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'time':
      return d.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    default:
      return d.toLocaleDateString();
  }
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Local storage helpers with error handling
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logger.error('Error getting from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Error setting to localStorage:', error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error('Error removing from localStorage:', error);
      return false;
    }
  }
};
