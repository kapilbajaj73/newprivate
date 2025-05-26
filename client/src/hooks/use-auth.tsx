import { createContext, ReactNode, useContext } from "react";

// This is a placeholder implementation
// In a real application, this would be connected to your authentication system

type User = {
  id: number;
  username: string;
  fullName: string;
  role: string;
  roomId: number | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
};

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  // In a real implementation, this would fetch the current user and handle auth states
  const authState = {
    user: null,
    isLoading: false,
    error: null,
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}