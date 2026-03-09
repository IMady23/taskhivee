import React, { createContext, useEffect, useState, useContext } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config';

/**
 * SocketContext & SocketProvider
 * Manages Socket.io connection for real-time features
 * Provides: socket, connected, disconnect, emit
 */
export const SocketContext = createContext();

export const SocketProvider = ({ children, token }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    // Initialize Socket.io connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event listeners
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(err.message);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [token]);

  const value = {
    socket,
    connected,
    error,
    emit: (event, data) => socket?.emit(event, data),
    on: (event, callback) => socket?.on(event, callback),
    off: (event, callback) => socket?.off(event, callback),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// Custom hook to use socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return null;
  }
  return context.socket;
};
