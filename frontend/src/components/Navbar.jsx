import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, User, LogOut, UserCircle, Package, LayoutDashboard, Loader2, ShieldCheck } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

const Navbar = ({ darkMode, setDarkMode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // --- checkAuthStatus, useEffect, handleLogout remain the same ---
    const checkAuthStatus = useCallback(async () => {
        setIsLoading(true); // Set loading true at the start of the check
        let foundUser = false;
        let isAdminUser = false;
        let userDetails = null;
        let sessionExpired = false;

        // 1. Check for regular user token
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const response = await fetch("http://localhost:8000/users/me", {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const userData = await response.json();
                    // --- !!! ADAPT THIS LINE TO YOUR BACKEND RESPONSE !!! ---
                    isAdminUser = userData.role === 'admin';
                    // --- End Adaptation ---
                    userDetails = {
                        name: userData.full_name || userData.email,
                        email: userData.email,
                        role: userData.role || 'user'
                    };
                    foundUser = true;
                } else if (response.status === 401 || response.status === 403) {
                    console.warn("Regular user token invalid/expired:", response.status);
                    localStorage.removeItem('accessToken');
                    sessionExpired = true;
                } else {
                     console.error("Failed to fetch regular user details:", response.status);
                }
            } catch (error) {
                console.error("Network error fetching regular user details:", error);
            }
        }

        // 2. Check for admin user if no regular user found
        if (!foundUser) {
            const adminUserString = localStorage.getItem('currentUser');
            if (adminUserString) {
                try {
                    const adminData = JSON.parse(adminUserString);
                    if (adminData && adminData.role === 'admin' && adminData.email === 'admin@steer.com') {
                        isAdminUser = true;
                        userDetails = {
                            name: adminData.name || 'Admin',
                            email: adminData.email,
                            role: 'admin'
                        };
                        foundUser = true;
                    } else {
                         console.warn("Found 'currentUser' in localStorage, but it's not a valid admin structure.");
                         localStorage.removeItem('currentUser');
                    }
                } catch (error) {
                    console.error("Failed to parse admin user from localStorage:", error);
                    localStorage.removeItem('currentUser');
                }
            }
        }

        // 3. Update state
        setIsLoggedIn(foundUser);
        setIsAdmin(isAdminUser);
        setCurrentUser(foundUser ? userDetails : null);
        setIsLoading(false);

        // 4. Notify user if session expired
        if (sessionExpired) {
             toast.info("Your session has expired. Please log in again.");
        }

    }, []);

    useEffect(() => {
        checkAuthStatus();
        const handleAuthChange = () => checkAuthStatus();
        window.addEventListener('userLogin', handleAuthChange);
        window.addEventListener('userLogout', handleAuthChange);
        const handleStorageChange = (event) => {
            if (event.key === 'accessToken' || event.key === 'currentUser') {
                checkAuthStatus();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('userLogin', handleAuthChange);
            window.removeEventListener('userLogout', handleAuthChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [checkAuthStatus]);

    const handleLogout = (showToast = true) => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        setIsLoggedIn(false);
        setCurrentUser(null);
        setIsAdmin(false);
        setIsLoading(false);
        window.dispatchEvent(new Event('userLogout'));
        if (showToast) {
            toast.success('Logged out successfully!');
        }
        if (location.pathname.startsWith('/admin')) {
             navigate('/admin/login');
        } else if (location.pathname === '/login' || location.pathname === '/signup') {
             navigate('/');
        }
    };
    // --- End of unchanged functions ---

    // Navigation functions
    const navigateToLogin = () => navigate('/login');
    const navigateToSignup = () => navigate('/signup');
    const navigateToOrders = () => navigate('/orders');
    const navigateToDashboard = () => navigate('/admin/dashboard');

    // isActive function for NavLink styling
    const isActive = (path) => location.pathname === path
        ? 'text-indigo-600 dark:text-indigo-400 font-medium'
        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors';


    // Render Logic
    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <nav className="bg-white dark:bg-gray-900 shadow-md w-full border-b border-gray-200 dark:border-gray-700/50">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">

                        {/* Left Side: Logo */}
                        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white flex-shrink-0">
                            EventicMind
                        </Link>

                        {/* REMOVED the center div */}

                        {/* Right Side: Combined Nav Links & Actions */}
                        {/* Increased spacing between nav block and actions with space-x-6 */}
                        <div className="flex items-center space-x-6">

                            {/* Main Navigation Links (Now on the right) */}
                            {/* Added space-x-5 for spacing between these links */}
                            <div className="hidden md:flex items-center space-x-5">
                                <Link to="/" className={isActive('/')}> Home </Link>
                                <Link to="/shop" className={isActive('/shop')}> Shop </Link>
                                <Link to="/blogs" className={isActive('/blogs')}> Blogs </Link>
                                <Link to="/about" className={isActive('/about')}> About </Link>
                                
                            </div>

                            {/* Action Icons (Theme Toggle, Auth Dropdown) */}
                            {/* Added space-x-3/4 within this smaller group */}
                            <div className="flex items-center space-x-3 md:space-x-4">
                                {/* Dark Mode Toggle */}
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors"
                                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                                >
                                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                                </button>

                                {/* Loading Indicator or User Dropdown */}
                                {isLoading ? (
                                    <div className="w-[34px] h-[34px] flex items-center justify-center">
                                        <Loader2 size={20} className="animate-spin text-gray-500 dark:text-gray-400" />
                                    </div>
                                ) : (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors" aria-label="Account menu">
                                                {isLoggedIn ? <UserCircle size={22} /> : <User size={22} />}
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            {isLoggedIn && currentUser ? (
                                                // --- Logged In Menu ---
                                                <>
                                                    <DropdownMenuLabel className="font-normal">
                                                        <div className="flex flex-col space-y-1">
                                                            <p className="text-sm font-medium leading-none flex items-center">
                                                                {currentUser.name || 'User'}
                                                                {isAdmin && <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs leading-none">Admin</Badge>}
                                                            </p>
                                                            <p className="text-xs leading-none text-muted-foreground">
                                                                {currentUser.email}
                                                            </p>
                                                        </div>
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator />

                                                    {isAdmin && (
                                                        <DropdownMenuItem onClick={navigateToDashboard} className="cursor-pointer">
                                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                                            <span>Admin Dashboard</span>
                                                        </DropdownMenuItem>
                                                    )}

                                                    {!isAdmin && (
                                                       <>
                                                          
                                                          <DropdownMenuItem onClick={navigateToOrders} className="cursor-pointer">
                                                              <Package className="mr-2 h-4 w-4" />
                                                              <span>My Orders</span>
                                                          </DropdownMenuItem>
                                                       </>
                                                    )}

                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleLogout(true)} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/50 dark:text-red-500 dark:focus:text-red-400">
                                                        <LogOut className="mr-2 h-4 w-4" />
                                                        <span>Logout</span>
                                                    </DropdownMenuItem>
                                                </>
                                            ) : (
                                                // --- Logged Out Menu ---
                                                <>
                                                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={navigateToLogin} className="cursor-pointer"> Login </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={navigateToSignup} className="cursor-pointer"> Sign Up </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => navigate('/admin/login')} className="cursor-pointer">
                                                        <ShieldCheck className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        <span>Admin Login</span>
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                {/* Mobile Menu Button Placeholder */}
                            </div>

                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;