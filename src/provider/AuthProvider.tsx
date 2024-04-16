import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeddyCloudApi } from '../api';
import { defaultAPIConfig } from '../config/defaultApiConfig';

// Define types for user and authentication tokens
interface User {
  id: string;
  username: string;
  // Add any other user properties here
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the Auth Context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {}
});

// Custom hook to access the Auth Context
export const useAuth = () => useContext(AuthContext);

const api = new TeddyCloudApi(defaultAPIConfig());

interface AuthProviderProps {
    children: React.ReactNode; // Define the children prop
}

// Auth Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already authenticated (e.g., token exists)
    const token = localStorage.getItem('token');
    if (token) {
      // Decode token and set user
        const decodedToken = decodeToken(token);
        setUser(decodedToken);
    }
  }, []);

  const login = async (username: string, password: string) => {
      // Send login request to server and get JWT token
      const token = await authenticate(username, password);
      // Decode token and set user
      const decodedToken = decodeToken(token);
      setUser(decodedToken);
      // Store token in local storage
      localStorage.setItem('token', token);
  };

  const logout = () => {
      // Clear user state and remove token from local storage
      setUser(null);
      localStorage.removeItem('token');
  };

  return (
      <AuthContext.Provider
          value={{
          user,
              isAuthenticated: !!user,
              login,
              logout
      }}
          >
          {children}
      </AuthContext.Provider>
      );
};

// Helper function to decode JWT token
const decodeToken = (token: string): User => {
    // Decode token (example assumes token payload contains user ID and username)
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const user: User = {
        id: decodedToken.sub,
        username: decodedToken.username
    };
    return user;
};

// Dummy function to simulate authentication (replace with actual authentication logic)
const authenticate = async (username: string, password: string): Promise<string> => {
    
    const loginData = {
        username: username,
        passwordHash: password
    }
    console.log("TODO! CALL REALL API")
    //return api.apiLoginPost(loginData);
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.p5Csu2THYW5zJys2CWdbGM8GaWjpY6lOQpdLoP4D7V4"
};
