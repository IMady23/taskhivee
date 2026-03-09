/**
 * API Configuration
 * Base URLs and endpoints for frontend API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER_LEADER: `${API_BASE_URL}/auth/register-leader`,
    REGISTER_MEMBER: `${API_BASE_URL}/auth/register-member`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    GET_CURRENT_USER: `${API_BASE_URL}/auth/me`,
    VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
    RESEND_OTP: `${API_BASE_URL}/auth/resend-otp`,
  },

  // Task endpoints
  TASKS: {
    CREATE: `${API_BASE_URL}/tasks`,
    GET_ALL: `${API_BASE_URL}/tasks`,
    GET_BY_USER: (userId) => `${API_BASE_URL}/tasks/user/${userId}`,
    GET_BY_PROJECT: (projectId) => `${API_BASE_URL}/tasks/project/${projectId}`,
    UPDATE: (taskId) => `${API_BASE_URL}/tasks/${taskId}`,
    DELETE: (taskId) => `${API_BASE_URL}/tasks/${taskId}`,
    ADD_COMMENT: (taskId) => `${API_BASE_URL}/tasks/${taskId}/comments`,
    CHANGE_STATUS: (taskId) => `${API_BASE_URL}/tasks/${taskId}/status`,
  },

  // Bug endpoints
  BUGS: {
    CREATE: `${API_BASE_URL}/bugs`,
    GET_BY_PROJECT: (projectId) => `${API_BASE_URL}/bugs/project/${projectId}`,
    UPDATE: (bugId) => `${API_BASE_URL}/bugs/${bugId}`,
    DELETE: (bugId) => `${API_BASE_URL}/bugs/${bugId}`,
    CHANGE_STATUS: (bugId) => `${API_BASE_URL}/bugs/${bugId}/status`,
    ASSIGN: (bugId) => `${API_BASE_URL}/bugs/${bugId}/assign`,
  },

  // Chat endpoints
  CHAT: {
    GET_MESSAGES: (recipientId) => `${API_BASE_URL}/chat/messages/${recipientId}`,
    SEND_MESSAGE: `${API_BASE_URL}/chat/send`,
    MARK_AS_READ: `${API_BASE_URL}/chat/read`,
    GET_UNREAD_COUNT: `${API_BASE_URL}/chat/unread-count`,
    DELETE_MESSAGE: (messageId) => `${API_BASE_URL}/chat/messages/${messageId}`,
  },

  // Project endpoints
  PROJECTS: {
    CREATE: `${API_BASE_URL}/projects`,
    GET_ALL: `${API_BASE_URL}/projects`,
    GET_BY_ID: (projectId) => `${API_BASE_URL}/projects/${projectId}`,
    UPDATE: (projectId) => `${API_BASE_URL}/projects/${projectId}`,
    DELETE: (projectId) => `${API_BASE_URL}/projects/${projectId}`,
    GET_MEMBERS: (projectId) => `${API_BASE_URL}/projects/${projectId}/members`,
  },
};

export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Task events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_STATUS_CHANGED: 'task:status-changed',

  // Bug events
  BUG_CREATED: 'bug:created',
  BUG_UPDATED: 'bug:updated',
  BUG_DELETED: 'bug:deleted',
  BUG_STATUS_CHANGED: 'bug:status-changed',

  // Chat events
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_READ: 'message:read',
  TYPING: 'chat:typing',
  STOP_TYPING: 'chat:stop-typing',

  // Notification events
  NOTIFICATION: 'notification:new',
  NOTIFICATION_CLEARED: 'notification:cleared',
};

export { SOCKET_URL, API_BASE_URL };
