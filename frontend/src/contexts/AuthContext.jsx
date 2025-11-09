import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE_URL = 'http://localhost:8000/api'; // Assuming your Laravel backend is running on port 8000

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Initially no user

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
      const { user, token } = response.data;
      localStorage.setItem('token', token); // Store the token
      setUser(user);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (name, email, password, password_confirmation) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, { name, email, password, password_confirmation });
      const { user, token } = response.data;
      localStorage.setItem('token', token); // Store the token
      setUser(user);
      return user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token'); // Clear the token
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};