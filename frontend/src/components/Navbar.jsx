import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback for consistency
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, UserCircle, Package, LayoutDashboard, Loader2, ShieldCheck, ShoppingCart } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Button is used implicitly via DropdownMenuTrigger asChild
import { useCart } from '@/components/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = ({ darkMode, setDarkMode }) => {
    const { isLoggedIn: isRegularUserLoggedIn, user: regularUser, logout: contextLogout, isLoading: isContextLoading } = useAuth();
    const [localAdminUser, setLocalAdminUser] = useState(null);
    const [isCheckingLocalAdmin, setIsCheckingLocalAdmin] = useState(true);
    const { itemCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const checkLocalAdmin = useCallback(() => { // Wrapped in useCallback
        // console.log("Navbar: Checking local storage for 'currentUser' admin...");
        setIsCheckingLocalAdmin(true);
        const adminUserString = localStorage.getItem('currentUser');
        if (adminUserString) {
            try {
                const adminData = JSON.parse(adminUserString);
                if (adminData && adminData.role === 'admin') {
                    // console.log("Navbar: Found local admin user:", adminData);
                    setLocalAdminUser(adminData);
                } else {
                    // console.log("Navbar: Found 'currentUser' but not admin, clearing.");
                    setLocalAdminUser(null);
                }
            } catch (error) {
                console.error("Navbar: Failed to parse 'currentUser' from localStorage:", error);
                setLocalAdminUser(null);
                localStorage.removeItem('currentUser');
            }
        } else {
            // console.log("Navbar: No local 'currentUser' found.");
            setLocalAdminUser(null);
        }
        setIsCheckingLocalAdmin(false);
    }, []); // Empty dependency array - checkLocalAdmin itself doesn't depend on props/state

    useEffect(() => {
        checkLocalAdmin();

        const handleLoginEvent = () => checkLocalAdmin();
        window.addEventListener('userLogin', handleLoginEvent);

        const handleStorageChange = (event) => {
            if (event.key === 'currentUser' || event.key === 'accessToken') {
                checkLocalAdmin();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        const handleLocalLogout = () => setLocalAdminUser(null);
        window.addEventListener('userLogout', handleLocalLogout);

        return () => {
            window.removeEventListener('userLogin', handleLoginEvent);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userLogout', handleLocalLogout);
        };
    }, [checkLocalAdmin]); // Include checkLocalAdmin as dependency

    const handleLogout = useCallback(() => { // Wrapped in useCallback
        contextLogout();
        localStorage.removeItem('currentUser');
        setLocalAdminUser(null);
        window.dispatchEvent(new Event('userLogout'));
        if (location.pathname.startsWith('/admin')) {
            navigate('/admin/login');
        } else {
            navigate('/');
        }
    }, [contextLogout, navigate, location.pathname]); // Dependencies for logout

    // Navigation functions (stable references not strictly needed but good practice)
    const navigateToLogin = useCallback(() => navigate('/login'), [navigate]);
    const navigateToSignup = useCallback(() => navigate('/signup'), [navigate]);
    const navigateToOrders = useCallback(() => navigate('/orders'), [navigate]); // <-- This navigates correctly
    const navigateToDashboard = useCallback(() => navigate('/admin/dashboard'), [navigate]);
    const navigateToAdminLogin = useCallback(() => navigate('/admin/login'), [navigate]); // Added for clarity

    const isActive = useCallback((path) => (
        location.pathname === path
            ? 'text-indigo-600 dark:text-indigo-400 font-medium'
            : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'
    ), [location.pathname]); // Depends on location

    const isLoading = isContextLoading || isCheckingLocalAdmin;

    const getInitials = (name) => { /* ... getInitials logic ... */
         if (!name) return "?";
         const names = name.split(' ');
         if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
         return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    };

    const renderAccountMenu = () => {
        if (isLoading) {
            return <div className="w-[34px] h-[34px] flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gray-500 dark:text-gray-400" /></div>;
        }

        // --- PRIORITIZE LocalStorage Admin Check ---
        if (localAdminUser && localAdminUser.role === 'admin') {
            // ADMIN VIEW (from localStorage)
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-full ... transition-colors" aria-label="Admin account menu">
                            <UserCircle size={22} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal"> {/* ... Admin Label Details ... */}
                             <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none flex items-center">{localAdminUser.name || 'Admin'} <Badge variant="destructive" className="ml-2 ...">Admin</Badge></p>
                                <p className="text-xs leading-none text-muted-foreground">{localAdminUser.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={navigateToDashboard} className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" /><span>Admin Dashboard</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 ...">
                            <LogOut className="mr-2 h-4 w-4" /><span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
        // --- Fallback to AuthContext for REGULAR users ---
        else if (isRegularUserLoggedIn && regularUser) {
            // REGULAR LOGGED IN VIEW (from context)
             const isContextUserAdmin = regularUser?.role === 'admin';
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-full ... transition-colors" aria-label="Account menu">
                            <UserCircle size={22} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                         <DropdownMenuLabel className="font-normal"> {/* ... User Label Details ... */}
                             <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none flex items-center">{regularUser.name || regularUser.email || 'User'} {isContextUserAdmin && <Badge variant="destructive" className="ml-2 ...">Admin</Badge>}</p>
                                <p className="text-xs leading-none text-muted-foreground">{regularUser.email}</p>
                             </div>
                         </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isContextUserAdmin ? (
                             <DropdownMenuItem onClick={navigateToDashboard} className="cursor-pointer">
                                <LayoutDashboard className="mr-2 h-4 w-4" /><span>Admin Dashboard</span>
                            </DropdownMenuItem>
                        ) : (
                             // --- This item correctly navigates to /orders ---
                             <DropdownMenuItem onClick={navigateToOrders} className="cursor-pointer">
                                <Package className="mr-2 h-4 w-4" /><span>My Orders</span>
                             </DropdownMenuItem>
                             // -------------------------------------------------
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 ...">
                            <LogOut className="mr-2 h-4 w-4" /><span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
        // --- LOGGED OUT VIEW (Default) ---
        else {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-full ... transition-colors" aria-label="Account menu">
                             <UserCircle size={22} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={navigateToLogin} className="cursor-pointer"> Login </DropdownMenuItem>
                        <DropdownMenuItem onClick={navigateToSignup} className="cursor-pointer"> Sign Up </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={navigateToAdminLogin} className="cursor-pointer">
                            <ShieldCheck className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" /><span>Admin Login</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <nav className="bg-white dark:bg-gray-900 shadow-md w-full border-b border-gray-200 dark:border-gray-700/50">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        {/* Left Side: Logo */}
                        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white flex-shrink-0">
                            EventicMind
                        </Link>
                        {/* Right Side */}
                        <div className="flex items-center space-x-6">
                            {/* Main Navigation Links */}
                            <div className="hidden md:flex items-center space-x-5">
                                <Link to="/" className={isActive('/')}> Home </Link>
                                <Link to="/shop" className={isActive('/shop')}> Shop </Link>
                                <Link to="/blogs" className={isActive('/blogs')}> Blogs </Link>
                                <Link to="/about" className={isActive('/about')}> About </Link>
                            </div>
                            {/* Action Icons */}
                            <div className="flex items-center space-x-3 md:space-x-4">
                                {/* Shopping Cart Icon */}
                                <Link to="/cart" className="relative p-2 rounded-full ... transition-colors" aria-label={`View shopping cart, ${itemCount} items`}>
                                    <ShoppingCart size={20} />
                                    {isRegularUserLoggedIn && itemCount > 0 && (
                                        <span className="absolute top-0 right-0 ..."> {itemCount} </span>
                                    )}
                                </Link>
                                {/* Dark Mode Toggle */}
                                <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full ... transition-colors" aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
                                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                                </button>
                                {/* Loading Indicator or User Dropdown */}
                                {renderAccountMenu()}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;