import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const googleAccessToken = localStorage.getItem('googleAccessToken');
    const googleRefreshToken = localStorage.getItem('googleRefreshToken');
    
    if (googleAccessToken) {
      return {
        googleAccessToken,
        googleRefreshToken: googleRefreshToken || undefined
      };
    }
    return null;
  });

  useEffect(() => {
    if (user?.googleAccessToken) {
      localStorage.setItem('googleAccessToken', user.googleAccessToken);
      if (user.googleRefreshToken) {
        localStorage.setItem('googleRefreshToken', user.googleRefreshToken);
      }
    } else {
      localStorage.removeItem('googleAccessToken');
      localStorage.removeItem('googleRefreshToken');
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 