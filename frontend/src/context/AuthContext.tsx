import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import Constants from 'expo-constants';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

console.log('API_URL configured:', API_URL);

interface User {
  id: string;
  email?: string;
  name: string;
  username?: string;
  phone?: string;
  picture?: string;
  role: 'customer' | 'barber' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  socket: Socket | null;
  loginBarber: (sessionToken: string, userData: User) => Promise<void>;
  loginWithGoogle: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'customer' | 'barber';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Configure axios defaults
  axios.defaults.baseURL = `${API_URL}/api`;
  axios.defaults.timeout = 30000;

  // Setup axios interceptor for auth token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      if (sessionToken) {
        config.headers.Authorization = `Bearer ${sessionToken}`;
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [sessionToken]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user && sessionToken) {
      const newSocket = io(API_URL!, {
        transports: ['websocket'],
        auth: { token: sessionToken }
      });

      newSocket.on('connect', () => {
        console.log('✅ WebSocket connected');
        newSocket.emit('user_online', { user_id: user.id });
      });

      newSocket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, sessionToken]);

  // Check for existing session on mount
  useEffect(() => {
    refreshUser();
  }, []);

  const refreshUser = async () => {
    try {
      // Try to get current user if we have a session token
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      // No valid session - that's OK for customers
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginBarber = async (token: string, userData: User) => {
    setSessionToken(token);
    setUser(userData);
  };

  const loginWithGoogle = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/barber/oauth/session', {
        session_id: sessionId
      });
      
      if (response.data.success) {
        setSessionToken(response.data.session_token);
        setUser(response.data.user);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setSessionToken(null);
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        socket,
        loginBarber,
        loginWithGoogle,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
