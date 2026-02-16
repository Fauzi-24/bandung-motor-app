import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Wrench, Receipt, Users, LogOut, Menu, X, ClipboardList } from 'lucide-react';
import clsx from 'clsx';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
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
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Inventaris', path: '/inventory', icon: Package },
        { name: 'Harga & Jasa', path: '/services', icon: Wrench },
        { name: 'Transaksi', path: '/transactions', icon: Receipt },
        { name: 'Laporan', path: '/reports', icon: ClipboardList },
        { name: 'Karyawan & Gaji', path: '/employees', icon: Users },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-30 w-[280px] bg-[#0f172a] text-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col border-r border-slate-800",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/0 to-slate-900/0 pointer-events-none"></div>
                <div className="p-6 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-white/10">
                            <Wrench size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">Bandung<br /><span className="text-blue-400">Motor</span></h1>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Realtime Clock */}
                {/* Realtime Clock */}
                <div className="mx-4 mt-2 mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500"></div>
                    <p className="text-xs text-slate-400 font-medium relative z-10 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-3xl font-bold text-white mt-1 relative z-10 tracking-wider font-mono">
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}
                        <span className="text-sm font-sans text-slate-500 ml-1 font-normal opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-0">:{currentTime.getSeconds().toString().padStart(2, '0')}</span>
                    </p>
                </div>

                <nav className="px-4 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "bg-blue-600/10 text-blue-400 font-semibold shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                                )}
                            >
                                <Icon size={20} className={clsx("transition-transform duration-300", isActive ? "text-blue-400 scale-110" : "group-hover:scale-110")} />
                                <span className="relative z-10">{item.name}</span>
                                {isActive && (
                                    <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-6 left-6 right-6">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 w-full px-4 py-3 text-red-400 bg-red-400/10 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-200 font-medium group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="bg-white shadow-sm lg:hidden p-4 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-gray-800">
                        {navItems.find(i => i.path === location.pathname)?.name || 'Bandung Motor'}
                    </h1>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
