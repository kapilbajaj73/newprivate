import React, { createContext, useState, useEffect, useContext } from "react";
import { queryClient } from "./queryClient";

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: "admin" | "user";
  roomId: number | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  createUser: (email: string, password: string, userData: Omit<User, "id" | "email">) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getInitialUser = async () => {
      try {
        // Check if user is saved in localStorage first for quick loading
        const savedUser = localStorage.getItem('onravoice_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        // Check session with server API
        const response = await fetch('/api/auth/current');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem('onravoice_user', JSON.stringify(userData));
        } else {
          // No active session
          setUser(null);
          localStorage.removeItem('onravoice_user');
        }
      } catch (error) {
        console.error("Auth state error:", error);
        setUser(null);
        localStorage.removeItem('onravoice_user');
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      const userData = await response.json();
      localStorage.setItem('onravoice_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      
      setUser(null);
      localStorage.removeItem('onravoice_user');
      // Clear query cache on logout
      queryClient.clear();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const createUser = async (
    email: string, 
    password: string, 
    userData: Omit<User, "id" | "email">
  ): Promise<User> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...userData,
          email, 
          password 
        }),
      });
      
      if (!response.ok) {
        throw new Error("User creation failed");
      }
      
      const newUser = await response.json();
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, createUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
