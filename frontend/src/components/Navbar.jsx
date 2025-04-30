import React, { useState, useEffect, useCallback } from 'react';
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
// Removed Button import as it's implicitly used via asChild
import { useCart } from '@/components/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = ({ darkMode, setDarkMode }) => {
    const { isLoggedIn: isRegularUserLoggedIn, user: regularUser, logout: contextLogout, isLoading: isContextLoading } = useAuth();
    const [localAdminUser, setLocalAdminUser] = useState(null);
    const [isCheckingLocalAdmin, setIsCheckingLocalAdmin] = useState(true);
    const { itemCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const checkLocalAdmin = useCallback(() => {
        setIsCheckingLocalAdmin(true);
        const adminUserString = localStorage.getItem('currentUser');
        if (adminUserString) {
            try {
                const adminData = JSON.parse(adminUserString);
                if (adminData && adminData.role === 'admin') {
                    setLocalAdminUser(adminData);
                } else {
                    setLocalAdminUser(null);
                }
            } catch (error) {
                console.error("Navbar: Failed to parse 'currentUser' from localStorage:", error);
                setLocalAdminUser(null);
                localStorage.removeItem('currentUser');
            }
        } else {
            setLocalAdminUser(null);
        }
        setIsCheckingLocalAdmin(false);
    }, []);

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
    }, [checkLocalAdmin]);

    const handleLogout = useCallback(() => {
        contextLogout();
        localStorage.removeItem('currentUser');
        setLocalAdminUser(null);
        window.dispatchEvent(new Event('userLogout'));
        if (location.pathname.startsWith('/admin')) {
            navigate('/admin/login');
        } else {
            navigate('/');
        }
    }, [contextLogout, navigate, location.pathname]);

    const navigateToLogin = useCallback(() => navigate('/login'), [navigate]);
    const navigateToSignup = useCallback(() => navigate('/signup'), [navigate]);
    const navigateToOrders = useCallback(() => navigate('/orders'), [navigate]);
    const navigateToDashboard = useCallback(() => navigate('/admin/dashboard'), [navigate]);
    const navigateToAdminLogin = useCallback(() => navigate('/admin/login'), [navigate]);

    const isActive = useCallback((path) => (
        location.pathname === path
            ? 'text-indigo-600 dark:text-indigo-400 font-medium'
            : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'
    ), [location.pathname]);

    const isLoading = isContextLoading || isCheckingLocalAdmin;

    const getInitials = (name) => {
         if (!name) return "?";
         const names = name.split(' ');
         if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
         return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    };

    const renderAccountMenu = () => {
        if (isLoading) {
            return <div className="w-[34px] h-[34px] flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gray-500 dark:text-gray-400" /></div>;
        }

        if (localAdminUser && localAdminUser.role === 'admin') {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {/* Added cursor-pointer */}
                        <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer" aria-label="Admin account menu">
                            <UserCircle size={22} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                             <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none flex items-center">{localAdminUser.name || 'Admin'} <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">Admin</Badge></p>
                                <p className="text-xs leading-none text-muted-foreground">{localAdminUser.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {/* Already has cursor-pointer */}
                        <DropdownMenuItem onClick={navigateToDashboard} className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" /><span>Admin Dashboard</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         {/* Already has cursor-pointer */}
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-700 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/50">
                            <LogOut className="mr-2 h-4 w-4" /><span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
        else if (isRegularUserLoggedIn && regularUser) {
             const isContextUserAdmin = regularUser?.role === 'admin';
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         {/* Added cursor-pointer */}
                        <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer" aria-label="Account menu">
                            <UserCircle size={22} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                         <DropdownMenuLabel className="font-normal">
                             <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none flex items-center">{regularUser.name || regularUser.email || 'User'} {isContextUserAdmin && <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">Admin</Badge>}</p>
                                <p className="text-xs leading-none text-muted-foreground">{regularUser.email}</p>
                             </div>
                         </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isContextUserAdmin ? (
                             // Already has cursor-pointer
                             <DropdownMenuItem onClick={navigateToDashboard} className="cursor-pointer">
                                <LayoutDashboard className="mr-2 h-4 w-4" /><span>Admin Dashboard</span>
                            </DropdownMenuItem>
                        ) : (
                             // Already has cursor-pointer
                             <DropdownMenuItem onClick={navigateToOrders} className="cursor-pointer">
                                <Package className="mr-2 h-4 w-4" /><span>My Orders</span>
                             </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {/* Already has cursor-pointer */}
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-700 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/50">
                            <LogOut className="mr-2 h-4 w-4" /><span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
        else {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         {/* Added cursor-pointer */}
                        <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer" aria-label="Account menu">
                             <UserCircle size={22} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         {/* Already has cursor-pointer */}
                        <DropdownMenuItem onClick={navigateToLogin} className="cursor-pointer"> Login </DropdownMenuItem>
                         {/* Already has cursor-pointer */}
                        <DropdownMenuItem onClick={navigateToSignup} className="cursor-pointer"> Sign Up </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         {/* Already has cursor-pointer */}
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
                        {/* Added cursor-pointer */}
                        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white flex-shrink-0 cursor-pointer">
                            EventicMind
                        </Link>
                        <div className="flex items-center space-x-6">
                            <div className="hidden md:flex items-center space-x-5">
                                {/* Added cursor-pointer */}
                                <Link to="/" className={`${isActive('/')} cursor-pointer`}> Home </Link>
                                {/* Added cursor-pointer */}
                                <Link to="/shop" className={`${isActive('/shop')} cursor-pointer`}> Shop </Link>
                                {/* Added cursor-pointer */}
                                <Link to="/blogs" className={`${isActive('/blogs')} cursor-pointer`}> Blogs </Link>
                                {/* Added cursor-pointer */}
                                <Link to="/about" className={`${isActive('/about')} cursor-pointer`}> About </Link>
                            </div>
                            <div className="flex items-center space-x-3 md:space-x-4">
                                {/* Added cursor-pointer and hover effect */}
                                <Link
                                    to="/cart"
                                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    aria-label={`View shopping cart, ${itemCount} items`}
                                >
                                    <ShoppingCart size={20} />
                                    {isRegularUserLoggedIn && itemCount > 0 && (
                                        <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold transform translate-x-1/3 -translate-y-1/3">
                                            {itemCount > 9 ? '9+' : itemCount}
                                        </span>
                                    )}
                                </Link>
                                {/* Added cursor-pointer and hover effect */}
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                                >
                                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                                </button>
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