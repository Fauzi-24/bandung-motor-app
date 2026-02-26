import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Wrench, Receipt, History, Users, LogOut, Menu, X, ClipboardList, Kanban } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, userRole } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to logout", error);
        }
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Owner', 'Kasir', 'Mekanik', 'Admin'] },
        { name: 'Antrean Servis', path: '/queue', icon: Kanban, roles: ['Owner', 'Kasir', 'Mekanik', 'Admin'] },
        { name: 'Riwayat', path: '/customers', icon: History, roles: ['Owner', 'Kasir', 'Admin'] },
        { name: 'Inventaris', path: '/inventory', icon: Package, roles: ['Owner', 'Kasir', 'Admin'] },
        { name: 'Harga & Jasa', path: '/services', icon: Wrench, roles: ['Owner', 'Kasir', 'Mekanik', 'Admin'] },
        { name: 'Transaksi', path: '/transactions', icon: Receipt, roles: ['Owner', 'Kasir', 'Admin'] },
        { name: 'Pesanan Online', path: '/online-orders', icon: Package, roles: ['Owner', 'Kasir', 'Admin'] },
        { name: 'Laporan', path: '/reports', icon: ClipboardList, roles: ['Owner', 'Admin'] },
        { name: 'Karyawan & Gaji', path: '/employees', icon: Users, roles: ['Owner', 'Admin'] },
    ];

    const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

    return (
        <div className="flex h-screen overflow-hidden text-slate-200">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Window (Hyprland Gaps) */}
            <aside className={clsx(
                "fixed inset-y-4 left-4 z-50 w-[280px] flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:mr-4",
                isSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"
            )}>
                {/* Hyprland Animated Border */}
                <div className="animated-border rounded-2xl absolute inset-0 pointer-events-none"></div>

                {/* Sidebar Glass Content */}
                <div className="animated-border-content h-full w-full flex flex-col rounded-2xl overflow-hidden glass-dark border border-white/5">

                    {/* Header */}
                    <div className="p-6 flex justify-between items-center relative z-10 border-b border-white/5 bg-black/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-[#00f0ff]/50">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                                    <Wrench size={24} className="text-[#00f0ff]" />
                                </motion.div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                                    Bandung<br /><span className="text-[#00f0ff]">Motor</span>
                                </h1>
                            </div>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-[#ff007f] transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Clock Module (Neon Accents) */}
                    <div className="mx-4 mt-6 mb-4 p-4 rounded-xl glass-panel relative overflow-hidden group shadow-md hover:shadow-lg transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#b026ff]/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-xs text-slate-400 font-medium relative z-10 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-pulse"></span>
                            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-3xl font-bold text-white mt-1 relative z-10 tracking-wider font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}
                            <span className="text-sm font-sans text-[#b026ff] ml-1 font-normal animate-pulse">
                                :{currentTime.getSeconds().toString().padStart(2, '0')}
                            </span>
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav className="px-3 space-y-2 flex-1 overflow-y-auto custom-scrollbar pt-2 pb-4">
                        {filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            // Also map root / to dashboard for active state highlighting
                            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden",
                                        isActive
                                            ? "bg-white/10 text-white font-semibold shadow-inner ring-1 ring-[#b026ff]/50"
                                            : "text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                                    )}
                                >
                                    <Icon size={20} className={clsx("transition-transform duration-300", isActive ? "text-[#b026ff] drop-shadow-[0_0_5px_#b026ff] scale-110" : "group-hover:scale-110 group-hover:text-[#00f0ff]")} />
                                    <span className="relative z-10 tracking-wide">{item.name}</span>
                                    {isActive && (
                                        <motion.div layoutId="sidebar-active" className="absolute inset-y-0 left-0 w-1 bg-[#b026ff] rounded-r-full shadow-[0_0_10px_#b026ff]" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Auth */}
                    <div className="p-4 bg-black/20 border-t border-white/5">
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-3 w-full px-4 py-3 text-[#ff007f] bg-[#ff007f]/5 hover:bg-[#ff007f]/20 hover:text-white hover:shadow-[0_0_15px_rgba(255,0,127,0.3)] rounded-lg transition-all duration-300 font-medium group ring-1 ring-[#ff007f]/20"
                        >
                            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="tracking-wide">Keluar</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Window (Hyprland Gaps) */}
            <main className="flex-1 flex flex-col h-[calc(100vh-2rem)] my-4 mr-4 relative hidden lg:flex">
                <div className="animated-border rounded-2xl absolute inset-0 pointer-events-none"></div>

                <div className="animated-border-content h-full w-full flex flex-col rounded-2xl overflow-hidden glass-dark border border-white/5">
                    {/* Page Content with Framer Motion Route Transitions */}
                    <div className="flex-1 overflow-auto p-8 relative custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="h-full"
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Mobile Main Content View (No gaps on mobile for better space) */}
            <main className="flex-1 flex flex-col h-screen lg:hidden">
                <header className="glass-dark border-b border-white/10 shadow-lg p-4 flex items-center justify-between z-10 relative">
                    <h1 className="text-lg font-semibold text-white tracking-wide">
                        {filteredNavItems.find(i => i.path === location.pathname || (i.path === '/dashboard' && location.pathname === '/'))?.name || 'Bandung Motor'}
                    </h1>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-[#00f0ff] hover:text-white transition-colors">
                        <Menu size={24} />
                    </button>
                </header>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar relative z-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Layout;
