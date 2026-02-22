import { useState, useEffect } from 'react';
import { getTransactions, getEmployeePerformance } from '../services/transactionService';
import { getProducts } from '../services/inventoryService';
import { DollarSign, Users, AlertTriangle, TrendingUp, Activity, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { userRole, employeeId } = useAuth();
    const [mechanicStats, setMechanicStats] = useState(null);
    const [stats, setStats] = useState({
        todayIncome: 0,
        todayProfit: 0,
        todayCustomers: 0,
        monthIncome: 0,
        monthProfit: 0,
        lowStockItems: [],
        weeklyRevenue: []
    });
    const [chartOffsetDays, setChartOffsetDays] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (userRole === 'Mekanik') {
                    if (employeeId) {
                        const date = new Date();
                        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
                        const result = await getEmployeePerformance(employeeId, firstDay, lastDay);
                        setMechanicStats(result);
                    }
                    return; // Prevent fetching generic store stats for Mekanik
                }

                const [transactions, products] = await Promise.all([
                    getTransactions(),
                    getProducts()
                ]);

                // Calculate Today's Stats (start of today)
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // End of today for inclusive ranges
                const endOfToday = new Date();
                endOfToday.setHours(23, 59, 59, 999);

                // Calculate Last 7 Days Revenue (Staring from today - offset)
                const baseDate = new Date();
                baseDate.setDate(baseDate.getDate() - chartOffsetDays);
                baseDate.setHours(23, 59, 59, 999);

                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(baseDate);
                    d.setDate(d.getDate() - (6 - i));
                    return {
                        dateStr: d.toISOString().split('T')[0],
                        displayDate: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
                        income: 0
                    };
                });

                let todayIncome = 0;
                let todayProfit = 0;
                let todayCustomers = 0;

                let monthIncome = 0;
                let monthProfit = 0;

                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();

                transactions.forEach(t => {
                    const tDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);

                    // Add to weekly revenue chart data
                    const dateString = tDate.toISOString().split('T')[0];
                    const chartDay = last7Days.find(day => day.dateStr === dateString);
                    if (chartDay) {
                        chartDay.income += t.totalAmount;
                    }

                    if (tDate >= today && tDate <= endOfToday) {
                        todayIncome += t.totalAmount;
                        todayCustomers += 1;
                    }

                    if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                        monthIncome += t.totalAmount;
                    }

                    // Calculate Profit for this transaction
                    if (t.items && Array.isArray(t.items)) {
                        t.items.forEach(item => {
                            const qty = item.quantity || 1;
                            const totalItemPrice = item.price * qty;
                            let itemProfit = 0;

                            if (item.type === 'product') {
                                const buyPrice = item.buyPrice || 0;
                                itemProfit = (item.price - buyPrice) * qty;
                            } else if (item.type === 'service') {
                                const commission = totalItemPrice * 0.4;
                                itemProfit = totalItemPrice - commission;
                            }

                            if (tDate >= today) {
                                todayProfit += itemProfit;
                            }
                            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                                monthProfit += itemProfit;
                            }
                        });
                    }
                });

                const lowStockItems = products.filter(p => p.stock <= 5);

                setStats({
                    todayIncome,
                    todayProfit,
                    todayCustomers,
                    monthIncome,
                    monthProfit,
                    lowStockItems: lowStockItems,
                    weeklyRevenue: last7Days
                });

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            }
        };

        fetchStats();
    }, [userRole, employeeId, chartOffsetDays]);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
    };

    if (userRole === 'Mekanik') {
        return (
            <div className="space-y-6 text-slate-200">
                <div className="flex justify-between items-end relative z-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Performa Saya</h1>
                        <p className="text-[#bae6fd] mt-1 font-medium">Bulan Ini</p>
                    </motion.div>
                </div>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"
                >
                    <motion.div variants={itemVariants} className="glass-panel p-6 hover-card group relative overflow-hidden border-[#00f0ff]/30">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>

                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Servis Diselesaikan</p>
                                <h3 className="text-5xl font-bold text-white tracking-tight drop-shadow-[0_0_5px_rgba(0,240,255,0.5)] mt-2">
                                    {mechanicStats ? mechanicStats.totalServices : '...'}
                                    <span className="text-base font-medium text-slate-500 ml-2">Unit Kendaraan</span>
                                </h3>
                            </div>
                            <div className="p-3 bg-[#00f0ff]/10 text-[#00f0ff] rounded-xl group-hover:bg-[#00f0ff] group-hover:text-white transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                                <Wrench size={24} />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-panel p-6 hover-card group relative overflow-hidden border-[#ff007f]/30">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff007f]/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>

                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Estimasi Komisi (40%)</p>
                                <h3 className="text-4xl font-bold text-white tracking-tight drop-shadow-[0_0_5px_rgba(255,0,127,0.5)] mt-2">
                                    <span className="text-xl font-medium text-[#ff007f] align-top mr-1">Rp</span>
                                    {mechanicStats ? mechanicStats.estimatedWage.toLocaleString('id-ID') : '...'}
                                </h3>
                            </div>
                            <div className="p-3 bg-[#ff007f]/10 text-[#ff007f] rounded-xl group-hover:bg-[#ff007f] group-hover:text-white transition-colors shadow-[0_0_15px_rgba(255,0,127,0.3)]">
                                <Activity size={24} />
                            </div>
                        </div>

                        <div className="mt-6 text-xs text-slate-400 bg-black/40 p-3 rounded-lg border border-white/5 flex justify-between items-center relative z-10">
                            <span>Total Omset Jasa:</span>
                            <span className="font-bold text-white tracking-wide">Rp {mechanicStats ? mechanicStats.totalRevenueGenerated.toLocaleString('id-ID') : '...'}</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-slate-200">
            <div className="flex justify-between items-end relative z-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Dashboard</h1>
                    <p className="text-[#bae6fd] mt-1 font-medium">Ringkasan aktivitas bengkel hari ini</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden sm:block text-right">
                    <p className="text-xs text-slate-400 uppercase font-medium tracking-wider">Status Toko</p>
                    <div className="flex items-center gap-2 text-[#00f0ff] font-bold bg-[#00f0ff]/10 px-3 py-1 rounded-full mt-1 border border-[#00f0ff]/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f0ff] shadow-[0_0_5px_#00f0ff]"></span>
                        </span>
                        Online
                    </div>
                </motion.div>
            </div>

            {/* Low Stock Alert */}
            <AnimatePresence>
                {stats.lowStockItems.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
                        className="bg-red-500/5 text-red-200 border border-red-500/30 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start shadow-[0_0_20px_rgba(239,68,68,0.1)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[60px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                        <div className="p-3 bg-red-500/20 text-red-500 rounded-xl shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.3)] relative z-10 border border-red-500/30">
                            <AlertTriangle size={24} className="animate-pulse" />
                        </div>
                        <div className="relative z-10 flex-1">
                            <h3 className="text-red-400 font-bold text-lg mb-1 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">Peringatan: Stok Hampir Habis</h3>
                            <p className="text-red-200/70 text-sm mb-4 leading-relaxed max-w-2xl">
                                Ada <strong>{stats.lowStockItems.length} barang</strong> yang stoknya tersisa ≤ 5. Segera lakukan pengadaan (restock) untuk memastikan ketersediaan suku cadang dan meminimalisir hilangnya potensi penjualan.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {stats.lowStockItems.map(item => (
                                    <div key={item.id} className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-red-500/30">
                                        <span className="text-xs font-semibold text-red-300">{item.name}</span>
                                        <span className="bg-red-500 text-white min-w-[24px] text-center px-1.5 py-0.5 rounded flex items-center justify-center font-bold text-[10px] shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                                            {item.stock}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Full-Width Row: Revenue Trend Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
            >
                <div className="glass-panel p-6 hover-card group relative overflow-hidden border-[#00f0ff]/30">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#00f0ff]/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 blur-3xl"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 mb-8 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl font-bold text-white tracking-wide">Tren Pendapatan (7 Hari Terakhir)</h2>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setChartOffsetDays(prev => prev + 7)}
                                        className="p-1.5 rounded bg-white/5 hover:bg-[#00f0ff]/20 text-slate-400 hover:text-[#00f0ff] border border-white/10 hover:border-[#00f0ff]/30 transition-all shadow-sm"
                                        title="Kembali 7 Hari"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setChartOffsetDays(prev => Math.max(0, prev - 7))}
                                        disabled={chartOffsetDays === 0}
                                        className={`p-1.5 rounded border transition-all ${chartOffsetDays === 0 ? 'bg-transparent border-transparent text-slate-100/10 cursor-not-allowed opacity-30 shadow-none' : 'bg-white/5 hover:bg-[#00f0ff]/20 text-slate-400 hover:text-[#00f0ff] border-white/10 hover:border-[#00f0ff]/30 shadow-sm'}`}
                                        title="Maju 7 Hari"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm font-medium">Monitoring performa omset bengkel anda secara real-time</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-4xl font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                                <span className="text-xl font-medium text-slate-500 align-top mr-1">Rp</span>
                                {chartOffsetDays === 0 ? stats.todayIncome.toLocaleString('id-ID') :
                                    (stats.weeklyRevenue.reduce((sum, day) => sum + day.income, 0)).toLocaleString('id-ID')}
                            </h3>
                            <div className="flex items-center justify-end gap-2 text-xs font-bold text-[#00f0ff] mt-1 tracking-widest uppercase">
                                <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse"></span>
                                {chartOffsetDays === 0 ? 'Omset Hari Ini' : 'Total Periode Ini'}
                            </div>
                        </div>
                    </div>

                    <div className="h-64 w-full relative z-10 -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.weeklyRevenue}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="displayDate"
                                    stroke="#475569"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    hide={true}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#00f0ff', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(5, 5, 16, 0.9)',
                                        borderColor: 'rgba(0, 240, 255, 0.3)',
                                        borderRadius: '12px',
                                        boxShadow: '0 0 20px rgba(0,240,255,0.15)',
                                        backdropFilter: 'blur(10px)',
                                        borderWidth: '1px'
                                    }}
                                    itemStyle={{ color: '#00f0ff', fontWeight: 'bold' }}
                                    formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Omzet']}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                />
                                <Area type="monotone" dataKey="income" stroke="#00f0ff" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid below the chart */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10"
            >
                {/* Monthly Income Card */}
                <motion.div variants={itemVariants} className="glass-panel p-6 hover-card group relative overflow-hidden border-emerald-500/30 min-h-[140px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Omset Bulan Ini</p>
                            <div className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                <Calendar size={20} />
                            </div>
                        </div>
                        <h3 className="text-2xl xl:text-3xl font-bold text-white tracking-tight drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
                            <span className="text-sm xl:text-lg font-medium text-slate-500 align-top mr-1">Rp</span>
                            {stats.monthIncome.toLocaleString('id-ID')}
                        </h3>
                    </div>
                </motion.div>

                {/* Monthly Profit Card (Only for Owner) */}
                {userRole !== 'Kasir' ? (
                    <motion.div variants={itemVariants} className="glass-panel p-6 hover-card group text-white relative overflow-hidden border-[#b026ff]/40 transform transition-all duration-300 min-h-[140px] flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#b026ff]/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#b026ff]/30 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-sm font-medium text-[#bae6fd] uppercase tracking-wider">Laba Bersih</p>
                                <div className="text-[#b026ff] drop-shadow-[0_0_10px_rgba(176,38,255,0.5)] bg-[#b026ff]/10 p-2 rounded-lg border border-[#b026ff]/20">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <h3 className="text-2xl xl:text-3xl font-bold text-white tracking-tight drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]">
                                <span className="text-sm xl:text-lg font-medium text-[#b026ff] align-top mr-1 drop-shadow-none">Rp</span>
                                {stats.monthProfit.toLocaleString('id-ID')}
                            </h3>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div variants={itemVariants} className="glass-panel p-6 hover-card group relative overflow-hidden border-sky-500/30 min-h-[140px] flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Target Harian</p>
                                <div className="text-sky-400 bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
                                    <Activity size={20} />
                                </div>
                            </div>
                            <h3 className="text-2xl xl:text-3xl font-bold text-white tracking-tight mt-2 text-glow-sky">
                                85%
                                <span className="text-sm xl:text-base font-medium text-slate-500 ml-1">Tercapai</span>
                            </h3>
                        </div>
                    </motion.div>
                )}

                {/* Customers Card */}
                <motion.div variants={itemVariants} className="glass-panel p-6 hover-card group relative overflow-hidden border-[#ff007f]/30 min-h-[140px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff007f]/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Unit Selesai</p>
                            <div className="text-[#ff007f] drop-shadow-[0_0_10px_rgba(255,0,127,0.5)] bg-[#ff007f]/10 p-2 rounded-lg border border-[#ff007f]/20">
                                <Users size={20} />
                            </div>
                        </div>
                        <h3 className="text-2xl xl:text-3xl font-bold text-white tracking-tight drop-shadow-[0_0_5px_rgba(255,0,127,0.5)]">
                            {stats.todayCustomers}
                            <span className="text-sm xl:text-base font-medium text-slate-500 ml-1">Kendaraan</span>
                        </h3>
                    </div>
                </motion.div>

                {/* Low Stock Card */}
                <motion.div variants={itemVariants} className={`glass-panel p-6 hover-card group relative overflow-hidden min-h-[140px] flex flex-col justify-between ${stats.lowStockItems.length > 0 ? 'border-amber-500/40' : 'border-[#00f0ff]/30'}`}>
                    <div className={`absolute top-0 right-0 w-1 bg-gradient-to-b ${stats.lowStockItems.length > 0 ? 'from-amber-500 to-red-500 shadow-[0_0_15px_rgba(245,158,11,1)]' : 'from-[#00f0ff] to-[#0284c7] shadow-[0_0_15px_rgba(0,240,255,1)]'} h-full`}></div>
                    <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl ${stats.lowStockItems.length > 0 ? 'bg-amber-500/20' : 'bg-[#00f0ff]/10'}`}></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Stok Menipis</p>
                            <div className={`transition-colors drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] p-2 rounded-lg border ${stats.lowStockItems.length > 0 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-[#00f0ff] bg-[#00f0ff]/10 border-[#00f0ff]/20'}`}>
                                <AlertTriangle size={20} />
                            </div>
                        </div>
                        <h3 className={`text-2xl xl:text-3xl font-bold tracking-tight ${stats.lowStockItems.length > 0 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]'}`}>
                            {stats.lowStockItems.length}
                            <span className="text-sm xl:text-base font-medium text-slate-500 ml-1">Item</span>
                        </h3>
                    </div>
                </motion.div>
            </motion.div>

            {/* Low Stock Warning Section */}
            {stats.lowStockItems.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-panel border-amber-500/30 p-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-red-500"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
                            <AlertTriangle size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">
                            Peringatan: Stok Barang Menipis
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.lowStockItems.map(item => (
                            <div key={item.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center hover:bg-black/60 transition-colors group">
                                <div>
                                    <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{item.name}</p>
                                    <p className="text-xs text-slate-400">{item.category}</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                        Sisa: {item.stock}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Dashboard;
