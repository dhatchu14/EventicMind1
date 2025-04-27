// src/contexts/AuthContext.jsx (create this file)
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance'; // Your axios instance
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('accessToken')); // Initialize from localStorage
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken')); // Initial check
    const [isLoading, setIsLoading] = useState(true); // Loading state for initial check

    // Function to validate token and fetch user data (optional but recommended)
    const verifyTokenAndFetchUser = useCallback(async (currentToken) => {
        if (!currentToken) {
            setIsLoggedIn(false);
            setUser(null);
            setToken(null); // Ensure token state is null if invalid/missing
            localStorage.removeItem('accessToken'); // Clean up storage
            return false;
        }
        try {
            // Assuming you have a '/users/me' or similar endpoint
            const response = await axiosInstance.get('/users/me', {
                headers: { Authorization: `Bearer ${currentToken}` } // Ensure this request uses the token
            });
            setUser(response.data);
            setIsLoggedIn(true);
            setToken(currentToken); // Ensure token state is set
            return true;
        } catch (error) {
            console.error("AuthContext: Token validation failed", error);
            localStorage.removeItem('accessToken'); // Token is invalid, remove it
            setToken(null);
            setUser(null);
            setIsLoggedIn(false);
            // Avoid showing toast on initial load errors unless desired
            // toast.error("Session invalid. Please log in again.");
            return false;
        }
    }, []);

    // Check authentication status on initial load
    useEffect(() => {
        const checkInitialAuth = async () => {
            setIsLoading(true);
            const initialToken = localStorage.getItem('accessToken');
            await verifyTokenAndFetchUser(initialToken);
            setIsLoading(false);
        };
        checkInitialAuth();
    }, [verifyTokenAndFetchUser]);


    // Login function
    const login = useCallback(async (newToken, userData = null) => {
        localStorage.setItem('accessToken', newToken);
        setToken(newToken);
        setIsLoggedIn(true);
        // If login endpoint returns user data, set it, otherwise fetch it
        if (userData) {
            setUser(userData);
        } else {
            setIsLoading(true); // Show loading while fetching user after login
            await verifyTokenAndFetchUser(newToken);
            setIsLoading(false);
        }
        console.log("AuthContext: User logged in");
    }, [verifyTokenAndFetchUser]);

    // Logout function
    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        setToken(null);
        setUser(null);
        setIsLoggedIn(false);
        // Clear potential user-specific data in other contexts if needed
        // Example: cartContext.clearLocalCartState();
        console.log("AuthContext: User logged out");
        toast.success("Logged out successfully.");
    }, []);

    const authContextValue = React.useMemo(() => ({
        token,
        user,
        isLoggedIn,
        isLoading,
        login,
        logout,
        verifyTokenAndFetchUser // Expose if needed elsewhere
    }), [token, user, isLoggedIn, isLoading, login, logout, verifyTokenAndFetchUser]);


    return (
        <AuthContext.Provider value={authContextValue}>
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