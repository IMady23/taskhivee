import { useContext } from 'react';

/**
 * useAuth Hook
 * Provides access to authentication context
 * Usage: const { user, token, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * useSocket Hook
 * Provides access to Socket.io connection
 * Usage: const socket = useSocket();
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

/**
 * useAsync Hook
 * Handles async data fetching with loading, error, and data states
 * Usage: const { data, loading, error } = useAsync(fetchFunction, dependencies);
 */
export const useAsync = (asyncFunction, immediate = true, deps = []) => {
  const [status, setStatus] = React.useState('idle');
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);

  const execute = React.useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error);
      setStatus('error');
    }
  }, [asyncFunction]);

  React.useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps);

  return { execute, status, data, error };
};

// Placeholder context objects - to be implemented
const AuthContext = React.createContext();
const SocketContext = React.createContext();
