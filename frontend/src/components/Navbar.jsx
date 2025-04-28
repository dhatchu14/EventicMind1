import React, { useState, useEffect } from 'react'; // Need useEffect/useState again for local check
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
import { Button } from "@/components/ui/button";
import { useCart } from '@/components/CartContext';
import { useAuth } from '@/contexts/AuthContext'; // Still use AuthContext for regular users & loading

const Navbar = ({ darkMode, setDarkMode }) => {
    // --- Get state and functions FROM AuthContext ---
    // We primarily use context for regular users and the initial loading state
    const { isLoggedIn: isRegularUserLoggedIn, user: regularUser, logout: contextLogout, isLoading: isContextLoading } = useAuth();

    // --- Add state for locally checked admin ---
    const [localAdminUser, setLocalAdminUser] = useState(null);
    const [isCheckingLocalAdmin, setIsCheckingLocalAdmin] = useState(true); // Separate loading for local check
    // -------------------------------------------

    // Get cart count
    const { itemCount } = useCart();

    // Keep navigation hooks
    const navigate = useNavigate();
    const location = useLocation();

    // --- Function to check ONLY the hardcoded admin in localStorage ---
    const checkLocalAdmin = () => {
        // console.log("Navbar: Checking local storage for 'currentUser' admin...");
        setIsCheckingLocalAdmin(true);
        const adminUserString = localStorage.getItem('currentUser');
        if (adminUserString) {
            try {
                const adminData = JSON.parse(adminUserString);
                // Check if it looks like the hardcoded admin structure
                if (adminData && adminData.role === 'admin') { // Check for role:'admin' specifically
                    // console.log("Navbar: Found local admin user:", adminData);
                    setLocalAdminUser(adminData);
                } else {
                    // console.log("Navbar: Found 'currentUser' but not admin, clearing.");
                    setLocalAdminUser(null);
                    // Optional: Clear invalid item if found
                    // localStorage.removeItem('currentUser');
                }
            } catch (error) {
                console.error("Navbar: Failed to parse 'currentUser' from localStorage:", error);
                setLocalAdminUser(null);
                localStorage.removeItem('currentUser'); // Clear potentially corrupt item
            }
        } else {
            // console.log("Navbar: No local 'currentUser' found.");
            setLocalAdminUser(null);
        }
        setIsCheckingLocalAdmin(false);
    };

    // --- useEffect to check local admin on mount and on storage/custom events ---
    useEffect(() => {
        checkLocalAdmin(); // Initial check

        // Listen for the custom event dispatched by AdminLogin.jsx
        window.addEventListener('userLogin', checkLocalAdmin);
        // Listen for storage changes (e.g., logout in another tab)
        const handleStorageChange = (event) => {
            if (event.key === 'currentUser' || event.key === 'accessToken') {
                checkLocalAdmin(); // Re-check local admin if either key changes
            }
        };
        window.addEventListener('storage', handleStorageChange);

        // Also listen for the custom logout event to clear local admin state
        const handleLocalLogout = () => setLocalAdminUser(null);
        window.addEventListener('userLogout', handleLocalLogout);


        return () => {
            window.removeEventListener('userLogin', checkLocalAdmin);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userLogout', handleLocalLogout);
        };
    }, []); // Run only on mount

    // --- Combined Logout Handler ---
    const handleLogout = () => {
        // Call context logout (handles token, context state)
        contextLogout();
        // Explicitly remove the hardcoded admin item
        localStorage.removeItem('currentUser');
        // Manually update local admin state
        setLocalAdminUser(null);
        // Dispatch event just in case (though state update should suffice)
        window.dispatchEvent(new Event('userLogout'));

        // Navigation logic
        if (location.pathname.startsWith('/admin')) {
            navigate('/admin/login');
        } else {
            navigate('/');
        }
    };
    // -------------------------------

    // Navigation functions
    const navigateToLogin = () => navigate('/login');
    const navigateToSignup = () => navigate('/signup');
    const navigateToOrders = () => navigate('/orders');
    const navigateToDashboard = () => navigate('/admin/dashboard');

    // isActive function (keep as is)
    const isActive = (path) => location.pathname === path
        ? 'text-indigo-600 dark:text-indigo-400 font-medium'
        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors';

    // --- Combined Loading State ---
    const isLoading = isContextLoading || isCheckingLocalAdmin;
    // -----------------------------

    // --- Get Initials Helper ---
    const getInitials = (name) => {
         if (!name) return "?";
         const names = name.split(' ');
         if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
         return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    };
    // ---

    // --- Updated Account Menu Logic ---
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
                        <button className="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors" aria-label="Admin account menu">
                            <UserCircle size={22} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                         <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none flex items-center">
                                    {localAdminUser.name || 'Admin'}
                                    <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs leading-none">Admin</Badge>
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {localAdminUser.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={navigateToDashboard} className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                        </DropdownMenuItem>
                        {/* No Orders link for this specific admin */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleLogout()} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/50 dark:text-red-500 dark:focus:text-red-400">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
        // --- End LocalStorage Admin Check ---

        // --- Fallback to AuthContext for REGULAR users ---
        else if (isRegularUserLoggedIn && regularUser) {
            // REGULAR LOGGED IN VIEW (from context)
             const isContextUserAdmin = regularUser?.role === 'admin'; // Still check if context user could be admin
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <button className="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors" aria-label="Account menu">
                            <UserCircle size={22} /> {/* Or use Avatar as before */}
                         </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                         <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none flex items-center">
                                    {regularUser.name || regularUser.email || 'User'}
                                     {isContextUserAdmin && <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs leading-none">Admin</Badge>}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {regularUser.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {isContextUserAdmin ? (
                             <DropdownMenuItem onClick={navigateToDashboard} className="cursor-pointer">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Admin Dashboard</span>
                            </DropdownMenuItem>
                        ) : (
                             <DropdownMenuItem onClick={navigateToOrders} className="cursor-pointer">
                                <Package className="mr-2 h-4 w-4" />
                                <span>My Orders</span>
                             </DropdownMenuItem>
                        )}
                        {/* Add Profile Link maybe? */}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleLogout()} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/50 dark:text-red-500 dark:focus:text-red-400">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
        // --- End AuthContext Check ---

        // --- LOGGED OUT VIEW (Default) ---
        else {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <button className="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors" aria-label="Account menu">
                             <UserCircle size={22} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={navigateToLogin} className="cursor-pointer"> Login </DropdownMenuItem>
                        <DropdownMenuItem onClick={navigateToSignup} className="cursor-pointer"> Sign Up </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin/login')} className="cursor-pointer">
                            <ShieldCheck className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span>Admin Login</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
    };
    // --- End Updated Account Menu Logic ---


    // --- Main Navbar Render ---
    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <nav className="bg-white dark:bg-gray-900 shadow-md w-full border-b border-gray-200 dark:border-gray-700/50">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">

                        {/* Left Side: Logo */}
                        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white flex-shrink-0">
                            EventicMind
                        </Link>

                        {/* Right Side: Combined Nav Links & Actions */}
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
                                <Link
                                    to="/cart"
                                    className="relative p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors"
                                    aria-label={`View shopping cart, ${itemCount} items`}
                                >
                                    <ShoppingCart size={20} />
                                    {/* Use context isLoggedIn state for badge visibility */}
                                    {isRegularUserLoggedIn && itemCount > 0 && (
                                        <span
                                            className="absolute top-0 right-0 block h-4 w-4 transform translate-x-1/3 -translate-y-1/3 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold flex items-center justify-center ring-1 ring-white dark:ring-gray-900"
                                            aria-hidden="true"
                                        >
                                            {itemCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Dark Mode Toggle */}
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors"
                                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                                >
                                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                                </button>

                                {/* Loading Indicator or User Dropdown */}
                                {renderAccountMenu()}

                            </div> {/* End Action Icons */}
                        </div> {/* End Right Side */}
                    </div> {/* End Flex Container */}
                </div> {/* End Container */}
            </nav>
        </header>
    );
};

export default Navbar;